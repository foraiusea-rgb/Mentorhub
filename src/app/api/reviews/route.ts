import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { reviewSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`reviews:${ip}`, 10, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = reviewSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

  // Verify booking exists and belongs to user
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', result.data.booking_id)
    .eq('status', 'completed')
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found or not completed' }, { status: 404 });
  if (booking.mentee_id !== user.id && booking.mentor_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Determine reviewee (the other person)
  const reviewee_id = user.id === booking.mentee_id ? booking.mentor_id : booking.mentee_id;

  // Check for duplicate review
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', result.data.booking_id)
    .eq('reviewer_id', user.id)
    .single();

  if (existing) return NextResponse.json({ error: 'You already reviewed this session' }, { status: 409 });

  const { data, error } = await supabase.from('reviews').insert({
    booking_id: result.data.booking_id,
    reviewer_id: user.id,
    reviewee_id,
    rating: result.data.rating,
    comment: result.data.comment || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);
  const mentorId = searchParams.get('mentor_id');

  if (!mentorId) return NextResponse.json({ error: 'mentor_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)')
    .eq('reviewee_id', mentorId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
