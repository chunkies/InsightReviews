import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fireWebhook } from '@/lib/utils/webhook';
import { requireBilling } from '@/lib/utils/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, webhookUrl } = await request.json();

    if (!organizationId || !webhookUrl || typeof webhookUrl !== 'string') {
      return NextResponse.json({ error: 'Organization ID and webhook URL are required' }, { status: 400 });
    }

    // Verify user belongs to org
    const { data: member } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify active subscription
    const billingError = await requireBilling(supabase, organizationId, user.email);
    if (billingError) return billingError;

    // Validate URL — only allow https in production, block private/internal IPs
    try {
      const parsed = new URL(webhookUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return NextResponse.json({ error: 'Only HTTP(S) URLs are allowed' }, { status: 400 });
      }
      // Block private/internal hostnames and IPs
      const hostname = parsed.hostname.toLowerCase();
      const blockedPatterns = [
        /^localhost$/,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2\d|3[01])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^0\./,
        /^\[::1\]$/,
        /^\[fd/,
        /^\[fe80:/,
        /^metadata\.google\.internal$/,
        /\.internal$/,
        /\.local$/,
      ];
      if (blockedPatterns.some(p => p.test(hostname))) {
        return NextResponse.json({ error: 'Webhook URL must point to a public address' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const testPayload = {
      event: 'webhook.test',
      review: {
        id: '00000000-0000-0000-0000-000000000000',
        rating: 5,
        comment: 'This is a test webhook payload from InsightReviews.',
        customer_name: 'Test Customer',
        is_positive: true,
        created_at: new Date().toISOString(),
      },
      organization: {
        id: organizationId,
        name: 'Test Business',
        slug: 'test-business',
      },
    };

    const success = await fireWebhook(webhookUrl, testPayload);

    if (success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Webhook request failed. Check the URL and try again.' },
      { status: 502 }
    );
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
