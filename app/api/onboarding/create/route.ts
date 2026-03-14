import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createStripeClient } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  // Create authenticated client to get user
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { businessName, slug, phone, googleUrl, yelpUrl, facebookUrl } = body;

  if (!businessName || !slug) {
    return NextResponse.json({ error: 'Business name and slug are required' }, { status: 400 });
  }

  // Use service role client to bypass RLS for onboarding
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

  // Check if user already has an org
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.json({ error: 'You already have an organization' }, { status: 409 });
  }

  // Create Stripe customer first
  const stripe = createStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { orgName: businessName },
  });

  // Create organization with billing_plan='pending' — Stripe Checkout will activate the trial
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: businessName,
      slug,
      phone: phone || null,
      billing_plan: 'pending',
      trial_ends_at: null,
      stripe_customer_id: customer.id,
    })
    .select('id')
    .single();

  if (orgError) {
    if (orgError.message.includes('duplicate') || orgError.message.includes('unique')) {
      return NextResponse.json({ error: 'This slug is already taken. Please choose a different one.' }, { status: 409 });
    }
    return NextResponse.json({ error: orgError.message }, { status: 500 });
  }

  // Update Stripe customer metadata with org ID now that we have it
  await stripe.customers.update(customer.id, {
    metadata: { organizationId: org.id, orgName: businessName },
  });

  // Add user as owner
  const { error: memberError } = await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role: 'owner',
  });

  if (memberError) {
    // Cleanup: delete the org we just created
    await supabase.from('organizations').delete().eq('id', org.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Add platforms
  const platforms = [
    { platform: 'google', url: googleUrl },
    { platform: 'yelp', url: yelpUrl },
    { platform: 'facebook', url: facebookUrl },
  ].filter((p) => p.url?.trim());

  if (platforms.length > 0) {
    await supabase.from('review_platforms').insert(
      platforms.map((p, i) => ({
        organization_id: org.id,
        platform: p.platform,
        url: p.url.trim(),
        display_order: i,
      }))
    );
  }

  return NextResponse.json({ orgId: org.id });
}
