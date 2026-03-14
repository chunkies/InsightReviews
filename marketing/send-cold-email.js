#!/usr/bin/env node
/**
 * Send personalised cold emails to target businesses
 * Usage: node marketing/send-cold-email.js marketing/email-targets.csv
 *
 * CSV format: email,business_name,first_name,google_rating
 * Example: info@abbeyroadcafe.com.au,Abbey Road Cafe,Sam,3.3
 */

const fs = require('fs');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = 'tristan@insightreviews.com.au';
const FROM_NAME = 'Tristan';

// Email 1 — Introduction (Day 0)
function buildEmail1(businessName, firstName, googleRating) {
  const subject = `${businessName}'s online rating — quick thought`;
  const body = `Hi ${firstName},

I was looking at ${businessName} online and noticed you're sitting at around ${googleRating} stars. Reckon you're doing way better work than that number suggests — most happy customers just don't think to leave a review.

We built InsightReviews to fix exactly this. After a customer visits, your staff enters their phone number, we send a quick SMS asking for feedback, and then smart routing kicks in:

- Happy customers (4-5 stars) get nudged straight to your Google, Yelp, or Facebook page to leave a public review.
- Unhappy customers (1-3 stars) stay private so you can follow up before anything goes public.

More 5-star reviews online, fewer bad surprises. Starts at $79/mo and there's a 14-day free trial — no card required.

Worth a look? You can start here: https://insightreviews.com.au

Or just reply to this email and I'm happy to walk you through it.

Cheers,
Tristan
InsightReviews`;

  return { subject, body };
}

async function sendEmail(toEmail, subject, body) {
  const payload = {
    personalizations: [{ to: [{ email: toEmail }] }],
    from: { email: FROM_EMAIL, name: FROM_NAME },
    reply_to: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    content: [{ type: 'text/plain', value: body }],
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${err}`);
  }

  return true;
}

async function main() {
  if (!SENDGRID_API_KEY) {
    console.error('Set SENDGRID_API_KEY env var');
    process.exit(1);
  }

  const csvFile = process.argv[2];
  if (!csvFile) {
    console.error('Usage: node marketing/send-cold-email.js <csv-file>');
    console.error('CSV format: email,business_name,first_name,google_rating');
    process.exit(1);
  }

  const csv = fs.readFileSync(csvFile, 'utf8').trim();
  const lines = csv.split('\n');

  // Skip header if present
  const start = lines[0].toLowerCase().includes('email') ? 1 : 0;

  let sent = 0;
  let failed = 0;

  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const [email, businessName, firstName, googleRating] = parts;

    if (!email || !businessName || !firstName || !googleRating) {
      console.error(`Skipping line ${i + 1}: missing fields`);
      continue;
    }

    const { subject, body } = buildEmail1(businessName, firstName, googleRating);

    try {
      await sendEmail(email, subject, body);
      console.log(`✓ Sent to ${email} (${businessName})`);
      sent++;

      // Rate limit: max 1 per second
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`✗ Failed ${email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed`);
}

main().catch(console.error);
