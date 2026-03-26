import { createClient } from '@/lib/supabase/server';
import { createStripeClient } from '@/lib/stripe/server';
import { PLAN } from '@/lib/utils/constants';
import { envRequired } from '@/lib/utils/env';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await request.json();

    if (!PLAN.priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 400 });
    }

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

    // Get org (include stripe_customer_id to detect returning users)
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, stripe_customer_id, billing_plan, trial_ends_at')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const siteUrl = envRequired('NEXT_PUBLIC_SITE_URL');
    const stripe = createStripeClient();

    // Create or reuse Stripe customer (verify it still exists in Stripe)
    let customerId = org.stripe_customer_id;
    let _customerIsNew = false;
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId);
        // Stripe returns { deleted: true } for deleted customers instead of throwing
        if (existing.deleted) {
          throw new Error('Customer was deleted');
        }
      } catch {
        // Customer doesn't exist in Stripe (deleted or wrong environment) — clear it
        customerId = null;
        await supabase
          .from('organizations')
          .update({ stripe_customer_id: null })
          .eq('id', org.id);
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { organizationId: org.id, orgName: org.name },
      });
      customerId = customer.id;
      _customerIsNew = true;

      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.id);
    }

    // If user is on an active app-level trial, carry remaining days to Stripe
    // so they aren't charged immediately when subscribing early.
    let subscriptionData: Record<string, unknown> = {};
    if (org.billing_plan === 'trial' && org.trial_ends_at) {
      const trialEnd = new Date(org.trial_ends_at);
      const now = new Date();
      if (trialEnd > now) {
        // Carry remaining trial to Stripe (minimum 1 day)
        const remainingSeconds = Math.floor((trialEnd.getTime() - now.getTime()) / 1000);
        if (remainingSeconds > 86400) { // more than 1 day remaining
          subscriptionData = { trial_end: Math.floor(trialEnd.getTime() / 1000) };
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_collection: 'always',
      line_items: [{ price: PLAN.priceId, quantity: 1 }],
      ...(Object.keys(subscriptionData).length > 0 ? { subscription_data: subscriptionData } : {}),
      success_url: `${siteUrl}/dashboard?billing=success`,
      cancel_url: `${siteUrl}/subscribe?org=${org.id}`,
      metadata: { organizationId: org.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
