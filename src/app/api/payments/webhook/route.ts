import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { meeting_id, slot_id, mentee_id, mentor_id, notes } = session.metadata || {};

      if (!meeting_id || !slot_id || !mentee_id || !mentor_id) break;

      // Create booking
      const { data: booking } = await supabase.rpc('book_slot', {
        p_slot_id: slot_id, p_meeting_id: meeting_id,
        p_mentee_id: mentee_id, p_mentor_id: mentor_id, p_notes: notes || null,
      });

      // Create payment record
      if (booking) {
        await supabase.from('payments').insert({
          booking_id: booking, payer_id: mentee_id, recipient_id: mentor_id,
          amount: (session.amount_total || 0) / 100, currency: session.currency?.toUpperCase() || 'USD',
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          status: 'succeeded',
        });

        // Notify mentor
        await supabase.from('notifications').insert({
          user_id: mentor_id, type: 'new_booking',
          title: 'New booking received!',
          message: `A mentee has booked and paid for a session.`,
          data: { booking_id: booking, meeting_id },
        });
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      if (charge.payment_intent) {
        await supabase.from('payments')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', charge.payment_intent);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
