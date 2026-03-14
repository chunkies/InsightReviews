#!/usr/bin/env node
/**
 * Send PERSONALISED cold emails to batch 4 targets
 * Each business gets a unique, tailored message referencing their specific situation.
 *
 * Usage: SENDGRID_API_KEY=xxx node marketing/send-cold-email-batch4.js
 *
 * Dry run (preview without sending):
 *   SENDGRID_API_KEY=xxx node marketing/send-cold-email-batch4.js --dry-run
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = 'tristan@insightreviews.com.au';
const FROM_NAME = 'Tristan';
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Personalised emails per business ────────────────────────────────────────

const emails = [
  // ── DENTISTS ──────────────────────────────────────────────────────────────
  {
    to: 'reception@artdedente.com.au',
    business: 'Art De Dente',
    subject: "Art De Dente's online reviews — a quick idea",
    body: `Hi there,

I came across Art De Dente while looking at dental clinics in the CBD and noticed your online rating is sitting lower than I'd expect for a practice on Queen Street with multilingual staff and extended hours. That kind of accessibility is genuinely hard to find — but I reckon the rating doesn't reflect it.

Here's the thing: most patients who have a great experience just don't think to leave a review. The ones who do post tend to be the unhappy ones. So the rating gets skewed.

We built InsightReviews specifically for this. After a patient's appointment, your reception sends a quick SMS asking for feedback. If they're happy (4-5 stars), they get nudged to leave a Google review. If they're not (1-3 stars), the feedback stays private so you can follow up directly.

It's $79/mo with a 14-day free trial — no card needed. A couple of weeks of consistent use and you'd start to see the rating shift.

Worth a look? https://insightreviews.com.au

Happy to chat if you've got questions — just reply to this email.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'citydentalcare200spencer@gmail.com',
    business: 'Australian Dentists Clinic',
    subject: "Thought about Australian Dentists Clinic's Google reviews",
    body: `Hi there,

I noticed Australian Dentists Clinic is open 7 days a week — that's a real advantage in the CBD. But your Google reviews mention things like wait times and rushing, which is dragging your rating down to around 3.5 stars.

The frustrating part is that you're probably seeing hundreds of patients who leave happy and never think to post about it. Meanwhile, the few who had a bad day are the loudest voices online.

We built a tool called InsightReviews that fixes this. Your front desk sends a quick SMS after each appointment — takes 5 seconds. Happy patients get nudged to leave a Google review. Unhappy ones give you private feedback so you can sort it out before it goes public.

$79/mo, 14-day free trial, no card required. For a 7-day practice with high patient volume, it pays for itself fast.

Have a look here: https://insightreviews.com.au

Or just hit reply — happy to walk you through it.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'info@southmelbournedental.com.au',
    business: 'South Melbourne Dental Group',
    subject: "South Melbourne Dental Group — quick thought on your reviews",
    body: `Hi there,

I've been looking at dental practices in South Melbourne and came across your clinic on Park Street. You've clearly been around a while and have an experienced team — but your Google reviews tell a mixed story, sitting around 3.5 stars.

From what I can see, the negative reviews mention reception experience and communication. Those kinds of things are fixable — but the reviews stick around forever. The challenge is that your satisfied patients (probably the majority) aren't posting.

We built InsightReviews to solve exactly this. After each appointment, your reception sends a 5-second SMS to the patient. If they're happy, they get guided to your Google page. If something went wrong, you hear about it privately first.

It's $79/mo with a 14-day free trial. For an established practice like yours, even a 0.5 star increase can meaningfully change how many new patients find you on Google.

Worth a look: https://insightreviews.com.au

Happy to answer any questions — just reply here.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'info@dentalonflinders.com.au',
    business: 'Dental On Flinders',
    subject: "Dental On Flinders — a way to boost your Google rating",
    body: `Hi there,

I noticed Dental On Flinders on Flinders Street is sitting around 3.5 stars on Google. For a CBD dental clinic, that's the kind of rating that makes potential patients scroll past to the next option — even if your clinical work is excellent.

The pattern I see is common: a handful of reviews about wait times overshadow what's probably hundreds of positive patient experiences that never get posted.

We built InsightReviews to flip that ratio. Your front desk sends a quick SMS after appointments — literally takes 5 seconds. Patients who had a great experience get nudged to Google. Those who didn't give you private feedback instead.

$79/mo, 14-day free trial, no card needed. Most dental practices see a noticeable shift within 4-6 weeks of consistent use.

Check it out here: https://insightreviews.com.au

Or reply to this email and I'll walk you through how it works for dental practices specifically.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'reception@bfds.com.au',
    business: 'Brunswick Family Dental Surgery',
    subject: "Brunswick Family Dental — your reviews don't match your reputation",
    body: `Hi there,

I came across Brunswick Family Dental Surgery on DeCarle Street. You've been serving the Brunswick community for years — but your online reviews are sitting around 3.8 stars, which doesn't really reflect a practice with that kind of track record.

For a family dental practice, word of mouth has always been the main driver. But these days, new families in the area check Google first. A 3.8 vs a 4.5 can be the difference between getting that new patient or not.

We built InsightReviews to help practices like yours. After each appointment, reception sends a quick SMS. Happy patients get nudged to leave a Google review. If someone's unhappy, you hear about it privately before it becomes a public review.

It's $79/mo with a free 14-day trial. For a community practice, even 2-3 new positive reviews a month compounds quickly.

Worth a look? https://insightreviews.com.au

Happy to chat — just reply here.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'info@freedomdental.com.au',
    business: 'Freedom Dental',
    subject: "Freedom Dental's online rating — quick idea",
    body: `Hi there,

I was looking at Freedom Dental on Albert Road and noticed you're sitting around 3.5 stars online. Given that you offer cosmetic and general dentistry in a competitive area near St Kilda Road, that rating is costing you patients — especially for cosmetic work where people research heavily before choosing.

The pattern is predictable: patients who get great cosmetic results are thrilled but rarely post about it. The few who had scheduling issues or cost surprises are the ones who leave reviews.

We built InsightReviews to fix this. After each appointment, your team sends a quick SMS. Happy patients get guided to your Google page. Unhappy ones give private feedback so you can address it before it goes public.

$79/mo, 14-day free trial. For a cosmetic dental practice, the ROI on a higher Google rating is massive — people are choosing between you and competitors based on those stars.

Have a look: https://insightreviews.com.au

Or just reply and I'll explain how other dental practices are using it.

Cheers,
Tristan
InsightReviews`,
  },

  // ── GYMS ──────────────────────────────────────────────────────────────────
  {
    to: 'support@revofitness.com.au',
    business: 'Revo Fitness Maribyrnong',
    subject: "Revo Fitness Maribyrnong — catching negative reviews before they go public",
    body: `Hi there,

I've been looking at Revo Fitness reviews and noticed the Maribyrnong location is copping a beating online — around 2.0 stars on ProductReview. Most of the complaints are about billing and cancellation issues, not the actual gym experience.

That's the worst kind of review problem — operational issues drowning out what's probably a solid gym at a great price point. And at $9.69/week, you're attracting a high volume of members, which means even a small percentage of unhappy ones creates a lot of noise.

We built InsightReviews for exactly this. After a member visits, you send a quick SMS asking for feedback. Happy members get nudged to leave a Google review. Unhappy ones give you private feedback — so you can sort out the billing issue BEFORE it becomes a 1-star review.

$79/mo with a 14-day free trial. At your member volume, intercepting even a few negative reviews per month would make a real difference to the Maribyrnong location's rating.

Worth a look: https://insightreviews.com.au

Happy to chat about how it works for gyms — just reply here.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'customerservice@southpacifichc.com.au',
    business: 'South Pacific Health Club',
    subject: "South Pacific Health Club's online ratings — a thought",
    body: `Hi there,

I've been looking at South Pacific Health Club and noticed your online ratings are sitting around 2.5 stars on some review platforms. The complaints are mostly about billing and customer service, which is overshadowing what looks like genuinely good facilities — especially the St Kilda Sea Baths location.

The challenge with gyms is that members who love it just keep coming back quietly. But when someone has a billing issue, they're fired up enough to post. So the vocal minority dominates your public profile.

We built InsightReviews to fix this. After a member's session, you send a quick SMS. Happy members get nudged to post a Google review. Unhappy ones give private feedback — so you can resolve the issue before it goes public.

$79/mo per location, 14-day free trial. For a multi-location club like yours, getting the ratings up across all locations would be a genuine competitive advantage.

Check it out: https://insightreviews.com.au

Happy to discuss — just reply here.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'melbournecbd@snapfitness.com.au',
    business: 'Snap Fitness Melbourne CBD',
    subject: "Snap Fitness Queen St — boosting your local reviews",
    body: `Hi there,

I noticed Snap Fitness on Queen Street is sitting around 3.0 stars on Yelp. For a 24/7 gym in the CBD, that's a rating that makes people look at the competition — even though 24/7 access is a genuine differentiator.

Most of the reviews mention facility maintenance, but I'd bet the majority of your members are happy with the convenience and just never think to post about it.

We built InsightReviews to change that. After a member visits, you send a 5-second SMS. Happy members get nudged to leave a Google review. If someone's got a complaint about a broken machine or cleanliness, you hear about it privately first.

$79/mo, 14-day free trial. As a franchise operator, your local rating is what separates you from the Snap down the road — this is how you take control of it.

Worth a look: https://insightreviews.com.au

Happy to chat — just reply.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'collins@virginactive.com.au',
    business: 'Virgin Active Collins Street',
    subject: "Virgin Active Collins St — your reviews vs your experience",
    body: `Hi there,

I was looking at Virgin Active on Collins Street and noticed you're at around 3.5 stars on Yelp with 19 reviews. For a premium gym charging $50+/week, that rating creates a real disconnect — people expect a 4.5+ experience at that price point, and the rating makes them hesitate.

The reviews mention value for money and class availability. But I'd reckon most of your members who love the facilities, the pool, the classes — they just don't think to post about it.

We built InsightReviews to fix that gap. After a member's session, your team sends a quick SMS. Members who had a great class or workout get nudged to Google. If someone's frustrated about a full class or equipment wait, you hear about it privately first.

$79/mo, 14-day free trial. For a premium brand, the rating matters more than anyone — it's the first thing prospects check before committing to a membership at your price point.

Take a look: https://insightreviews.com.au

Happy to discuss — just reply here.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'city@dohertysgym.com',
    business: "Doherty's Gym",
    subject: "Doherty's Gym — protecting a Melbourne institution's reputation",
    body: `Hi there,

Doherty's is a Melbourne institution — the Banana Alley Vaults location has been a landmark for serious lifters for decades. But I noticed your online rating is around 3.5 stars, with some reviews mentioning equipment age and hygiene.

For a gym with your history and loyal community, those reviews don't tell the real story. Your regulars would probably rave about the atmosphere, the no-nonsense culture, and the community — but they're not posting reviews because they've been coming for years.

We built InsightReviews to help businesses like yours get the full picture online. After a session, you send a quick SMS. Members who love the gym get nudged to post on Google. If someone has a complaint, you hear about it privately first.

$79/mo, 14-day free trial. For Doherty's, even 5-10 new reviews from loyal members would shift the rating significantly and better reflect what the gym actually is.

Have a look: https://insightreviews.com.au

Or just reply — happy to chat about it.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'melbournecity@fernwoodfitness.com.au',
    business: 'Fernwood Fitness Melbourne',
    subject: "Fernwood Melbourne City — getting your rating to reflect the experience",
    body: `Hi there,

I noticed Fernwood Fitness on Flinders Lane is sitting around 3.5 stars on Yelp. For a women-only gym — which is a genuine differentiator in the CBD — that rating undersells what you offer.

The reviews mention staffing and scheduling, but I'd bet the vast majority of your members appreciate the women-only environment, the group classes, and the community. They just don't think to post about it.

We built InsightReviews to change that. After a member's visit, your front desk sends a quick SMS. Members who had a great session get nudged to leave a Google review. If someone has a scheduling complaint, you hear about it privately before it goes online.

$79/mo, 14-day free trial. For a women-only gym competing against mixed gyms on price, your reviews and rating are a key part of the value proposition — they need to reflect the experience.

Worth a look: https://insightreviews.com.au

Happy to chat — just reply here.

Cheers,
Tristan
InsightReviews`,
  },

  // ── AUTO / MECHANICS ──────────────────────────────────────────────────────
  {
    to: 'info@acemechanics.com.au',
    business: 'Ace Mechanics',
    subject: "Ace Mechanics — turning around your online reputation",
    body: `Hi there,

I'll be straight with you — I looked at Ace Mechanics on Little Collins Street and your Yelp rating is sitting at 1.8 stars. That's tough, especially for a CBD mechanic where trust is everything.

The reviews mention pricing and communication issues. Whether those reflect the current experience or not, they're the first thing a potential customer sees when they Google you. And in auto repair, people won't book without checking reviews first.

We built InsightReviews specifically for situations like this. After a customer picks up their car, your team sends a quick SMS asking for feedback. If they're happy with the work, they get nudged to leave a Google review. If they're not, you hear about it privately — so you can make it right before it becomes another 1-star review.

$79/mo, 14-day free trial. For Ace, this is about rebuilding trust online. A consistent flow of positive reviews from satisfied customers would gradually push the rating up and change the first impression people get.

Take a look: https://insightreviews.com.au

Happy to have a chat about it — just reply here.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'sales@k1motors.com.au',
    business: 'K1 Motors',
    subject: "K1 Motors — getting more positive reviews from your customers",
    body: `Hi there,

I came across K1 Motors in Clayton and noticed your online reviews are mixed — around 3.0 stars. Some of the negative feedback mentions communication and pricing surprises, which in the mechanic world can tank a reputation fast.

The frustrating thing is that most of your customers probably drive away happy. But happy customers don't think to leave a review — it's only when something goes wrong that people are motivated to post.

We built InsightReviews to flip that. After a customer picks up their car, you send a quick SMS. If they're happy with the service, they get nudged straight to your Google page. If they're not, you get private feedback and a chance to sort it out before it goes public.

$79/mo, 14-day free trial. For a mechanic shop, every 0.5 star increase on Google brings in more calls. It's one of the highest-ROI things you can do.

Check it out: https://insightreviews.com.au

Or just reply — happy to walk you through it.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'david@collisions.com.au',
    business: 'Melbourne Collision Repair Centre',
    subject: "Melbourne Collision Repair Centre — managing your online reviews",
    body: `Hi David,

I've been looking at Melbourne Collision Repair Centre and noticed your ProductReview rating is around 2.5 stars. Some of the reviews mention pricing disputes and turnaround times — the kind of complaints that are absolutely devastating in the smash repair industry, where customers are already stressed about their car.

With 5 locations and 40+ years of experience, your track record speaks for itself. But online reviews are now the first thing people check — even when their insurer recommends you. A low rating creates doubt.

We built InsightReviews to help businesses like yours take control. When a customer picks up their repaired car and they're happy with the result, your team sends a quick SMS. They get nudged to leave a Google review. If something went wrong, you hear about it privately first — giving you a chance to fix it before it becomes public.

$79/mo per location, 14-day free trial. For a multi-location operation, getting all 5 locations' ratings up would be a significant competitive advantage.

Worth a look: https://insightreviews.com.au

Happy to discuss — just reply here.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'sales@yarraville.midas.com.au',
    business: 'Midas Yarraville',
    subject: "Midas Yarraville — standing out from other Midas locations",
    body: `Hi there,

I noticed Midas Yarraville on Williamstown Road is sitting at about 3.2 stars on Yelp. As a franchise operator, your local rating is what separates you from every other Midas — and from independent mechanics in the area.

The challenge with franchise mechanics is that customers often review "Midas" the brand rather than your specific location. But your local Google rating is what shows up when someone in Yarraville searches for a mechanic.

We built InsightReviews to help local operators take control of their reviews. After a service, your team sends a quick SMS. Happy customers get nudged to leave a Google review specifically for your location. Unhappy ones give private feedback so you can follow up.

$79/mo, 14-day free trial. For a franchise operator, this is how you build a local reputation that goes beyond the brand name.

Have a look: https://insightreviews.com.au

Happy to chat — just reply here.

Cheers,
Tristan
InsightReviews`,
  },

  // ── BEAUTY / WELLNESS ─────────────────────────────────────────────────────
  {
    to: 'orchiddayspa@bigpond.com',
    business: 'Orchid Day Spa',
    subject: "Orchid Day Spa — getting your Google reviews to match the experience",
    body: `Hi there,

I came across Orchid Day Spa on Hardware Lane and noticed your Google reviews are sitting around 3.2 stars. For a day spa in a prime CBD laneway location, that rating is holding you back — especially since most people book spa treatments based on reviews.

The negative reviews mention feeling rushed, which is the opposite of what a spa experience should feel like. But I'd bet the majority of your clients leave feeling relaxed and pampered — they just don't think to post about it afterwards.

We built InsightReviews to change that. After a client's treatment, you send a quick SMS. Clients who loved the experience get nudged to leave a Google review. If someone felt rushed, you hear about it privately and can offer to make it right.

$79/mo, 14-day free trial. For a spa, the reviews ARE the marketing — this is probably the highest-ROI thing you can invest in.

Check it out: https://insightreviews.com.au

Happy to chat — just reply.

Cheers,
Tristan
InsightReviews`,
  },

  // ── PHYSIO / CHIRO ────────────────────────────────────────────────────────
  {
    to: 'office@citychiro.com.au',
    business: 'Melbourne City Chiropractic',
    subject: "Melbourne City Chiropractic — building your review presence",
    body: `Hi there,

I noticed Melbourne City Chiropractic on Little Collins Street has a relatively low review count online. For a CBD chiro practice, that's a missed opportunity — when someone searches "chiropractor Melbourne CBD", the practices with more reviews and higher ratings win the click.

Most chiro patients are regulars who come back week after week. They're your biggest fans — but they've never been asked to leave a review. Meanwhile, the rare unhappy patient is often the only one who posts.

We built InsightReviews to solve this. After an adjustment, your front desk sends a quick SMS. Patients who feel great get nudged to leave a Google review. If someone's not happy, you get private feedback first.

$79/mo, 14-day free trial. For a practice that relies on local search visibility, building up your review count and rating is one of the fastest ways to get more new patients through the door.

Worth a look: https://insightreviews.com.au

Or just reply — happy to explain how it works for health practices.

Cheers,
Tristan
InsightReviews`,
  },

  // ── RESTAURANTS / CAFES ───────────────────────────────────────────────────
  {
    to: 'enquiry@theboatbuildersyard.com.au',
    business: 'The Boatbuilders Yard',
    subject: "The Boatbuilders Yard — turning foot traffic into 5-star reviews",
    body: `Hi there,

I've been looking at The Boatbuilders Yard on South Wharf and noticed you're sitting at 3.5 stars on Yelp with 42 reviews. For an award-winning waterfront venue with that kind of foot traffic, the rating should be higher.

The reviews mention slow service — which at a busy venue is almost inevitable during peak times. But the atmosphere, the location, the food — those are the things most of your customers love and never think to review.

We built InsightReviews to help venues like yours get the full picture online. After a visit, you send a quick SMS to customers. Happy ones get nudged to leave a Google or Yelp review. If someone waited too long and is frustrated, you hear about it privately first.

$79/mo, 14-day free trial. For a venue at South Wharf competing for tourist and event traffic, your online rating directly impacts bookings — especially for functions and group events.

Have a look: https://insightreviews.com.au

Happy to chat — just reply.

Cheers,
Tristan
InsightReviews`,
  },
  {
    to: 'orders@brunettioro.com',
    business: 'Brunetti Oro',
    subject: "Brunetti Oro Flinders Lane — your rating vs your brand",
    body: `Hi there,

Brunetti is a Melbourne icon — so I was surprised to see the Flinders Lane location sitting at 3.8 stars on Yelp. For a brand with your heritage, that number should be 4.5+.

The reviews mention service speed and pricing, which is interesting because at a high-traffic CBD location, those are almost inevitable pain points. Meanwhile, the pastries, the coffee, the atmosphere — the things that make Brunetti special — don't get enough airtime in the reviews.

We built InsightReviews to fix this imbalance. After a customer visits, you send a quick SMS. Customers who loved the experience get nudged to leave a Google review. If someone felt overcharged or waited too long, you get private feedback and a chance to respond.

$79/mo, 14-day free trial. For an iconic brand like Brunetti, the online rating needs to match the reputation — right now there's a gap.

Worth a look: https://insightreviews.com.au

Happy to discuss — just reply here.

Cheers,
Tristan
InsightReviews`,
  },
];

// ─── Sending logic ───────────────────────────────────────────────────────────

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
    console.error('ERROR: Set SENDGRID_API_KEY env var');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('=== DRY RUN MODE — no emails will be sent ===\n');
  }

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    if (DRY_RUN) {
      console.log(`--- ${email.business} ---`);
      console.log(`To: ${email.to}`);
      console.log(`Subject: ${email.subject}`);
      console.log(`Body preview: ${email.body.slice(0, 120)}...`);
      console.log();
      sent++;
      continue;
    }

    try {
      await sendEmail(email.to, email.subject, email.body);
      console.log(`✓ Sent to ${email.to} (${email.business})`);
      sent++;

      // Rate limit: 1.5 seconds between sends
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`✗ Failed ${email.to} (${email.business}): ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed`);
  if (!DRY_RUN) {
    console.log(`\nBatch 4 sent on ${new Date().toISOString().slice(0, 10)}`);
    console.log('Day 3 follow-up due:', new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
    console.log('Day 8 follow-up due:', new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10));
  }
}

main().catch(console.error);
