import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFacebookAuthUrl } from '@/lib/integrations/facebook';
import { requireBilling } from '@/lib/utils/admin';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can connect integrations' }, { status: 403 });
    }

    const billingError = await requireBilling(supabase, member.organization_id, user.email);
    if (billingError) return billingError;

    const state = Buffer.from(JSON.stringify({
      organizationId: member.organization_id,
      userId: user.id,
    })).toString('base64url');

    const authUrl = getFacebookAuthUrl(state);
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('Facebook connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
