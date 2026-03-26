import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getGoogleAuthUrl } from '@/lib/integrations/google';
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

    // State encodes org ID for the callback — signed with HMAC to prevent CSRF
    const statePayload = JSON.stringify({
      organizationId: member.organization_id,
      userId: user.id,
      ts: Date.now(),
    });
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const sig = createHmac('sha256', secret).update(statePayload).digest('hex').slice(0, 16);
    const state = Buffer.from(JSON.stringify({ p: statePayload, s: sig })).toString('base64url');

    const authUrl = getGoogleAuthUrl(state);
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('Google connect error:', error);
    const message = error instanceof Error && error.message.includes('Google OAuth not configured')
      ? 'Google integration is not configured. Please contact support.'
      : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
