import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const from = formData.get('from') as string | null;
    const to = formData.get('to') as string | null;
    const subject = formData.get('subject') as string | null;
    const text = formData.get('text') as string | null;
    const html = formData.get('html') as string | null;

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

    const sendgridPayload = {
      personalizations: [
        {
          to: [{ email: 'sly.tristan1@gmail.com' }],
        },
      ],
      from: {
        email: 'tristan@insightreviews.com.au',
        name: 'InsightReviews Inbound',
      },
      reply_to: from ? { email: extractEmail(from) } : undefined,
      subject: forwardSubject,
      content: emailContent,
    };

    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendgridApiKey) {
      console.error('SENDGRID_API_KEY is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

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
      console.error('SendGrid send failed:', response.status, errorText);
    }

    // Always return 200 to SendGrid Inbound Parse so it doesn't retry
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Inbound email processing error:', error);
    // Return 200 even on error to prevent SendGrid retries
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

/**
 * Extract a bare email address from a "Name <email>" formatted string.
 */
function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from.trim();
}
