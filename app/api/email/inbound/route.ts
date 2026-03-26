import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Auth verification via shared secret in URL param
    // Configure in SendGrid Inbound Parse: https://insightreviews.com.au/api/email/inbound?key=YOUR_SECRET
    const inboundSecret = process.env.SENDGRID_INBOUND_SECRET;
    if (!inboundSecret && process.env.NODE_ENV === 'production') {
      console.error('[inbound-email] SENDGRID_INBOUND_SECRET is not set — rejecting request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (inboundSecret) {
      const url = new URL(request.url);
      const providedKey = url.searchParams.get('key');
      if (providedKey !== inboundSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const contentType = request.headers.get('content-type') || '';
    console.log('[inbound-email] Received POST, content-type:', contentType);

    const formData = await request.formData();

    const from = formData.get('from') as string | null;
    const to = formData.get('to') as string | null;
    const subject = formData.get('subject') as string | null;
    const text = formData.get('text') as string | null;
    const html = formData.get('html') as string | null;

    console.log('[inbound-email] Parsed fields:', {
      from: from?.substring(0, 80),
      to: to?.substring(0, 80),
      subject: subject?.substring(0, 80),
      hasText: !!text,
      hasHtml: !!html,
    });

    const forwardSubject = `[FWD from: ${from || 'unknown'}] ${subject || '(no subject)'}`;

    const emailContent: { type: string; value: string }[] = [];
    if (html) {
      emailContent.push({ type: 'text/html', value: html });
    }
    if (text) {
      emailContent.push({ type: 'text/plain', value: text });
    }
    if (emailContent.length === 0) {
      emailContent.push({ type: 'text/plain', value: '(empty email body)' });
    }

    const replyToEmail = from ? extractEmail(from) : null;

    const forwardTo = process.env.SUPPORT_EMAIL || 'support@insightreviews.com.au';
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@insightreviews.com.au';

    const sendgridPayload = {
      personalizations: [
        {
          to: [{ email: forwardTo }],
        },
      ],
      from: {
        email: fromEmail,
        name: 'InsightReviews Inbound',
      },
      ...(replyToEmail ? { reply_to: { email: replyToEmail } } : {}),
      subject: forwardSubject,
      content: emailContent,
    };

    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendgridApiKey) {
      console.error('[inbound-email] SENDGRID_API_KEY is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log('[inbound-email] Sending via SendGrid API...');

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendgridPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[inbound-email] SendGrid send FAILED:', response.status, errorText);
      console.error('[inbound-email] Payload was:', JSON.stringify(sendgridPayload, null, 2));
    } else {
      console.log('[inbound-email] SendGrid send SUCCESS, status:', response.status);
    }

    // Always return 200 to SendGrid Inbound Parse so it doesn't retry
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[inbound-email] Processing error:', error);
    // Return 200 even on error to prevent SendGrid retries
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

/**
 * Extract a bare email address from a "Name <email>" formatted string.
 */
function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from.trim();
}
