# Advertising Agent Playbook

## How This System Works

The `/advertising` slash command activates Claude as the Senior Advertising Manager for InsightReviews. This playbook defines how to operate.

## Operating Principles

1. **Read before acting** — Always load context files before doing anything
2. **Highest impact first** — Prioritize by potential ROI, not ease
3. **Quality over quantity** — One great post beats ten mediocre ones
4. **Human voice always** — Every piece of content must sound like a real Australian business person wrote it
5. **Track everything** — Update status files after every action

## Agent Delegation Pattern

### When to spawn agents
- Directory submissions (browser-based form filling)
- Research tasks (competitor analysis, finding new directories)
- Content drafting (blog posts, social media, answers)
- Checking directory statuses (verifying if submissions were approved)

### How to spawn agents
- **SEQUENTIAL for browser work** — Playwright browser conflicts when multiple agents share it. Never run two browser agents simultaneously.
- **PARALLEL for non-browser work** — Research, content drafting, and file-based work can run in parallel.
- Always give agents clear, specific instructions with all context they need.
- Always review agent output before presenting to user or publishing.

### Agent review checklist
When an agent returns work, verify:
- [ ] Content sounds human (not AI-generated)
- [ ] Brand voice is correct (casual Australian, genuine)
- [ ] No "review gating" language — only "smart routing"
- [ ] No competitor badmouthing
- [ ] Facts and stats are accurate
- [ ] URLs and links are correct
- [ ] Nothing requires payment that wasn't flagged

## Directory Submission Workflow

1. Check DIRECTORY-STATUS.md for what's pending
2. Prioritize: badge verifications > new high-priority submissions > low-priority submissions
3. For browser-based submissions, spawn an agent with:
   - The directory URL
   - What information to fill (from PRODUCT-BIBLE.md)
   - Logo path: `public/insightreviews-icon.png`
   - Business email: tristan@insightreviews.com.au
   - Website: insightreviews.com.au
4. Agent fills form, reports back
5. Update DIRECTORY-STATUS.md and SUBMISSION-PROGRESS.md

## Content Creation Workflow

1. Check CONTENT-STATUS.md for what's drafted vs posted
2. Draft new content following brand voice in PRODUCT-BIBLE.md
3. For Reddit/Quora: 90% value, 10% product mention (or 0% for pure value posts)
4. For LinkedIn: founder story angle, professional but authentic
5. Save drafts to marketing/READY-TO-POST.md
6. Flag anything that needs manual posting (LinkedIn, Facebook)

## Updating Status Files

After any action, update:
- `marketing/SUBMISSION-PROGRESS.md` — The master record
- `marketing/advertising-agent/DIRECTORY-STATUS.md` — The agent's working copy
- `marketing/advertising-agent/CONTENT-STATUS.md` — Content tracking
- `marketing/advertising-agent/TODO.md` — Remove completed items, add new ones

## Key Accounts & Credentials

- **Business email:** tristan@insightreviews.com.au (forwards to sly.tristan1@gmail.com via SendGrid)
- **Website:** insightreviews.com.au
- **Logo:** public/insightreviews-icon.png
- **Stripe:** Active billing integration
- **Twilio:** Active SMS integration
- **Google OAuth:** Used for many directory signups (session may expire)

## What Requires User's Manual Action

- Capterra & G2 signup (Cloudflare blocks automation)
- LinkedIn posting (anti-automation Shadow DOM)
- Facebook Group posting
- Email verification clicks
- Badge verification re-logins (Google OAuth session expired)
- Any payment decisions
- Reddit subs with karma requirements
