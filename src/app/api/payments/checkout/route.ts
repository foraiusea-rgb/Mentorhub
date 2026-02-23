import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { stripe, getStripeAmount } from '@/lib/stripe';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`checkout:${ip}`, 10, 60000);
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { meeting_id, slot_id, notes } = await request.json();

  // Fetch meeting
  const { data: meeting } = await supabase.from('meetings').select('*').eq('id', meeting_id).single();
  if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  if (meeting.is_free) return NextResponse.json({ error: 'This is a free meeting' }, { status: 400 });

  // Fetch slot
  const { data: slot } = await supabase.from('meeting_slots').select('*').eq('id', slot_id).single();
  if (!slot || !slot.is_available) return NextResponse.json({ error: 'Slot not available' }, { status: 400 });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: meeting.currency.toLowerCase(),
            product_data: {
              name: meeting.title,
              description: `${meeting.duration_minutes} min session`,
            },
            unit_amount: getStripeAmount(meeting.price),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?booked=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/meetings/${meeting_id}`,
      metadata: {
        meeting_id, slot_id, mentee_id: user.id, mentor_id: meeting.mentor_id, notes: notes || '',
      },
      customer_email: user.email,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe error:', err);
    return NextResponse.json({ error: 'Payment session creation failed' }, { status: 500 });
  }
}
