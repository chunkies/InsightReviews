import { NextRequest, NextResponse } from 'next/server';
import { fireWebhook } from '@/lib/utils/webhook';

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl } = await request.json();

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(webhookUrl);
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
        id: '00000000-0000-0000-0000-000000000000',
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
