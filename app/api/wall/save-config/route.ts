import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { requireBilling } from '@/lib/utils/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, wallConfig } = await request.json();

    if (!organizationId || !wallConfig) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user is owner of org
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can customize the wall' }, { status: 403 });
    }

    // Verify active subscription
    const billingError = await requireBilling(supabase, organizationId, user.email);
    if (billingError) return billingError;

    const { data: org, error } = await supabase
      .from('organizations')
      .update({ wall_config: wallConfig })
      .eq('id', organizationId)
      .select('slug')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    // Revalidate cached pages that use this config
    if (org?.slug) {
      revalidatePath(`/wall/${org.slug}`);
      revalidatePath(`/r/${org.slug}`);
    }
    revalidatePath('/dashboard/testimonials');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
