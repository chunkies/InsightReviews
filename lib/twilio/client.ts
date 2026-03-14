import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

const twilioClient = twilio(accountSid, authToken);

export async function sendSms(to: string, body: string): Promise<string | null> {
  try {
    const message = await twilioClient.messages.create({
      body,
      from: fromNumber,
      to,
    });
    return message.sid;
  } catch (error: unknown) {
    const twilioErr = error as { code?: number; message?: string; moreInfo?: string };
    console.error('Twilio SMS error:', {
      code: twilioErr.code,
      message: twilioErr.message,
      moreInfo: twilioErr.moreInfo,
      to,
      from: fromNumber,
    });
    return null;
  }
}

export function buildReviewLink(siteUrl: string, slug: string): string {
  return `${siteUrl.trim()}/r/${slug}`;
}

export function buildSmsBody(template: string, businessName: string, link: string): string {
  return template
    .replace('{business_name}', businessName)
    .replace('{link}', link);
}
