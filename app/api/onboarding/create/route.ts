import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
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
    const { businessName, slug, phone, ownerName, googleUrl, yelpUrl, facebookUrl } = body;

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
      .select('id, organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      // If user already has an org (e.g. from a previous interrupted attempt), return it
      return NextResponse.json({ orgId: existingMember.organization_id });
    }

    // Create organization with billing_plan='pending'
    // Stripe customer will be created later during checkout (create-checkout handles this)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: businessName,
        slug,
        phone: phone || null,
        billing_plan: 'pending',
        trial_ends_at: null,
      })
      .select('id')
      .single();

    if (orgError) {
      if (orgError.message.includes('duplicate') || orgError.message.includes('unique')) {
        return NextResponse.json({ error: 'This slug is already taken. Please choose a different one.' }, { status: 409 });
      }
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    // Add user as owner
    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
      email: user.email || null,
      display_name: ownerName || user.user_metadata?.full_name || null,
    });

    if (memberError) {
      // Cleanup: delete the org we just created
      await supabase.from('organizations').delete().eq('id', org.id);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // Create default "Staff" role
    await supabase.from('roles').insert({
      organization_id: org.id,
      name: 'Staff',
      permissions: ['dashboard', 'collect', 'reviews', 'support'],
    });

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
  } catch (error) {
    console.error('Onboarding create error:', error);
    const message = error instanceof Error ? error.message : 'Something went wrong';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
