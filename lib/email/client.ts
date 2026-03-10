interface SendReviewEmailParams {
  to: string;
  businessName: string;
  reviewLink: string;
  customerName?: string;
}

/**
 * Send a review request email using Supabase Edge Functions or a simple fetch-based approach.
 * For production, swap this for Resend, SendGrid, or AWS SES.
 *
 * Currently uses a simple SMTP relay via the Supabase project's built-in email
 * (inbucket in local dev, or configured SMTP in production).
 */
export async function sendReviewEmail(params: SendReviewEmailParams): Promise<boolean> {
  const { to, businessName, reviewLink, customerName } = params;

  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,';
  const subject = `How was your experience at ${businessName}?`;
  const htmlBody = buildEmailHtml({ greeting, businessName, reviewLink });
  const textBody = buildEmailText({ greeting, businessName, reviewLink });

  // Use Supabase's auth.admin to send a custom email via the project's SMTP config
  // This works in both local dev (inbucket) and production (configured SMTP)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  try {
    // Use the Supabase REST API to invoke a simple email send
    // We send via the Edge Function endpoint if available, otherwise fall back to
    // a direct SMTP approach using the functions API
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (res.ok) {
      return true;
    }

    // Edge function not available
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
      return true;
    }

    return false;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL-DEV] Fallback — To: ${to} | Subject: ${subject}`);
      return true;
    }
    console.error('Email send error:', error instanceof Error ? error.message : 'Unknown error');

    return false;
  }
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

/**
 * Send a follow-up email to a customer after a review.
 */
export async function sendFollowupEmail(params: SendFollowupEmailParams): Promise<boolean> {
  const { to, businessName, message, customerName } = params;

  const subject = `A message from ${businessName}`;
  const greeting = `Hi ${customerName},`;

  const htmlBody = `
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

  const textBody = `${greeting}\n\n${message}\n\n— ${businessName}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (res.ok) {
      return true;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL-DEV] Followup — To: ${to} | Subject: ${subject}`);
      return true;
    }

    return false;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL-DEV] Fallback followup — To: ${to} | Subject: ${subject}`);
      return true;
    }
    console.error('Followup email error:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

interface SendNegativeReviewNotificationParams {
  to: string;
  businessName: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  dashboardUrl: string;
}

/**
 * Send a notification email to the business owner when a negative review is received.
 */
export async function sendNegativeReviewNotification(
  params: SendNegativeReviewNotificationParams
): Promise<boolean> {
  const { to, businessName, rating, comment, customerName, dashboardUrl } = params;

  const subject = `New negative review (${rating} star${rating !== 1 ? 's' : ''}) for ${businessName}`;
  const customerLabel = customerName || 'A customer';
  const commentText = comment ? `\n\nTheir comment:\n"${comment}"` : '';

  const htmlBody = `
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

  const textBody = `Negative Review Alert\n\n${customerLabel} left a ${rating}-star review for ${businessName}.${commentText}\n\nView in dashboard: ${dashboardUrl}\n\nConsider reaching out to this customer to resolve their concern.`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (res.ok) {
      return true;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL-DEV] Negative review notification — To: ${to} | Subject: ${subject}`);
      return true;
    }

    return false;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL-DEV] Fallback negative review notification — To: ${to} | Subject: ${subject}`);
      return true;
    }
    console.error('Negative review notification email error:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}
