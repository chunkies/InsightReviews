import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@insightreviews.com.au';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'InsightReviews';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL-DEV] To: ${params.to} | Subject: ${params.subject}`);
      return true;
    }
    console.error('SENDGRID_API_KEY not configured');
    return false;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: params.subject,
      html: params.html,
      text: params.text,
      headers: {
        'List-Unsubscribe': `<mailto:${FROM_EMAIL}?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    return true;
  } catch (error: unknown) {
    const sgError = error as { response?: { body?: unknown }; message?: string };
    console.error('SendGrid email error:', sgError.response?.body || sgError.message);
    return false;
  }
}

interface SendReviewEmailParams {
  to: string;
  businessName: string;
  reviewLink: string;
  customerName?: string;
}

export async function sendReviewEmail(params: SendReviewEmailParams): Promise<boolean> {
  const { to, businessName, reviewLink, customerName } = params;

  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,';
  const subject = `How was your experience at ${businessName}?`;
  const html = buildEmailHtml({ greeting, businessName, reviewLink });
  const text = buildEmailText({ greeting, businessName, reviewLink });

  return sendEmail({ to, subject, html, text });
}

function buildEmailHtml(params: { greeting: string; businessName: string; reviewLink: string }): string {
  const { greeting, businessName, reviewLink } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #1a1a1a;">${greeting}</h2>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #555; line-height: 1.5;">
          Thanks for visiting <strong>${businessName}</strong>! We&rsquo;d love to hear about your experience.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${reviewLink}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
            Leave Your Review
          </a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #999; text-align: center;">
          It only takes 30 seconds. Your feedback helps us improve!
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function buildEmailText(params: { greeting: string; businessName: string; reviewLink: string }): string {
  const { greeting, businessName, reviewLink } = params;
  return `${greeting}\n\nThanks for visiting ${businessName}! We'd love to hear about your experience.\n\nLeave your review here: ${reviewLink}\n\nIt only takes 30 seconds. Your feedback helps us improve!`;
}

interface SendFollowupEmailParams {
  to: string;
  businessName: string;
  message: string;
  customerName: string;
}

export async function sendFollowupEmail(params: SendFollowupEmailParams): Promise<boolean> {
  const { to, businessName, message, customerName } = params;

  const subject = `A message from ${businessName}`;
  const greeting = `Hi ${customerName},`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #1a1a1a;">${greeting}</h2>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #555; line-height: 1.5;">
          ${message}
        </p>
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #999; text-align: center;">
          &mdash; ${businessName}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `${greeting}\n\n${message}\n\n— ${businessName}`;

  return sendEmail({ to, subject, html, text });
}

interface SendSupportTicketParams {
  orgName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  ticketId: string;
}

export async function sendSupportTicketNotification(params: SendSupportTicketParams): Promise<boolean> {
  const { orgName, userEmail, subject, message, category, priority, ticketId } = params;
  const supportEmail = process.env.SUPPORT_EMAIL || FROM_EMAIL;

  const priorityColors: Record<string, string> = {
    low: '#6b7280',
    normal: '#2563eb',
    high: '#f59e0b',
    urgent: '#dc2626',
  };
  const pColor = priorityColors[priority] || '#2563eb';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #1a1a1a;">New Support Ticket</h2>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #999;">Ticket #${ticketId.slice(0, 8)}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #555; border-bottom: 1px solid #eee;"><strong>From:</strong></td>
            <td style="padding: 8px 0; font-size: 14px; color: #333; border-bottom: 1px solid #eee;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #555; border-bottom: 1px solid #eee;"><strong>Business:</strong></td>
            <td style="padding: 8px 0; font-size: 14px; color: #333; border-bottom: 1px solid #eee;">${orgName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #555; border-bottom: 1px solid #eee;"><strong>Category:</strong></td>
            <td style="padding: 8px 0; font-size: 14px; color: #333; border-bottom: 1px solid #eee;">${category}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #555;"><strong>Priority:</strong></td>
            <td style="padding: 8px 0; font-size: 14px;"><span style="color: ${pColor}; font-weight: 600;">${priority.charAt(0).toUpperCase() + priority.slice(1)}</span></td>
          </tr>
        </table>
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1a1a1a;">${subject}</h3>
        <div style="background: #f9f9f9; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
        <p style="margin: 0; font-size: 13px; color: #999; text-align: center;">
          Reply to this email or respond to ${userEmail} directly.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `New Support Ticket (#${ticketId.slice(0, 8)})\n\nFrom: ${userEmail}\nBusiness: ${orgName}\nCategory: ${category}\nPriority: ${priority}\n\nSubject: ${subject}\n\n${message}\n\nReply to ${userEmail} directly.`;

  return sendEmail({
    to: supportEmail,
    subject: `[Support] ${subject} — ${orgName}`,
    html,
    text,
  });
}

interface SendNegativeReviewNotificationParams {
  to: string;
  businessName: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  customerContact?: string | null;
  dashboardUrl: string;
}

export async function sendNegativeReviewNotification(
  params: SendNegativeReviewNotificationParams
): Promise<boolean> {
  const { to, businessName, rating, comment, customerName, customerContact, dashboardUrl } = params;

  const subject = `New negative review (${rating} star${rating !== 1 ? 's' : ''}) for ${businessName}`;
  const customerLabel = customerName || 'A customer';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #1a1a1a;">Negative Review Alert</h2>
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #555; line-height: 1.5;">
          ${customerLabel} left a <strong>${rating}-star</strong> review for <strong>${businessName}</strong>.
        </p>
        ${comment ? `<div style="background: #f9f9f9; border-left: 4px solid #e53935; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;"><p style="margin: 0; font-size: 14px; color: #333; line-height: 1.5;">&ldquo;${comment}&rdquo;</p></div>` : ''}
        ${customerContact ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: #555;"><strong>Contact:</strong> ${customerContact}</p>` : ''}
        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #e53935 0%, #d32f2f 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
            View in Dashboard
          </a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #999; text-align: center;">
          Consider reaching out to this customer to resolve their concern.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const commentText = comment ? `\n\nTheir comment:\n"${comment}"` : '';
  const contactText = customerContact ? `\n\nContact: ${customerContact}` : '';
  const text = `Negative Review Alert\n\n${customerLabel} left a ${rating}-star review for ${businessName}.${commentText}${contactText}\n\nView in dashboard: ${dashboardUrl}\n\nConsider reaching out to this customer to resolve their concern.`;

  return sendEmail({ to, subject, html, text });
}
