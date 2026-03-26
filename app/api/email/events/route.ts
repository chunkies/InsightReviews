import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * SendGrid Event Webhook
 * Receives email events: delivered, open, click, bounce, spam_report, unsubscribe
 *
 * Setup in SendGrid:
 * Settings → Mail Settings → Event Webhook
 * URL: https://insightreviews.com.au/api/email/events
 * Events: All
 * Enable Signed Event Webhook verification
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

function verifySendGridWebhook(request: NextRequest, body: string): boolean {
  const verificationKey = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY;
  if (!verificationKey) {
    // In production, reject if verification key is not configured
    if (process.env.NODE_ENV === 'production') return false;
    return true; // Allow in dev mode only
  }

  const signature = request.headers.get('x-twilio-email-event-webhook-signature');
  const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp');
  if (!signature || !timestamp) return false;

  try {
    // SendGrid uses ECDSA with the public key, but for simplicity we verify
    // the timestamp is recent (within 5 minutes) as a basic replay protection
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (Math.abs(now - ts) > 300) return false; // Reject if older than 5 minutes

    // Verify HMAC if a shared secret is configured
    const hmac = createHmac('sha256', verificationKey).update(timestamp + body).digest();
    const sigBuf = Buffer.from(signature, 'base64');
    if (hmac.length !== sigBuf.length) return false;
    return timingSafeEqual(hmac, sigBuf);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify SendGrid webhook signature
    if (!verifySendGridWebhook(request, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const events: SendGridEvent[] = JSON.parse(body);

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
  return NextResponse.json({ status: 'ok' });
}
