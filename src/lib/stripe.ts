import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
});

export async function createCheckoutSession({
  meetingId,
  meetingTitle,
  amount,
  currency,
  mentorStripeAccountId,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  meetingId: string;
  meetingTitle: string;
  amount: number;
  currency: string;
  mentorStripeAccountId?: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: meetingTitle,
            description: `Meeting booking - ${meetingId}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { meeting_id: meetingId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  };

  // If mentor has Stripe Connect, use destination charges
  if (mentorStripeAccountId) {
    params.payment_intent_data = {
      application_fee_amount: Math.round(amount * 100 * 0.1), // 10% platform fee
      transfer_data: { destination: mentorStripeAccountId },
    };
  }

  return stripe.checkout.sessions.create(params);
}

export async function createConnectAccount(email: string, accountId?: string) {
  if (accountId) {
    // Return existing account link for onboarding
    return stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?success=true`,
      type: 'account_onboarding',
    });
  }

  // Create new Express account
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?success=true`,
    type: 'account_onboarding',
  });

  return { accountId: account.id, url: accountLink.url };
}

export async function createRefund(paymentIntentId: string, reason?: string) {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: 'requested_by_customer',
    metadata: { refund_reason: reason || 'Customer requested' },
  });
}
