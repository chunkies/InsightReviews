#!/usr/bin/env node
/**
 * Send personalised cold emails to Melbourne businesses (Batch 5)
 * Each email is tailored to the business's category, rating, suburb, and pain points.
 *
 * Usage:
 *   SENDGRID_API_KEY=xxx node marketing/send-batch5.js [--dry-run] [--batch-size=N]
 */

const fs = require('fs');
const path = require('path');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) { console.error('Set SENDGRID_API_KEY'); process.exit(1); }

const DRY_RUN = process.argv.includes('--dry-run');
const batchArg = process.argv.find(a => a.startsWith('--batch-size='));
const BATCH_SIZE = batchArg ? parseInt(batchArg.split('=')[1]) : 999;

const FROM_EMAIL = 'tristan@insightreviews.com.au';
const FROM_NAME = 'Tristan';

// Load targets
const targetsPath = path.join(__dirname, 'batch5-targets.json');
const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));

// Load master list to avoid duplicates
const masterListPath = path.join(__dirname, 'cold-email-master-list.json');
const masterList = JSON.parse(fs.readFileSync(masterListPath, 'utf8'));
const sentEmails = new Set(masterList.map(t => t.email?.toLowerCase()).filter(Boolean));

// ── Email personalisation by category ──────────────────────────────────────

function buildEmail(target) {
  const { email, business_name, rating, category, suburb, summary } = target;

  // Category-specific opener and pain point
  let opener, painPoint, featureHighlight;

  switch (category.toLowerCase()) {
    case 'cafe':
      opener = `I was looking at ${business_name} in ${suburb}`;
      painPoint = `For a cafe, people check Google before deciding where to grab their morning coffee — and a ${rating}-star rating means they'll walk past to the next one.`;
      featureHighlight = `After a customer pays, your staff taps their phone number into the system (takes 5 seconds). The customer gets a quick SMS asking how things were. Loved their flat white? They get nudged to leave a Google review. Had a bad experience? You hear about it privately first.`;
      break;
    case 'restaurant':
      opener = `I came across ${business_name} in ${suburb}`;
      painPoint = `For a restaurant, diners check Google ratings before booking — a ${rating}-star rating can mean empty tables on a Friday night while competitors fill up.`;
      featureHighlight = `Your front-of-house sends a quick SMS after dinner service. Happy diners get nudged to Google to share their experience. If someone had a bad night — cold food, long wait — you hear about it privately before it becomes a 1-star review.`;
      break;
    case 'bar':
    case 'pub':
      opener = `I noticed ${business_name} in ${suburb}`;
      painPoint = `Pubs and bars live and die by word of mouth. A ${rating}-star rating on Google is the new word of mouth — and it's turning people away before they even walk in.`;
      featureHighlight = `Put a QR code on the bar or on table cards. Regulars scan it, tap a rating, done in 20 seconds. Happy punters leave a Google review. If someone had a rough experience, you find out privately and can sort it out.`;
      break;
    case 'bakery':
      opener = `I was checking out ${business_name} in ${suburb}`;
      painPoint = `For a bakery, people often Google "best bakery near me" — and a ${rating}-star rating means you're not showing up in those results.`;
      featureHighlight = `QR code at the counter. Customer scans after picking up their order, taps a star rating, done. Happy customers boost your Google rating. Unhappy ones give you feedback before posting publicly.`;
      break;
    case 'salon':
    case 'beauty':
      opener = `I came across ${business_name} in ${suburb}`;
      painPoint = `In beauty and hair, new clients always check reviews before booking. A ${rating}-star rating creates doubt — even if your regulars love you.`;
      featureHighlight = `After an appointment, send a quick SMS. Clients who loved their cut or treatment get nudged to leave a Google review. If someone's not happy, you hear about it first — before they post publicly.`;
      break;
    case 'dentist':
      opener = `I was looking at ${business_name} in ${suburb}`;
      painPoint = `New patients always Google their dentist before booking. At ${rating} stars, potential patients are scrolling past you to the next practice down the road.`;
      featureHighlight = `After an appointment, your receptionist sends a quick SMS. Patients who had a great experience get nudged to leave a Google review. If someone was unhappy — maybe they waited too long or felt rushed — you hear about it privately first.`;
      break;
    case 'chiro':
    case 'physio':
    case 'optometrist':
      opener = `I noticed ${business_name} in ${suburb}`;
      painPoint = `For a health practice, new patients check Google before their first appointment. A ${rating}-star rating makes them choose someone else — even if your clinical care is excellent.`;
      featureHighlight = `After each appointment, your front desk sends a quick SMS. Happy patients get nudged to leave a Google review. If someone had a bad experience, you hear about it privately — before it becomes a public complaint.`;
      break;
    case 'gym':
      opener = `I was checking out ${business_name} in ${suburb}`;
      painPoint = `People check reviews before signing up for a gym membership. At ${rating} stars, potential members are choosing your competitors — even if your facility is better.`;
      featureHighlight = `Your front desk sends a quick SMS after a member's session. Members who love the gym get nudged to leave a Google review. If someone has a complaint about equipment or classes, you hear about it privately first.`;
      break;
    case 'auto':
      opener = `I came across ${business_name} in ${suburb}`;
      painPoint = `In auto repair, trust is everything — and a ${rating}-star rating is the first thing people see when they Google you. It's costing you jobs every week.`;
      featureHighlight = `After a service, send a quick SMS. Customers who were happy with the work get nudged to leave a Google review. If someone felt overcharged or had an issue, you hear about it before they post a 1-star rant.`;
      break;
    case 'vet':
      opener = `I noticed ${business_name} in ${suburb}`;
      painPoint = `Pet owners are fiercely loyal — but they also check Google before choosing a vet. At ${rating} stars, new pet owners in ${suburb} are going elsewhere.`;
      featureHighlight = `After an appointment, send a quick SMS. Pet owners who had a great experience get nudged to leave a Google review. If someone was unhappy with wait times or pricing, you hear about it privately first.`;
      break;
    case 'florist':
      opener = `I was looking at ${business_name}`;
      painPoint = `For a florist, online reviews directly drive orders — especially for delivery. A ${rating}-star rating means people are choosing competitors for their next anniversary or funeral arrangement.`;
      featureHighlight = `After a delivery, send a quick SMS asking how things went. Happy customers boost your Google rating. If there was an issue with the arrangement or delivery, you hear about it before they post publicly.`;
      break;
    case 'hotel':
    case 'hotel/apartments':
      opener = `I noticed ${business_name} in ${suburb}`;
      painPoint = `Travellers check Google ratings before booking. At ${rating} stars, you're losing bookings to competitors every single day — even if you've improved since those old reviews.`;
      featureHighlight = `At checkout, your front desk sends a quick SMS. Happy guests get nudged to leave a Google review. If someone had issues with their room or service, you hear about it before it becomes a 1-star review on Google.`;
      break;
    default:
      opener = `I came across ${business_name} in ${suburb}`;
      painPoint = `A ${rating}-star rating online means potential customers are choosing your competitors instead — even if your service is better.`;
      featureHighlight = `After a customer visits, your staff sends a quick SMS. Happy customers get nudged to leave a Google review. Unhappy ones give you feedback privately before posting publicly.`;
  }

  const subject = `${business_name} — a thought on your online reviews`;

  const body = `Hi there,

${opener} and noticed you're sitting at around ${rating} stars on Google. ${painPoint}

The frustrating part? Most of your happy customers never think to leave a review. It's the unhappy ones who post — so your rating gets dragged down by a vocal minority.

We built InsightReviews to fix exactly this. Here's how it works:

${featureHighlight}

The result: more genuine 5-star reviews from your actual happy customers, and you catch problems before they go public.

It's $79/mo with a 14-day free trial. Takes about 2 minutes to set up and your staff can start using it immediately — no training needed.

Worth a look? https://insightreviews.com.au

Or just reply to this email — happy to walk you through how it'd work for ${business_name} specifically.

Cheers,
Tristan
InsightReviews`;

  return { to: email, subject, body };
}

// ── Send via SendGrid ──────────────────────────────────────────────────────

async function sendEmail({ to, subject, body }) {
  const payload = {
    personalizations: [{ to: [{ email: to }] }],
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

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const toSend = targets.filter(t => !sentEmails.has(t.email.toLowerCase()));
  const batch = toSend.slice(0, BATCH_SIZE);

  console.log(`\nBatch 5 Cold Email Send`);
  console.log(`${'='.repeat(40)}`);
  console.log(`Total targets: ${targets.length}`);
  console.log(`Already sent: ${targets.length - toSend.length}`);
  console.log(`To send: ${batch.length}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log();

  let sent = 0;
  let failed = 0;

  for (const target of batch) {
    const { to, subject, body } = buildEmail(target);

    if (DRY_RUN) {
      console.log(`[DRY RUN] To: ${to}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Preview: ${body.split('\n').slice(2, 4).join(' ').substring(0, 120)}...`);
      console.log();
      sent++;
      continue;
    }

    try {
      await sendEmail({ to, subject, body });
      sent++;
      console.log(`✓ [${sent}/${batch.length}] ${to} — ${subject}`);

      // Update master list
      masterList.push({
        email: target.email,
        business_name: target.business_name,
        category: target.category,
        rating: target.rating,
        platform: 'Google',
        suburb: target.suburb,
        phone: target.phone || '',
        summary: target.summary || '',
        email1_sent: new Date().toISOString().split('T')[0],
        email2_sent: null,
        email3_sent: null,
      });
      sentEmails.add(target.email.toLowerCase());

      // Rate limit: ~2 emails/sec
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      failed++;
      console.error(`✗ ${to} — ${err.message}`);
    }
  }

  // Save updated master list
  if (!DRY_RUN && sent > 0) {
    fs.writeFileSync(masterListPath, JSON.stringify(masterList, null, 2) + '\n');
    console.log(`\nMaster list updated (${masterList.length} total entries)`);
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Sent: ${sent} | Failed: ${failed}`);
}

main().catch(console.error);
