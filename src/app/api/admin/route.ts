import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

// Admin emails — validated at startup
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter((e) => e.length > 0 && e.includes('@'));

// Zod schema for admin PATCH actions
const adminActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('verify_user'),
    user_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal('unverify_user'),
    user_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal('update_role'),
    user_id: z.string().uuid(),
    data: z.object({
      role: z.enum(['mentor', 'mentee', 'both']),
    }),
  }),
  z.object({
    action: z.literal('deactivate_meeting'),
    data: z.object({
      meeting_id: z.string().uuid(),
    }),
  }),
]);

async function isAdmin(request: NextRequest) {
  if (ADMIN_EMAILS.length === 0) return null;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const userEmail = user.email.toLowerCase().trim();
  if (!ADMIN_EMAILS.includes(userEmail)) return null;

  return user;
}

// GET /api/admin — Dashboard stats + user list
export async function GET(request: NextRequest) {
  const user = await isAdmin(request);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Rate limit by user ID, not IP (more reliable)
  const { success } = rateLimit(`admin-get:${user.id}`, 30, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';

  const allowedActions = ['stats', 'users', 'meetings', 'bookings'];
  if (!allowedActions.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  if (action === 'stats') {
    const [profiles, meetings, bookings, payments, reviews] = await Promise.all([
      supabase.from('profiles').select('id, role, created_at, is_verified', { count: 'exact' }),
      supabase.from('meetings').select('id, is_free, price, meeting_type, created_at', { count: 'exact' }),
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

    const signupsByDay: Record<string, number> = {};
    (profiles.data || []).forEach((p: any) => { const day = new Date(p.created_at).toISOString().split('T')[0]; signupsByDay[day] = (signupsByDay[day] || 0) + 1; });

    const bookingsByDay: Record<string, number> = {};
    (bookings.data || []).forEach((b: any) => { const day = new Date(b.created_at).toISOString().split('T')[0]; bookingsByDay[day] = (bookingsByDay[day] || 0) + 1; });

    const revenueByDay: Record<string, number> = {};
    (payments.data || []).filter((p: any) => p.status === 'succeeded').forEach((p: any) => { const day = new Date(p.created_at).toISOString().split('T')[0]; revenueByDay[day] = (revenueByDay[day] || 0) + Number(p.amount); });

    return NextResponse.json({
      totals: { users: profiles.count || 0, mentors: mentorCount, mentees: menteeCount, verified: verifiedCount, meetings: meetings.count || 0, bookings: bookings.count || 0, payments: payments.count || 0, reviews: reviews.count || 0, totalRevenue, avgRating: Math.round(avgRating * 10) / 10 },
      trends: { newUsers30d, newUsers7d, bookings30d },
      charts: { signupsByDay, bookingsByDay, revenueByDay },
    });
  }

  if (action === 'users') {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 20;
    const offset = (page - 1) * limit;
    const { data, count } = await supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    return NextResponse.json({ users: data, total: count, page, limit });
  }

  if (action === 'meetings') {
    const { data } = await supabase.from('meetings').select('*, mentor:profiles(full_name, email)').order('created_at', { ascending: false }).limit(50);
    return NextResponse.json({ meetings: data });
  }

  if (action === 'bookings') {
    const { data } = await supabase.from('bookings').select('*, meeting:meetings(title), mentor:profiles!bookings_mentor_id_fkey(full_name), mentee:profiles!bookings_mentee_id_fkey(full_name)').order('created_at', { ascending: false }).limit(50);
    return NextResponse.json({ bookings: data });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// PATCH /api/admin — User moderation (rate limited + Zod validated)
export async function PATCH(request: NextRequest) {
  const user = await isAdmin(request);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Rate limit mutations strictly by user ID
  const { success } = rateLimit(`admin-patch:${user.id}`, 20, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  // Parse and validate input
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = adminActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const action = parsed.data;

  // Prevent admin from modifying their own account
  if ('user_id' in action && action.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot modify your own account via admin API' }, { status: 400 });
  }

  if (action.action === 'verify_user') {
    const { error } = await supabase.from('profiles').update({ is_verified: true }).eq('id', action.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action.action === 'unverify_user') {
    const { error } = await supabase.from('profiles').update({ is_verified: false }).eq('id', action.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action.action === 'update_role') {
    const { error } = await supabase.from('profiles').update({ role: action.data.role }).eq('id', action.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action.action === 'deactivate_meeting') {
    const { error } = await supabase.from('meetings').update({ is_active: false }).eq('id', action.data.meeting_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
