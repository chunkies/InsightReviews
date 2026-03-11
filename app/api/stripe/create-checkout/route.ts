import { createClient } from '@/lib/supabase/server';
import { createStripeClient } from '@/lib/stripe/server';
import { PLANS } from '@/lib/utils/constants';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, tier = 'starter' } = await request.json();

    // Look up price ID from PLANS based on tier
    const tierKey = tier.toUpperCase() as 'STARTER' | 'GROWTH' | 'AGENCY';
    const plan = PLANS[tierKey];
    if (!plan || typeof plan === 'number' || typeof plan === 'string') {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }
    const priceId = plan.priceId;
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured for this tier' }, { status: 400 });
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
      .select('id, name, stripe_customer_id')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
      },
      success_url: `${siteUrl}/dashboard?billing=success`,
      cancel_url: `${siteUrl}/subscribe?org=${org.id}`,
      metadata: { organizationId: org.id, tier },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
