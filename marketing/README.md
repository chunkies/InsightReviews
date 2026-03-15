# Marketing — What's Here & How to Use It

## Your Sales Toolkit

### In-Person Sales
**Print this and walk into businesses:**
- **Leave-behind PDF:** [insightreviews.com.au/leave-behind.html](https://insightreviews.com.au/leave-behind.html) — open in browser, Cmd+P to print

**The 30-second pitch:**
> "Hey, I noticed you've got [X] stars on Google. Your happy customers just never think to leave a review — it's always the unhappy ones who post. I built a tool that fixes that. After a customer visits, you send a quick SMS, and happy customers get nudged to Google. Unhappy ones stay private so you can follow up first. Want me to show you? Takes 2 minutes."

**Then pull up their Google listing on your phone and show them:**
1. Their current rating vs a competitor nearby
2. The InsightReviews demo — SMS flow, star rating screen, smart routing
3. Offer to set it up on the spot — 14-day free trial, card collected but not charged

### Cold Email
**Send follow-up emails to existing targets:**
```bash
# Day 3 follow-up for batches 1-4 (45 targets)
SENDGRID_API_KEY=xxx node marketing/send-next-batch.js --email=2

# Day 8 final follow-up
SENDGRID_API_KEY=xxx node marketing/send-next-batch.js --email=3

# Preview without sending
SENDGRID_API_KEY=xxx node marketing/send-next-batch.js --email=2 --dry-run

# Check status of all targets
node marketing/send-next-batch.js --status
```

**Send new batch of personalised emails:**
```bash
# Edit marketing/send-batch5.js targets, then:
SENDGRID_API_KEY=xxx node marketing/send-batch5.js

# Preview first
SENDGRID_API_KEY=xxx node marketing/send-batch5.js --dry-run
```

**Find new targets:**
```bash
YELP_API_KEY=xxx node marketing/find-targets.js
```

---

## File Guide

| File | What It Is | When to Use |
|------|-----------|-------------|
| `cold-email-master-list.json` | **All 117 targets with sent status** — the single source of truth for outreach | Checked automatically by send scripts to avoid duplicates |
| `send-next-batch.js` | **Main email send script** — handles Email 1/2/3, dedup, status tracking | `--email=2` for follow-ups, `--status` to check progress |
| `send-batch5.js` | **Category-personalised email sender** — different templates for cafes vs dentists vs gyms | For sending new batches with category-aware messaging |
| `find-targets.js` | **Yelp API target finder** — searches Melbourne suburbs for businesses under 4 stars | When you need more targets |
| `target-businesses.csv` | **365 raw targets from Yelp** (no emails) — used as a starting pool | Reference only — master list is the real tracker |
| `COLD-EMAIL-SEQUENCE.md` | **3-email sequence templates** (Day 0, Day 3, Day 8) | Reference for email copy |
| `COMPETITORS.md` | **Competitor analysis** (Birdeye, Podium, NiceJob, ReviewGain) | Sales prep — know what they charge ($300+) vs your $79 |
| `READY-TO-POST.md` | **Social media posts ready to go** — Reddit, LinkedIn, Facebook, cold DMs | Copy-paste when posting |
| `REDDIT-THREADS.md` | **5 Reddit posts already live** across r/smallbusiness, r/sweatystartup, etc | Reference — don't repost |
| `QUORA-THREADS.md` | **10 Quora answers live** as Tristan Sly | Reference — don't re-answer |
| `DIRECTORY-LISTINGS.md` | **51 directory submissions** with status | Reference only |
| `SUBMISSION-PROGRESS.md` | **Detailed submission log** with dates and verification status | Reference only |
| `NEW-DIRECTORIES-RESEARCH.md` | **Additional directories researched** but not submitted | Low priority |
| `advertising-agent/` | **Agent context files** — product bible, TODO, playbook | Used by /advertising skill |

---

## Current Numbers (Mar 15, 2026)

- **117 cold emails sent**, 0 replies, 0 signups
- **51 directory listings** submitted
- **5 Reddit posts** + **10 Quora answers** live
- **2 blog posts** live (Google reviews guide + negative reviews guide)
- **Google Search Console** verified, sitemap submitted
- **Sender reputation:** 96%
- **Paying customers:** 0

## What Will Actually Get You Customers

1. **Walk into businesses.** Lygon St, Chapel St, Smith St, Sydney Rd, Fitzroy St. 10 businesses per day. Print the leave-behind. Pull up their Google rating. Demo on your phone. Offer to set it up on the spot.

2. **Follow up on cold emails.** The 45 from Mar 13-14 need Day 3 follow-ups. Run `send-next-batch.js --email=2`.

3. **Fix Stripe payouts.** dashboard.stripe.com → Account Status → upload ABN.
