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
  } catch (error) {
    console.error('Twilio SMS error:', error);
    return null;
  }
}

export function buildReviewLink(siteUrl: string, slug: string): string {
  return `${siteUrl}/r/${slug}`;
}

export function buildSmsBody(template: string, businessName: string, link: string): string {
  return template
    .replace('{business_name}', businessName)
    .replace('{link}', link);
}
