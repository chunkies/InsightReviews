import { createClient } from '@/lib/supabase/server';
import { createStripeClient } from '@/lib/stripe/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'No organization' }, { status: 404 });
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id, billing_plan, stripe_customer_id, stripe_subscription_id')
      .eq('id', member.organization_id)
      .single();

    if (!org?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account' }, { status: 400 });
    }

    // Only sync if still pending (webhook hasn't fired yet)
    if (org.billing_plan !== 'pending') {
      return NextResponse.json({ status: org.billing_plan });
    }

    const stripe = createStripeClient();
    const subscriptions = await stripe.subscriptions.list({
      customer: org.stripe_customer_id,
      limit: 1,
    });

    const stripeSub = subscriptions.data[0];
    if (!stripeSub) {
      return NextResponse.json({ status: 'pending' });
    }

    let billingPlan = 'active';
    let trialEndsAt: string | null = null;

    if (stripeSub.status === 'trialing') {
      billingPlan = 'trial';
      trialEndsAt = stripeSub.trial_end
        ? new Date(stripeSub.trial_end * 1000).toISOString()
        : null;
    }

    await supabase
      .from('organizations')
      .update({
        billing_plan: billingPlan,
        stripe_subscription_id: stripeSub.id,
        trial_ends_at: trialEndsAt,
      })
      .eq('id', org.id);

    return NextResponse.json({ status: billingPlan });
  } catch (error) {
    console.error('Stripe sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
