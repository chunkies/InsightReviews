import twilio from 'twilio';
import { envRequired } from '@/lib/utils/env';

function getTwilioClient() {
  return twilio(envRequired('TWILIO_ACCOUNT_SID'), envRequired('TWILIO_AUTH_TOKEN'));
}

function getFromNumber() {
  return envRequired('TWILIO_PHONE_NUMBER');
}

export async function sendSms(to: string, body: string): Promise<string | null> {
  try {
    const message = await getTwilioClient().messages.create({
      body,
      from: getFromNumber(),
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
      from: getFromNumber(),
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
