# Advertising & Growth Plan — Path to $6K MRR
*Last updated: 2026-03-15*

**Goal:** $6,320 MRR = 80 customers × $79/mo
**Current:** $0 MRR, 0 paying customers, 117 cold emails sent (72 sent Mar 15)
**Realistic timeline:** 9-14 months (5-7 months if in-person sales go hard)

---

## 🚨 CRITICAL — Fix These First (Blocking Revenue)

### 1. FIX STRIPE PAYOUTS — Due: OVERDUE (since Mar 9)
Stripe payouts have been **paused since Mar 9** and incoming charges will be blocked at A$3,896.14 volume.
**Action: Log in to [Stripe Dashboard](https://dashboard.stripe.com) → Account Status → upload business verification document.**
This could be an ABN, business registration certificate, or similar AU business doc.
**Nothing else matters if you can't collect money.**

### 2. FIX BUSINESS EMAIL FORWARDING — Blocking Directory Verifications
SendGrid inbound parse is NOT forwarding to Gmail. G2, Capterra, Peerlist, TrustRadius, SoftwareSuggest verifications are going to a black hole.
**Action: Check that SENDGRID_API_KEY is set in Vercel production environment variables.** The webhook endpoint is at insightreviews.com.au/api/email/inbound.

---

## PHASE 1 — In-Person Sales (HIGHEST ROI — Start Immediately)

> **Why this is #1:** Podium built a $3B company going door-to-door selling this exact type of product. Their founders sold 9am-3pm, coded at night. First customer was a local mechanic. Zenchef grew from 50 to 350 restaurant customers in 6 months using "commando operations" — walking every business on a street.

### The Pitch (30 seconds)
Walk in with your phone. Pull up their Google reviews. Say:
> "Hey, I noticed you've got [X] stars on Google with [Y] reviews. Your competitor [name] down the road has [higher rating] with [more reviews]. Most of your happy customers just never think to leave one. I built a tool that fixes that — want me to show you? Takes 2 minutes."

### Weekly Canvassing Plan — Melbourne Suburbs

| Day | Street / Area | Business Type |
|-----|---------------|---------------|
| Monday | **Lygon St, Carlton** | Cafes, restaurants, barbers |
| Tuesday | **Chapel St, Prahran/Windsor** | Salons, cafes, fitness studios |
| Wednesday | **Smith St, Collingwood/Fitzroy** | Cafes, bars, barbers, tattoo |
| Thursday | **Sydney Rd, Brunswick** | Cafes, barbers, restaurants, mechanics |
| Friday | **Fitzroy St + Acland St, St Kilda** | Cafes, restaurants, beauty |

**Target:** 10-15 business visits per day. Aim for 2-3 demos. Close 1-2 per week.

### Tactics
- [ ] **Prepare a tablet/phone with the demo ready** — show the SMS flow, the star rating screen, the smart routing
- [ ] **Pull up their actual Google profile** before walking in — reference their real rating and review count
- [ ] **Offer done-for-you setup** — "I'll set it up for you right now, takes 5 minutes. Upload your logo, configure your Google link, everything."
- [ ] **Give them a 14-day free trial on the spot** — card collected but not charged for 14 days
- [ ] **Print 50 one-page leave-behinds** — for businesses where the owner isn't there (leave with staff)
- [ ] **First 10 customers: offer 60-day free trial** in exchange for feedback + case study. Social proof is worth more than $790 right now.

### Tracking
| Week | Businesses Visited | Demos Given | Trials Started | Converted to Paid |
|------|-------------------|-------------|----------------|-------------------|
| Week 1 (Mar 17-21) | | | | |
| Week 2 (Mar 24-28) | | | | |
| Week 3 (Mar 31-Apr 4) | | | | |
| Week 4 (Apr 7-11) | | | | |

---

## PHASE 2 — Cold Email (Background Engine — Runs Daily)

> Cold email is a supplement, not the main engine. At 5% reply rate you need ~300 emails per paying customer. But it compounds and runs while you're doing in-person sales.

### Infrastructure (DONE)
- [x] Cold email sequence written (3 emails: Day 0, Day 3, Day 8)
- [x] Master list: `marketing/cold-email-master-list.json` (117 targets, all Email 1 sent)
- [x] Send script: `marketing/send-next-batch.js` (handles duplicates, follow-ups, status tracking)
- [x] Batch 5 send script: `marketing/send-batch5.js` (category-personalised emails)
- [x] `/send-emails` skill built — automates research + personalisation + sending
- [x] **117 cold emails sent** (45 on Mar 13-14, 72 personalised on Mar 15)

### Email Stats (as of Mar 15)
- 117 sent, 0 replies, 0 signups
- 3 bounced (Orchid Day Spa, K1 Motors, Freedom Dental)
- Fernwood's 6 "clicks" were Mimecast security scanner (not real engagement)
- No spam reports, no unsubscribes. Sender reputation: 96%

### Follow-up Schedule
- [ ] **Email 2 for Batches 1-4 (45 targets)** — Due **Mar 16-17**
- [ ] **Email 2 for Batch 5 (72 targets)** — Due **Mar 18**
- [ ] **Email 3 for Batches 1-4** — Due Mar 21-22
- [ ] **Email 3 for Batch 5** — Due Mar 23

### Pipeline Growth (Ongoing)
- [x] **Diversified categories** — Now covers: cafes, restaurants, bars, pubs, hotels, bakeries, dentists, salons, beauty, chiros, physios, gyms, florists, barbers
- [ ] **Target: 500 emails sent by end of March** — Currently at 117. Need ~25/day.
- [ ] **Track replies daily** — Check sly.tristan1@gmail.com. Any reply = remove from sequence, respond personally.

### Cold Email Math
| Emails Sent | Expected Replies (5%) | Expected Demos (40% of replies) | Expected Customers (20% close) |
|-------------|----------------------|--------------------------------|-------------------------------|
| 100 | 5 | 2 | 0-1 |
| 500 | 25 | 10 | 2 |
| 1,000 | 50 | 20 | 4 |
| 2,500 | 125 | 50 | 10 |

---

## PHASE 3 — Partnerships & Referrals (Month 2-3)

> One agency partner with 50 clients can drive 5-10 signups. This is the highest-leverage channel once you have a few paying customers.

### Agency Partnerships
- [ ] **Identify 10 Melbourne digital marketing agencies** that serve local businesses (cafes, salons, dentists)
- [ ] **Pitch:** "Your clients need more Google reviews. We handle it. You get 25% recurring commission on every referral."
- [ ] **Target: 2-3 agency partnerships by end of April**
- [ ] Agencies to research: local SEO agencies, social media managers for hospitality, dental marketing specialists

### Business Association / Chamber of Commerce
- [ ] **Join Melbourne Chamber of Commerce** or local business groups
- [ ] **Offer to speak/demo at a meetup** — "How Local Businesses Can Get More 5-Star Reviews"
- [ ] **Suburb-specific chambers:** Fitzroy, St Kilda, Brunswick, Carlton business associations

### Referral Program (Once you have 5+ customers)
- [ ] **Offer 1 free month** for every referral that converts to paid
- [ ] Ask every happy customer: "Do you know any other business owners who'd find this useful?"
- [ ] Business owners know other business owners — warm referrals convert 3-5x better than cold

### Local Facebook Groups
- [ ] **Join:** "Melbourne Small Business Owners", "Melbourne Cafe Owners", suburb-specific business groups
- [ ] **Provide value for 2 weeks** before mentioning InsightReviews
- [ ] **No spamming** — answer questions about Google reviews, share tips, build credibility first

---

## PHASE 4 — Paid Ads (Month 4-5, After Social Proof)

> Do NOT start paid ads until you have 5+ paying customers and 2-3 testimonials. Running ads to an unproven funnel burns cash.

### Google Ads (When Ready)
- [ ] **Budget:** $500-1,000/month to start
- [ ] **Keywords:** "get more google reviews Melbourne", "review management software Australia", "how to get 5 star reviews"
- [ ] **Expected:** $5-6 CPC, ~$200-400 cost per acquisition. At $79/mo LTV of ~$948, this is profitable.
- [ ] **Prerequisite:** Landing page with testimonials, case study, clear CTA

### Facebook/Instagram Ads (Lower Priority)
- [ ] Retargeting website visitors only (not cold audiences)
- [ ] 60% cheaper per lead than Google but lower intent

---

## PHASE 5 — SEO & Content (Compounds Over 6-12 Months)

### Blog Posts
- [x] **Blog route live** at insightreviews.com.au/blog/
- [x] **"How to Get More Google Reviews in 2026"** — live at /blog/get-more-google-reviews
- [x] **"How to Deal With Negative Google Reviews"** — live at /blog/negative-google-reviews
- [ ] **Write: "Google Review Link — How to Get Your Direct Review Link"** — potential free tool for email capture
- [ ] **Submit sitemap** to Google Search Console (sitemap.xml is generated, need to verify site in GSC)
- [x] **SEO metadata** — JSON-LD structured data, keywords, canonical URLs, og:locale en_AU
- [x] **Sitemap** includes landing, signup, both blog posts, subscribe

### Directory Cleanup (Low Priority — Enough for Now)
- 51 directories submitted. Stop adding more. Focus on:
- [ ] Badge verifications for the ~15 blocked directories (batch task, 30 min)
- [ ] G2 + Capterra verification once email forwarding is fixed (high trust signals)

---

## PHASE 6 — Launch Events (One-Time Bursts)

- [ ] **Hunt0** — Free launch scheduled Apr 7, 2026
- [ ] **TinyLaunch** — Schedule free launch Apr 13
- [ ] **Product Hunt** — Needs 50+ followers. Low priority until you have paying customers and a story to tell.
- [ ] **Peerlist Launchpad** — After email verified, launch on a Monday

---

## PHASE 7 — Community (Ongoing, Background)

- [ ] **Reddit** — 1 value post per week. Next: r/sweatystartup tradie review story.
- [ ] **Quora** — 2-3 answers per week on Google review topics
- [ ] **Reddit r/entrepreneur** — Build karma first (comment on 5-10 posts)

---

## Revenue Milestones

| Milestone | Target | How | Estimated Date |
|-----------|--------|-----|----------------|
| First paying customer | $79 MRR | In-person sale or cold email conversion | Mar-Apr 2026 |
| 10 customers | $790 MRR | In-person + cold email + first referrals | May-Jun 2026 |
| 25 customers | $1,975 MRR | Referrals kicking in + 1 agency partner | Jul-Aug 2026 |
| 50 customers | $3,950 MRR | Agency partners + Google Ads started | Oct-Nov 2026 |
| **80 customers** | **$6,320 MRR** | **All channels firing** | **Dec 2026 - Feb 2027** |

---

## COMPLETED ✅

- [x] 51 directory submissions (enough — stop adding more)
- [x] AlternativeTo — submitted 2026-03-13 (pending review)
- [x] Reddit: 5 posts live across 4 subreddits
- [x] Quora: 10/10 answers published as Tristan Sly
- [x] Cold DM templates drafted (marketing/READY-TO-POST.md)
- [x] Cold email sequence written (3 emails in marketing/COLD-EMAIL-SEQUENCE.md)
- [x] Target list: 365+ Melbourne businesses (marketing/target-businesses.csv)
- [x] Master list: 117 targets with sent tracking (marketing/cold-email-master-list.json)
- [x] `/send-emails` skill built — automates research + send + tracking
- [x] send-next-batch.js + send-batch5.js built (handles duplicates, follow-ups, personalisation)
- [x] **117 cold emails sent** (25 generic Mar 13, 20 personalised Mar 14, 72 category-personalised Mar 15)
- [x] Diversified target list across 14 categories (cafes, restaurants, bars, pubs, hotels, dentists, salons, beauty, chiros, physios, gyms, florists, barbers, bakeries)
- [x] Business email pipeline (SendGrid inbound → Gmail)
- [x] Homepage badges (12 directory backlinks in footer)
- [x] SendGrid domain authentication verified
- [x] LinkedIn/Facebook posts drafted (not posted — personal branding concern)
- [x] **Billing flow redesigned** — Stripe as single source of truth, card collected on signup
- [x] **Stripe price fixed** — $79 AUD/month (was $29 USD), both test and live
- [x] **SEO overhaul** — JSON-LD structured data, meta tags, canonical URLs, keywords
- [x] **510 tests passing** across 18 test files — all major features covered
- [x] **Dark mode fixed** — Getting Started section
- [x] **Landing page updated** — "No card required" → "14 days free"
- [x] **Blog post 1** — "How to Get More Google Reviews" (live)
- [x] **Blog post 2** — "How to Deal With Negative Google Reviews" (in progress)
- [x] **Leave-behind PDF** — one-pager for in-person sales (in progress)
- [x] **.env.production fixed** — removed trailing \n from all values

---

## Tracking — Cold Email Sequence Dates

| Batch | Targets | Email 1 Sent | Email 2 Due (Day 3) | Email 3 Due (Day 8) |
|-------|---------|-------------|---------------------|---------------------|
| Batch 1 (generic) | 10 | Mar 13 | **Mar 16** | Mar 21 |
| Batch 2 (generic) | 7 | Mar 13 | **Mar 16** | Mar 21 |
| Batch 3 (generic) | 8 | Mar 13 | **Mar 16** | Mar 21 |
| Batch 4 (personalised) | 20 | Mar 14 | **Mar 17** | Mar 22 |
| Batch 5a (category-personalised) | 51 | Mar 15 | **Mar 18** | Mar 23 |
| Batch 5b (category-personalised) | 21 | Mar 15 | **Mar 18** | Mar 23 |

---

## Key Insight

> **"Stop sitting at the computer. Walk into 10 businesses tomorrow."**
>
> Podium ($3B company) did exactly this. Zenchef grew 7x in 6 months doing this. Cold email is background noise — in-person sales is the engine. Every week you delay in-person outreach is a week of revenue you'll never get back.
