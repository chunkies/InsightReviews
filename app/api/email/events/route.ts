import { NextRequest, NextResponse } from 'next/server';

/**
 * SendGrid Event Webhook
 * Receives email events: delivered, open, click, bounce, spam_report, unsubscribe
 *
 * Setup in SendGrid:
 * Settings → Mail Settings → Event Webhook
 * URL: https://insightreviews.com.au/api/email/events
 * Events: All
 */

interface SendGridEvent {
  email: string;
  timestamp: number;
  event: 'processed' | 'dropped' | 'delivered' | 'deferred' | 'bounce' | 'open' | 'click' | 'spam_report' | 'unsubscribe' | 'group_unsubscribe' | 'group_resubscribe';
  sg_message_id?: string;
  reason?: string;
  url?: string;
  useragent?: string;
}

export async function POST(request: NextRequest) {
  try {
    const events: SendGridEvent[] = await request.json();

    for (const event of events) {
      const { email, event: eventType, timestamp, reason, url } = event;
      const date = new Date(timestamp * 1000).toISOString();

      switch (eventType) {
        case 'bounce':
          console.log(`[EMAIL BOUNCE] ${email} at ${date} — ${reason}`);
          break;
        case 'spam_report':
          console.log(`[SPAM REPORT] ${email} at ${date}`);
          break;
        case 'open':
          console.log(`[EMAIL OPEN] ${email} at ${date}`);
          break;
        case 'click':
          console.log(`[EMAIL CLICK] ${email} clicked ${url} at ${date}`);
          break;
        case 'delivered':
          console.log(`[EMAIL DELIVERED] ${email} at ${date}`);
          break;
        case 'dropped':
          console.log(`[EMAIL DROPPED] ${email} at ${date} — ${reason}`);
          break;
        default:
          console.log(`[EMAIL EVENT] ${eventType} for ${email} at ${date}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

// SendGrid sends a GET to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'sendgrid-events' });
}
