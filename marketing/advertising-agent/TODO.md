# Advertising & Growth Plan — Path to $6K MRR
*Last updated: 2026-03-15*

**Goal:** $6,320 MRR = 80 customers × $79/mo
**Current:** $0 MRR, 0 paying customers, 45 cold emails sent
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
- [ ] **Give them a 14-day free trial on the spot** — no card required
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
- [x] Master list: `marketing/cold-email-master-list.json` (45 targets, all Email 1 sent)
- [x] Send script: `marketing/send-next-batch.js` (handles duplicates, follow-ups, status tracking)
- [x] `/send-emails` skill built — automates research + personalisation + sending
- [x] **45 cold emails sent** (25 on Mar 13 + 20 personalised on Mar 14)

### Follow-up Schedule
- [ ] **Email 2 for Batches 1-3 (25 targets)** — Due **Mar 16** (tomorrow)
- [ ] **Email 2 for Batch 4 (20 targets)** — Due **Mar 17**
- [ ] **Email 3 for Batches 1-3** — Due Mar 21
- [ ] **Email 3 for Batch 4** — Due Mar 22

### Pipeline Growth (Ongoing)
- [ ] **Scale to 25 new targets per day** — Use `/send-emails` to research, add to master list, and send
- [ ] **Diversify categories** — Currently 90% food. Need more: dentists, physios, gyms, mechanics, salons, vets, tradies
- [ ] **Target: 500 emails sent by end of March** — Currently at 45. Need ~18/day.
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
- [ ] **Add /blog route** to insightreviews.com.au
- [ ] **Write: "How to Get More Google Reviews in 2026"** — ~1,500 words, practical steps
- [ ] **Write: "How to Deal With Negative Google Reviews"**
- [ ] **Write: "Google Review Link — How to Get Your Direct Review Link"** — potential free tool for email capture
- [ ] **Submit sitemap** to Google Search Console

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
- [x] Target list: 100 Melbourne businesses (marketing/OUTREACH-LIST.md)
- [x] Master list: 45 targets with sent tracking (marketing/cold-email-master-list.json)
- [x] `/send-emails` skill built — automates research + send + tracking
- [x] send-next-batch.js built (handles duplicates, follow-ups, status)
- [x] **45 cold emails sent** (25 generic Mar 13 + 20 personalised Mar 14)
- [x] Diversified target list: marketing/MELBOURNE-TARGETS-NEW.md (dentists, gyms, mechanics, beauty, chiro)
- [x] Business email pipeline (SendGrid inbound → Gmail)
- [x] Homepage badges (12 directory backlinks in footer)
- [x] SendGrid domain authentication verified
- [x] LinkedIn/Facebook posts drafted (not posted — personal branding concern)

---

## Tracking — Cold Email Sequence Dates

| Batch | Email 1 Sent | Email 2 Due (Day 3) | Email 3 Due (Day 8) |
|-------|-------------|---------------------|---------------------|
| Batch 1 (10 targets) | Mar 13 | **Mar 16** | Mar 21 |
| Batch 2 (7 targets) | Mar 13 | **Mar 16** | Mar 21 |
| Batch 3 (8 targets) | Mar 13 | **Mar 16** | Mar 21 |
| Batch 4 (20 targets — personalised) | Mar 14 | **Mar 17** | Mar 22 |

---

## Key Insight

> **"Stop sitting at the computer. Walk into 10 businesses tomorrow."**
>
> Podium ($3B company) did exactly this. Zenchef grew 7x in 6 months doing this. Cold email is background noise — in-person sales is the engine. Every week you delay in-person outreach is a week of revenue you'll never get back.
