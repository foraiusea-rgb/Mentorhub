import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

// Admin emails — add your own here
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase());

async function isAdmin(request: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) return null;
  return user;
}

// GET /api/admin — Dashboard stats + user list
export async function GET(request: NextRequest) {
  const user = await isAdmin(request);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`admin:${ip}`, 30, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';

  if (action === 'stats') {
    const [profiles, meetings, bookings, payments, reviews] = await Promise.all([
      supabase.from('profiles').select('id, role, created_at, is_verified', { count: 'exact' }),
      supabase.from('meetings').select('id, is_free, price, format, created_at', { count: 'exact' }),
      supabase.from('bookings').select('id, status, created_at', { count: 'exact' }),
      supabase.from('payments').select('id, amount, status, created_at', { count: 'exact' }),
      supabase.from('reviews').select('id, rating, created_at', { count: 'exact' }),
    ]);

    const totalRevenue = (payments.data || [])
      .filter((p: any) => p.status === 'succeeded')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newUsers30d = (profiles.data || []).filter((p: any) => new Date(p.created_at) > thirtyDaysAgo).length;
    const newUsers7d = (profiles.data || []).filter((p: any) => new Date(p.created_at) > sevenDaysAgo).length;
    const bookings30d = (bookings.data || []).filter((b: any) => new Date(b.created_at) > thirtyDaysAgo).length;

    const mentorCount = (profiles.data || []).filter((p: any) => p.role === 'mentor' || p.role === 'both').length;
    const menteeCount = (profiles.data || []).filter((p: any) => p.role === 'mentee' || p.role === 'both').length;
    const verifiedCount = (profiles.data || []).filter((p: any) => p.is_verified).length;
    const avgRating = (reviews.data || []).reduce((sum: number, r: any) => sum + r.rating, 0) / Math.max((reviews.data || []).length, 1);

    // Signups per day (last 30 days)
    const signupsByDay: Record<string, number> = {};
    (profiles.data || []).forEach((p: any) => {
      const day = new Date(p.created_at).toISOString().split('T')[0];
      signupsByDay[day] = (signupsByDay[day] || 0) + 1;
    });

    // Bookings per day (last 30 days)
    const bookingsByDay: Record<string, number> = {};
    (bookings.data || []).forEach((b: any) => {
      const day = new Date(b.created_at).toISOString().split('T')[0];
      bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;
    });

    // Revenue per day
    const revenueByDay: Record<string, number> = {};
    (payments.data || []).filter((p: any) => p.status === 'succeeded').forEach((p: any) => {
      const day = new Date(p.created_at).toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + Number(p.amount);
    });

    return NextResponse.json({
      totals: {
        users: profiles.count || 0,
        mentors: mentorCount,
        mentees: menteeCount,
        verified: verifiedCount,
        meetings: meetings.count || 0,
        bookings: bookings.count || 0,
        payments: payments.count || 0,
        reviews: reviews.count || 0,
        totalRevenue,
        avgRating: Math.round(avgRating * 10) / 10,
      },
      trends: {
        newUsers30d,
        newUsers7d,
        bookings30d,
      },
      charts: {
        signupsByDay,
        bookingsByDay,
        revenueByDay,
      },
    });
  }

  if (action === 'users') {
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    const { data, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({ users: data, total: count, page, limit });
  }

  if (action === 'meetings') {
    const { data } = await supabase
      .from('meetings')
      .select('*, mentor:profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(50);
    return NextResponse.json({ meetings: data });
  }

  if (action === 'bookings') {
    const { data } = await supabase
      .from('bookings')
      .select('*, meeting:meetings(title), mentor:profiles!bookings_mentor_id_fkey(full_name), mentee:profiles!bookings_mentee_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(50);
    return NextResponse.json({ bookings: data });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// PATCH /api/admin — User moderation
export async function PATCH(request: NextRequest) {
  const user = await isAdmin(request);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = createServiceRoleClient();
  const { action, user_id, data } = await request.json();

  if (action === 'verify_user') {
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'unverify_user') {
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: false })
      .eq('id', user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'update_role') {
    const { error } = await supabase
      .from('profiles')
      .update({ role: data.role })
      .eq('id', user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'deactivate_meeting') {
    const { error } = await supabase
      .from('meetings')
      .update({ is_active: false })
      .eq('id', data.meeting_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
