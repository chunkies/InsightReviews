import { createStripeClient } from '@/lib/stripe/server';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { envRequired } from '@/lib/utils/env';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = createStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, envRequired('STRIPE_WEBHOOK_SECRET'));
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Service role client for webhook processing (bypasses RLS)
  const supabase = createServerClient(
    envRequired('NEXT_PUBLIC_SUPABASE_URL'),
    envRequired('SUPABASE_SERVICE_ROLE_KEY'),
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  // Idempotency check — skip if we've already processed this event
  const { error: idempotencyError } = await supabase
    .from('webhook_events')
    .insert({ stripe_event_id: event.id, event_type: event.type });

  if (idempotencyError?.code === '23505') {
    // Unique constraint violation — already processed
    return NextResponse.json({ received: true, duplicate: true });
  }

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

      // Check if subscription has remaining trial (carried over from app-level trial)
      let billingPlan = 'active';
      let trialEndsAt: string | null = null;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.trial_end && subscription.trial_end * 1000 > Date.now()) {
          billingPlan = 'trial';
          trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
        }
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          billing_plan: billingPlan,
          stripe_subscription_id: subscriptionId,
          ...(trialEndsAt ? { trial_ends_at: trialEndsAt } : {}),
        })
        .eq('id', orgId);
      if (error) {
        console.error('Webhook: Failed to update org after checkout:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const subId = subscription.id;

      const updateData: Record<string, unknown> = {
        stripe_subscription_id: subId,
      };

      if (subscription.status === 'trialing' && subscription.cancel_at_period_end) {
        // Trial cancelled — keep access until trial ends but don't charge after
        updateData.billing_plan = 'cancelling';
        updateData.trial_ends_at = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;
      } else if (subscription.status === 'trialing' && !subscription.cancel_at_period_end) {
        updateData.billing_plan = 'trial';
        updateData.trial_ends_at = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;
      } else if (subscription.status === 'active' && subscription.cancel_at_period_end) {
        updateData.billing_plan = 'cancelling';
        updateData.subscription_ends_at = subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000).toISOString()
          : null;
      } else if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
        updateData.billing_plan = 'active';
        updateData.subscription_ends_at = null;
        updateData.trial_ends_at = null;
      } else if (subscription.status === 'past_due') {
        updateData.billing_plan = 'past_due';
      }

      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('stripe_subscription_id', subId);
      if (error) {
        console.error('Webhook: Failed to update org after subscription update:', error);
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
          .update({ billing_plan: 'active', trial_ends_at: null })
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

    case 'invoice.payment_action_required': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : null;
      if (subId) {
        // Mark as past_due so the dashboard shows a warning
        await supabase
          .from('organizations')
          .update({ billing_plan: 'past_due' })
          .eq('stripe_subscription_id', subId);
      }
      break;
    }

    case 'customer.subscription.trial_will_end': {
      const subscription = event.data.object as Stripe.Subscription;
      const subId = subscription.id;
      // Find the org and send a trial ending notification
      const { data: trialOrg } = await supabase
        .from('organizations')
        .select('id, name, email')
        .eq('stripe_subscription_id', subId)
        .maybeSingle();

      if (trialOrg?.email) {
        // Log activity for dashboard visibility
        await supabase.from('activity_log').insert({
          organization_id: trialOrg.id,
          user_id: null,
          action: 'trial_ending_soon',
          entity_type: 'organization',
          details: { trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const { error } = await supabase
        .from('organizations')
        .update({ billing_plan: 'cancelled', stripe_subscription_id: null, subscription_ends_at: null })
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
