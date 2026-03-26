#!/usr/bin/env node
/**
 * Send the next batch of cold emails from the master list.
 * Reads cold-email-master-list.json, finds unsent targets, sends Email 1,
 * and marks them as sent. Prevents all duplicates.
 *
 * Usage:
 *   SENDGRID_API_KEY=xxx node marketing/send-next-batch.js [options]
 *
 * Options:
 *   --dry-run         Preview without sending
 *   --batch-size=N    Number of emails to send (default: 25, max: 30)
 *   --email=2         Send Email 2 (Day 3 follow-up) to eligible targets
 *   --email=3         Send Email 3 (Day 8 follow-up) to eligible targets
 *   --status          Show current status of all targets
 *   --personal=FILE   Use a JSON file with custom per-business messages
 *                     (format: [{ "email": "...", "subject": "...", "body": "..." }])
 */

const fs = require('fs');
const path = require('path');

const MASTER_LIST_PATH = path.join(__dirname, 'cold-email-master-list.json');
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = 'tristan@insightreviews.com.au';
const FROM_NAME = 'Tristan';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const STATUS_ONLY = args.includes('--status');
const batchArg = args.find((a) => a.startsWith('--batch-size='));
const BATCH_SIZE = Math.min(batchArg ? parseInt(batchArg.split('=')[1]) : 25, 30);
const emailArg = args.find((a) => a.startsWith('--email='));
const EMAIL_NUM = emailArg ? parseInt(emailArg.split('=')[1]) : 1;
const personalArg = args.find((a) => a.startsWith('--personal='));
const PERSONAL_FILE = personalArg ? personalArg.split('=')[1] : null;

// ─── Load master list ────────────────────────────────────────────────────────

function loadMasterList() {
  const raw = fs.readFileSync(MASTER_LIST_PATH, 'utf8');
  return JSON.parse(raw);
}

function saveMasterList(list) {
  fs.writeFileSync(MASTER_LIST_PATH, JSON.stringify(list, null, 2) + '\n');
}

// ─── Email templates ─────────────────────────────────────────────────────────

function buildEmail1(target) {
  const { business_name, rating, category, suburb, summary } = target;

  // Category-specific pain point
  let painPoint = '';
  switch (category.toLowerCase()) {
    case 'dentist':
      painPoint = `For a dental practice, potential patients check Google before booking — a ${rating}-star rating makes them scroll to the next option.`;
      break;
    case 'gym':
      painPoint = `For a gym, people check reviews before signing up for a membership — a ${rating}-star rating creates hesitation.`;
      break;
    case 'auto':
      painPoint = `In auto repair, trust is everything — and a ${rating}-star rating is the first thing people see when they Google you.`;
      break;
    case 'salon':
    case 'beauty':
      painPoint = `For a ${category.toLowerCase()} business, people almost always check reviews before booking — a ${rating}-star rating means lost bookings.`;
      break;
    case 'chiro':
    case 'physio':
      painPoint = `For a health practice, new patients check Google before their first appointment — a ${rating}-star rating makes them choose someone else.`;
      break;
    default:
      painPoint = `A ${rating}-star rating online means potential customers are choosing your competitors instead — even if your service is better.`;
  }

  const subject = `${business_name}'s online rating — quick thought`;
  const body = `Hi there,

I was looking at ${business_name} in ${suburb} and noticed you're sitting at around ${rating} stars online. ${painPoint}

The frustrating part is that most of your happy customers never think to leave a review. It's usually only the unhappy ones who post — so your rating gets skewed.

We built InsightReviews to fix exactly this. After a customer visits, your staff enters their phone number (takes 5 seconds), we send a quick SMS asking for feedback, and then smart routing kicks in:

- Happy customers (4-5 stars) get nudged straight to your Google page to leave a public review.
- Unhappy customers (1-3 stars) stay private so you can follow up before anything goes public.

More 5-star reviews online, fewer bad surprises. It's $49/mo with a 14-day free trial.

Worth a look? https://insightreviews.com.au

Or just reply to this email and I'm happy to walk you through it.

Cheers,
Tristan
InsightReviews`;

  return { subject, body };
}

function buildEmail2(target) {
  const { business_name, first_name, rating } = target;
  const greeting = first_name && first_name !== 'there' ? first_name : 'there';
  const subject = `Re: ${business_name}'s online rating — quick thought`;
  const body = `Hey ${greeting},

Just a quick follow-up. Wanted to share something we've seen across businesses like yours:

Most unhappy customers never complain to you — they just leave a 1-star review. On the flip side, your happiest regulars rarely think to leave a review at all. So your online rating ends up skewed by the handful of people who had a bad day.

That's what smart routing solves. You catch the negatives privately and turn the positives into public reviews. One business owner told us their rating went from 3.6 to 4.4 in about six weeks just by consistently sending the SMS after each visit.

If you're keen to see how it'd work for ${business_name}, the free trial takes about 5 minutes to set up: https://insightreviews.com.au

Happy to answer any questions — just hit reply.

Cheers,
Tristan`;

  return { subject, body };
}

function buildEmail3(target) {
  const { business_name, first_name, rating } = target;
  const greeting = first_name && first_name !== 'there' ? first_name : 'there';
  const subject = `Last one from me`;
  const body = `Hi ${greeting},

I'll keep this short — I know you're busy running ${business_name}.

I reached out last week about getting your online rating up from ${rating} stars. If the timing's not right, no worries at all.

But if more positive reviews and fewer public negatives sounds useful, the 14-day free trial is there whenever you're ready: https://insightreviews.com.au

Either way, hope business is going well. Feel free to reply any time if you want to chat about it down the track.

Cheers,
Tristan
InsightReviews`;

  return { subject, body };
}

// ─── SendGrid sender ─────────────────────────────────────────────────────────

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
    throw new Error(`SendGrid ${res.status}: ${err}`);
  }
  return true;
}

// ─── Status report ───────────────────────────────────────────────────────────

function showStatus(list) {
  const total = list.length;
  const withEmail = list.filter((t) => t.email && t.email !== '—');
  const email1Sent = list.filter((t) => t.email1_sent);
  const email2Sent = list.filter((t) => t.email2_sent);
  const email3Sent = list.filter((t) => t.email3_sent);
  const unsent = withEmail.filter((t) => !t.email1_sent);

  const today = new Date().toISOString().slice(0, 10);
  const email2Eligible = list.filter((t) => {
    if (!t.email1_sent || t.email2_sent) return false;
    const daysSince = (new Date(today) - new Date(t.email1_sent)) / 86400000;
    return daysSince >= 3;
  });
  const email3Eligible = list.filter((t) => {
    if (!t.email2_sent || t.email3_sent) return false;
    const daysSince = (new Date(today) - new Date(t.email2_sent)) / 86400000;
    return daysSince >= 5;
  });

  console.log('=== Cold Email Campaign Status ===');
  console.log(`Total targets:        ${total}`);
  console.log(`With email address:   ${withEmail.length}`);
  console.log(`Email 1 sent:         ${email1Sent.length}`);
  console.log(`Email 2 sent:         ${email2Sent.length}`);
  console.log(`Email 3 sent:         ${email3Sent.length}`);
  console.log(`Unsent (need Email 1):${unsent.length}`);
  console.log(`Ready for Email 2:    ${email2Eligible.length}`);
  console.log(`Ready for Email 3:    ${email3Eligible.length}`);
  console.log();

  // Category breakdown
  const categories = {};
  for (const t of list) {
    const cat = t.category || 'Unknown';
    if (!categories[cat]) categories[cat] = { total: 0, sent: 0 };
    categories[cat].total++;
    if (t.email1_sent) categories[cat].sent++;
  }
  console.log('Category breakdown:');
  for (const [cat, data] of Object.entries(categories).sort()) {
    console.log(`  ${cat}: ${data.sent}/${data.total} sent`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const list = loadMasterList();

  if (STATUS_ONLY) {
    showStatus(list);
    return;
  }

  if (!SENDGRID_API_KEY) {
    console.error('ERROR: Set SENDGRID_API_KEY env var');
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);

  // Load personal messages if provided
  let personalMessages = null;
  if (PERSONAL_FILE) {
    const raw = fs.readFileSync(PERSONAL_FILE, 'utf8');
    personalMessages = JSON.parse(raw);
    console.log(`Loaded ${personalMessages.length} personal messages from ${PERSONAL_FILE}`);
  }

  // Determine which targets to send to
  let targets;
  let buildFn;
  let sentField;

  if (EMAIL_NUM === 1) {
    targets = list
      .filter((t) => t.email && t.email !== '—' && !t.email1_sent)
      .slice(0, BATCH_SIZE);
    buildFn = buildEmail1;
    sentField = 'email1_sent';
  } else if (EMAIL_NUM === 2) {
    targets = list
      .filter((t) => {
        if (!t.email1_sent || t.email2_sent) return false;
        const daysSince = (new Date(today) - new Date(t.email1_sent)) / 86400000;
        return daysSince >= 3;
      })
      .slice(0, BATCH_SIZE);
    buildFn = buildEmail2;
    sentField = 'email2_sent';
  } else if (EMAIL_NUM === 3) {
    targets = list
      .filter((t) => {
        if (!t.email2_sent || t.email3_sent) return false;
        const daysSince = (new Date(today) - new Date(t.email2_sent)) / 86400000;
        return daysSince >= 5;
      })
      .slice(0, BATCH_SIZE);
    buildFn = buildEmail3;
    sentField = 'email3_sent';
  } else {
    console.error('Invalid --email value. Use 1, 2, or 3.');
    process.exit(1);
  }

  if (targets.length === 0) {
    console.log(`No targets ready for Email ${EMAIL_NUM}.`);
    if (EMAIL_NUM === 1) console.log('Add more targets to cold-email-master-list.json');
    if (EMAIL_NUM === 2) console.log('Email 2 requires 3+ days since Email 1');
    if (EMAIL_NUM === 3) console.log('Email 3 requires 5+ days since Email 2');
    return;
  }

  console.log(
    `${DRY_RUN ? '=== DRY RUN ===' : '=== SENDING ==='} Email ${EMAIL_NUM} to ${targets.length} targets\n`
  );

  let sent = 0;
  let failed = 0;

  for (const target of targets) {
    // Check for personal message override
    let subject, body;
    const personal = personalMessages?.find(
      (p) => p.email.toLowerCase() === target.email.toLowerCase()
    );

    if (personal) {
      subject = personal.subject;
      body = personal.body;
    } else {
      const built = buildFn(target);
      subject = built.subject;
      body = built.body;
    }

    if (DRY_RUN) {
      console.log(`--- ${target.business_name} ---`);
      console.log(`To: ${target.email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body.slice(0, 150)}...`);
      console.log();
      sent++;
      continue;
    }

    try {
      await sendEmail(target.email, subject, body);
      console.log(`✓ Sent to ${target.email} (${target.business_name})`);

      // Mark as sent in the master list
      const idx = list.findIndex(
        (t) => t.email.toLowerCase() === target.email.toLowerCase()
      );
      if (idx !== -1) {
        list[idx][sentField] = today;
      }

      sent++;

      // Rate limit: 1.5s between sends
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`✗ Failed ${target.email} (${target.business_name}): ${err.message}`);
      failed++;
    }
  }

  // Save updated master list (even on partial failure)
  if (!DRY_RUN) {
    saveMasterList(list);
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed`);

  if (!DRY_RUN && EMAIL_NUM === 1) {
    console.log(`\nEmail 2 due: ${new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)}`);
    console.log(`Email 3 due: ${new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10)}`);
  }
}

main().catch(console.error);
