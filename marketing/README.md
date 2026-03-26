# Marketing — What's Here & How to Use It

## Your Sales Toolkit

### In-Person Sales — [Full Playbook →](IN-PERSON-SALES-PLAYBOOK.md)

**Before you leave the house, print:**
1. **QR code counter cards** — Dashboard → Collect Reviews → "Print Counter Card" (print 10)
2. **Leave-behind PDFs** — [insightreviews.com.au/leave-behind.html](https://insightreviews.com.au/leave-behind.html) → Cmd+P (print 10)

**The 30-second pitch:**
> "Hey, I just looked up your Google page — you've got [X] stars. Your happy customers probably never think to leave a review. I built something that fixes that. This QR code goes on your counter — customer scans it, taps a star rating, and happy ones get sent straight to Google. Unhappy ones stay private so you can follow up. Want me to show you? Takes 2 minutes."

**Then demo it live:**
1. Hand them the QR code card — "This goes on your counter"
2. Scan it yourself on your phone — show the review form
3. Explain: "4-5 stars → Google. 1-3 stars → stays private, you get notified."
4. Close: "$49/mo, first 2 weeks free, I'll set you up right now."

**Read the [full playbook](IN-PERSON-SALES-PLAYBOOK.md) for objection handling, best streets, daily targets, and follow-up scripts.**

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
- **Stripe payouts:** ✅ Verification submitted (awaiting review)

## What Will Actually Get You Customers

1. **Walk into businesses.** Read the [In-Person Sales Playbook](IN-PERSON-SALES-PLAYBOOK.md). Print QR cards and leave-behinds. Hit Lygon St, Smith St, Chapel St, Sydney Rd. 10 businesses per day. Demo on your phone. Set them up on the spot.

2. **Follow up.** Walk back into businesses where you left QR cards after 2-3 days. Check if they had any scans.
