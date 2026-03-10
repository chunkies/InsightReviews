import { createStripeClient } from '@/lib/stripe/server';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = createStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Service role client for webhook processing (bypasses RLS)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organizationId;
      if (!orgId) {
        console.error('Webhook: checkout.session.completed missing organizationId in metadata');
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : null;

      // Check if subscription has a trial — if so, set plan to 'trial' with trial end date
      let billingPlan = 'active';
      let trialEndsAt: string | null = null;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.trial_end) {
          billingPlan = 'trial';
          trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
        }
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          billing_plan: billingPlan,
          stripe_subscription_id: subscriptionId,
          trial_ends_at: trialEndsAt,
        })
        .eq('id', orgId);
      if (error) {
        console.error('Webhook: Failed to update org after checkout:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : null;
      if (subId) {
        const { error } = await supabase
          .from('organizations')
          .update({ billing_plan: 'active' })
          .eq('stripe_subscription_id', subId);
        if (error) {
          console.error('Webhook: Failed to update org after payment success:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : null;
      if (subId) {
        const { error } = await supabase
          .from('organizations')
          .update({ billing_plan: 'past_due' })
          .eq('stripe_subscription_id', subId);
        if (error) {
          console.error('Webhook: Failed to update org after payment failure:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const { error } = await supabase
        .from('organizations')
        .update({ billing_plan: 'cancelled', stripe_subscription_id: null })
        .eq('stripe_subscription_id', subscription.id);
      if (error) {
        console.error('Webhook: Failed to update org after subscription deletion:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
