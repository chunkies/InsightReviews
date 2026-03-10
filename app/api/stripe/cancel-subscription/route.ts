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

    const { organizationId } = await request.json();

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
      .select('stripe_subscription_id')
      .eq('id', organizationId)
      .single();

    if (!org?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const stripe = createStripeClient();

    // Cancel at period end so they keep access until the billing cycle ends
    await stripe.subscriptions.update(org.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
