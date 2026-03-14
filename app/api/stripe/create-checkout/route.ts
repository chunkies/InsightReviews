import { createClient } from '@/lib/supabase/server';
import { createStripeClient } from '@/lib/stripe/server';
import { PLAN } from '@/lib/utils/constants';
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

    // Get org
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, stripe_customer_id, billing_plan')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!.trim();
    const stripe = createStripeClient();

    // Create or reuse Stripe customer
    let customerId = org.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { organizationId: org.id, orgName: org.name },
      });
      customerId = customer.id;

      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.id);
    }

    // Only give trial to new subscribers (not cancelled/returning users)
    const isNewSubscriber = org.billing_plan === 'trial' || org.billing_plan === 'pending' || !org.billing_plan;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_collection: 'always',
      line_items: [{ price: PLAN.priceId, quantity: 1 }],
      ...(isNewSubscriber ? { subscription_data: { trial_period_days: PLAN.trialDays } } : {}),
      success_url: `${siteUrl}/dashboard?billing=success`,
      cancel_url: `${siteUrl}/subscribe?org=${org.id}`,
      metadata: { organizationId: org.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
