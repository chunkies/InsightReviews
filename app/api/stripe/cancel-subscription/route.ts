import { createClient } from '@/lib/supabase/server';
import { createStripeClient } from '@/lib/stripe/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, cancelTrial } = await request.json();

    // Verify user is owner
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_subscription_id, billing_plan')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Cancel trial — keep access until trial_ends_at, then block
    if (cancelTrial && org.billing_plan === 'trial') {
      // If there's a Stripe subscription (trial via Stripe), cancel it too
      if (org.stripe_subscription_id) {
        try {
          const stripe = createStripeClient();
          await stripe.subscriptions.cancel(org.stripe_subscription_id);
        } catch (e) {
          console.error('Failed to cancel Stripe trial subscription:', e);
        }
      }

      await supabase
        .from('organizations')
        .update({
          billing_plan: 'cancelling',
          stripe_subscription_id: null,
        })
        .eq('id', organizationId);

      return NextResponse.json({ success: true });
    }

    // Cancel paid Stripe subscription
    if (!org.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const stripe = createStripeClient();

    // Cancel at period end so they keep access until the billing cycle ends
    await stripe.subscriptions.update(org.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Retrieve updated subscription to get cancel_at
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);

    const periodEnd = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from('organizations')
      .update({
        billing_plan: 'cancelling',
        subscription_ends_at: periodEnd,
      })
      .eq('id', organizationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
