import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { bookingSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

// GET user's bookings
export async function GET(request: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('bookings')
    .select('*, meeting:meetings(*), slot:meeting_slots(*), mentor:profiles!bookings_mentor_id_fkey(*), mentee:profiles!bookings_mentee_id_fkey(*)')
    .or(`mentee_id.eq.${user.id},mentor_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST create booking (for free meetings)
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`bookings:${ip}`, 10, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = bookingSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

  // Verify meeting is free
  const { data: meeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', result.data.meeting_id)
    .single();

  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  if (!meeting.is_free) return NextResponse.json({ error: 'This meeting requires payment. Use /api/payments/checkout' }, { status: 400 });

  // Prevent double booking
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('slot_id', result.data.slot_id)
    .eq('mentee_id', user.id)
    .in('status', ['pending', 'confirmed'])
    .single();

  if (existing) return NextResponse.json({ error: 'You already have a booking for this slot' }, { status: 409 });

  // Prevent self-booking
  if (user.id === meeting.mentor_id) {
    return NextResponse.json({ error: 'Cannot book your own meeting' }, { status: 400 });
  }

  // Book atomically
  const { data: bookingId, error } = await supabase.rpc('book_slot', {
    p_slot_id: result.data.slot_id,
    p_meeting_id: result.data.meeting_id,
    p_mentee_id: user.id,
    p_mentor_id: meeting.mentor_id,
    p_notes: result.data.notes || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify mentor
  await supabase.from('notifications').insert({
    user_id: meeting.mentor_id,
    type: 'new_booking',
    title: 'New session booked!',
    message: `Someone booked "${meeting.title}"`,
    data: { booking_id: bookingId, meeting_id: meeting.id },
  });

  return NextResponse.json({ booking_id: bookingId }, { status: 201 });
}

// PATCH cancel/complete booking
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { booking_id, action, reason } = await request.json();

  if (!booking_id || !action) {
    return NextResponse.json({ error: 'booking_id and action required' }, { status: 400 });
  }

  // Verify ownership
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.mentee_id !== user.id && booking.mentor_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (action === 'cancel') {
    if (booking.status !== 'confirmed' && booking.status !== 'pending') {
      return NextResponse.json({ error: 'Cannot cancel this booking' }, { status: 400 });
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancellation_reason: reason || null })
      .eq('id', booking_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Restore slot
    await supabase
      .from('meeting_slots')
      .update({ spots_taken: booking.slot_id ? undefined : 0, is_available: true })
      .eq('id', booking.slot_id);

    // Re-calculate spots_taken correctly
    await supabase.rpc('restore_slot_spot', { p_slot_id: booking.slot_id }).catch(() => {
      // Fallback: just make slot available again
      supabase.from('meeting_slots').update({ is_available: true }).eq('id', booking.slot_id);
    });

    // Notify other party
    const notifyUserId = user.id === booking.mentee_id ? booking.mentor_id : booking.mentee_id;
    await supabase.from('notifications').insert({
      user_id: notifyUserId,
      type: 'booking_cancelled',
      title: 'Booking cancelled',
      message: reason || 'A booking has been cancelled.',
      data: { booking_id },
    });

    return NextResponse.json({ status: 'cancelled' });
  }

  if (action === 'complete') {
    if (booking.mentor_id !== user.id) {
      return NextResponse.json({ error: 'Only the mentor can complete sessions' }, { status: 403 });
    }
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', booking_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: 'completed' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
