# EIM-1: Founder Communication Triage & Priority Matrix

## Purpose
Define the priority levels, routing rules, and response time standards for all inbound communications to the founder of the Three-Headed Monster (Stone AI, Best AI, Stone AI Tools). The founder runs three businesses simultaneously. Every minute spent on a P3 email while a P0 alert sits unread is a minute that costs real money or real risk. This seed ensures the right things get attention at the right time.

## Framework / Standards

### Communication Infrastructure

| Channel | Purpose | Volume Expectation |
|---|---|---|
| 3headedm@gmail.com | Agent alerts, system notifications, automated reports | High (automated) |
| Zoho Email 1 (stone-ai.net) | Stone AI business communications | Medium |
| Zoho Email 2 (stone-ai.net) | Stone AI support | Medium-High |
| Zoho Email 3 (stone-ai.net) | Best AI business communications | Low (pre-launch) |
| Zoho Email 4 (stone-ai.net) | Stone AI Tools business communications | Low (pre-launch) |
| Zoho Email 5 (stone-ai.net) | General / overflow | Low |
| GitHub notifications | PRs, issues, CI/CD alerts | Medium |
| Stripe dashboard | Payment events, disputes, subscription changes | Low-Medium |
| Clerk dashboard | Auth events, user management | Low |
| Vercel dashboard | Deploy status, errors | Low |
| Neon dashboard | DB alerts, usage | Low |
| Cloudflare dashboard | DNS, security events | Low |

### Priority Levels

#### P0 -- Act Now (Response: <15 minutes)
**Definition:** Active or imminent threat to revenue, security, data integrity, or legal standing. The founder must be interrupted for these regardless of time of day.

**What qualifies as P0:**
- Security breach or suspected breach (unauthorized access, data exposure, injection attempt)
- Production site down (stone-ai.net unreachable or throwing 500s)
- Payment processing failure (Stripe webhook failures, users unable to subscribe)
- Legal threat received (cease & desist, lawsuit notification, DMCA takedown)
- Data loss or database corruption
- Credential compromise (any API key, service account, or admin credential)
- Government or regulatory inquiry
- Domain or DNS hijack attempt
- SSL certificate expiration imminent (<24 hours)

**Routing:** Direct to founder immediately. No autonomous handling. No waiting for batch.

**Response template:**
```
PRIORITY: P0 -- IMMEDIATE ACTION REQUIRED
SOURCE: [channel]
SUBJECT: [one-line summary]
IMPACT: [what breaks if ignored]
RECOMMENDED ACTION: [specific next step]
TIME SENSITIVITY: [deadline or window]
```

#### P1 -- Same Day (Response: <4 hours during business hours)
**Definition:** Important business matter that requires founder decision or awareness today but is not an active emergency.

**What qualifies as P1:**
- Stripe dispute or chargeback notification
- User reporting a significant bug (data not saving, agent not responding, billing error)
- Press inquiry or media request
- Partnership proposal from a known/relevant entity
- Unusual traffic spike (potential viral moment or attack -- requires judgment)
- CI/CD pipeline broken (deploys blocked)
- Service degradation (slow but not down)
- New subscription to Executive, Reseller, or Enterprise tier (high-value customer)
- Negative review or public complaint on social media with traction
- Email from a verified business domain requesting Enterprise pricing

**Routing:** Queue for next founder check-in. Flag with P1 marker. Can be handled autonomously if clear playbook exists, but founder must be informed same day.

**Response template:**
```
PRIORITY: P1 -- SAME DAY
SOURCE: [channel]
SUBJECT: [one-line summary]
REQUIRES: [Decision / Awareness / Action]
CONTEXT: [2-3 sentences max]
RECOMMENDED ACTION: [specific next step]
```

#### P2 -- 48 Hours (Response: within 2 business days)
**Definition:** Standard business communication that needs attention but won't cause damage if delayed by a day or two.

**What qualifies as P2:**
- Standard support tickets (how-to questions, feature requests, minor bugs)
- Partnership inquiries from unknown entities
- Routine Stripe notifications (successful payments, subscription renewals)
- GitHub issues from community members
- Marketing collaboration requests
- Job/freelance inquiries
- Non-urgent vendor communications
- Feature requests from paying users
- Routine analytics reports (weekly traffic, conversion, revenue)
- Community forum moderation items

**Routing:** Batch into daily or twice-daily review queue. Can be handled autonomously for standard responses (password resets, FAQ answers, feature request acknowledgments).

**Autonomous handling rules:**
- Support tickets with documented answers: respond with standard answer, flag for founder review
- Feature requests: acknowledge receipt, add to feature request log, no commitment on timeline
- Community moderation: apply standard community guidelines, escalate if judgment call needed

#### P3 -- Weekly Batch (Response: within 5 business days)
**Definition:** Low-priority items that can wait for the weekly inbox sweep without any business impact.

**What qualifies as P3:**
- Newsletter subscriptions and marketing emails from other companies
- Cold outreach / sales pitches
- General "just wanted to connect" networking emails
- Conference and event invitations
- Survey requests
- Non-urgent vendor upsell attempts
- Social media follows / generic engagement notifications
- Routine system health reports (all green)
- Blog comment notifications
- Generic "contact us" form submissions with no clear business value

**Routing:** Auto-archive if clearly spam. Otherwise, batch into weekly review folder. Founder scans once per week.

**Spam identification (auto-archive, no review needed):**
- Unsubscribe-able marketing from services the founder doesn't use
- Obvious phishing (misspelled domains, suspicious links)
- "Dear sir/madam" mass outreach
- Cryptocurrency/investment spam
- SEO service cold pitches

### Escalation Rules

| Scenario | Handling |
|---|---|
| Any P0 event | Direct to founder. No autonomous handling. No delay. |
| P1 with clear playbook | Handle autonomously, notify founder same day |
| P1 without playbook | Queue for founder, flag as "needs decision" |
| P2 with documented answer | Respond autonomously, log for founder review |
| P2 requiring judgment | Queue for founder next review cycle |
| P3 spam | Auto-archive, no founder time spent |
| P3 legitimate | Weekly batch review |
| Same issue escalated twice | Immediately becomes P1 regardless of original priority |
| User mentions "lawyer" or "legal" | Immediately becomes P0 regardless of context |
| Message from .gov or .edu domain | Minimum P1, review for P0 |
| Message mentions "security" + "vulnerability" | Immediately P0 |
| Stripe "dispute" or "fraud" event | Immediately P1 |

### Cross-Business Priority Adjustment

When the same time window has competing items across the three businesses:

| Business | Priority Weight | Rationale |
|---|---|---|
| Stone AI (Biz 1) | 1.0x (baseline) | Live product, paying customers, primary revenue |
| Best AI (Biz 2) | 0.7x | Pre-launch, no live customers yet |
| Stone AI Tools (Biz 3) | 0.7x | Pre-launch, no live customers yet |

**Example:** A P1 for Stone AI and a P1 for Best AI arrive simultaneously. Stone AI gets handled first because it has live customers and active revenue.

**Exception:** If Best AI or Tools has a launch-day event, its weight temporarily rises to 1.0x for that day.

## Templates & Examples

### Daily Triage Routine (recommended)
1. **Morning scan (9am):** Check P0 queue (should be empty -- P0s trigger immediate alerts). Review overnight P1s. Scan P2 queue for anything misclassified.
2. **Midday check (1pm):** Review any new P1s. Process P2 responses.
3. **Evening sweep (6pm):** Final P1 check. Queue tomorrow's P2s.
4. **Weekly batch (Friday):** Process all P3s in one sitting. Archive or respond. 30 minutes max.

### Classification Decision Tree
```
Is it a security threat or active breach?
  YES -> P0

Is production down or payments broken?
  YES -> P0

Is it a legal notice or regulatory inquiry?
  YES -> P0

Does it involve money at risk (dispute, fraud, billing error)?
  YES -> P1

Is it from a paying customer with an active issue?
  YES -> P1 (or P2 if minor)

Is it from press, a credible partner, or a high-value lead?
  YES -> P1

Is it a support question with a known answer?
  YES -> P2 (autonomous response OK)

Is it a feature request, general inquiry, or community item?
  YES -> P2

Is it cold outreach, marketing, or networking?
  YES -> P3

Is it obvious spam?
  YES -> Auto-archive
```

### Autonomous Response Templates

**Support -- Known Answer:**
"Thanks for reaching out. [Answer]. If this doesn't resolve it, reply here and we'll dig deeper."

**Feature Request Acknowledgment:**
"Appreciate the suggestion. We've logged this and it's on our radar. No ETA to share yet, but we're listening."

**Partnership Inquiry -- Initial Response:**
"Thanks for your interest. I've flagged this for review. If there's a fit, we'll follow up within the week."

**Bug Report Acknowledgment:**
"Thanks for reporting this. We're looking into it. If you can share [specific detail], that'll help us fix it faster."

## DO / DON'T Rules

### DO
- Classify every inbound item within the priority framework before acting on it
- Process P0s the moment they arrive -- no batching, no delay
- Log every autonomous response so the founder can audit
- Re-classify if new information changes the priority (a P2 bug report that turns out to affect billing becomes P1)
- Keep the weekly P3 batch to 30 minutes max -- if it takes longer, the classification is wrong
- Trust the framework -- if something feels wrong about the classification, escalate one level

### DON'T
- Never let a P0 sit in a batch queue
- Never respond to legal matters autonomously -- founder reviews all legal communications
- Never commit to timelines, features, or partnerships without founder approval
- Never ignore a message that mentions "security," "legal," "lawyer," or "vulnerability" -- always classify as minimum P1
- Never spend founder time on spam -- build the auto-archive rules and trust them
- Never assume a calm tone means low priority -- read for content, not emotion
- Never batch P1s overnight -- if it arrives at 11pm and it's P1, it gets flagged for first-thing-morning review at minimum
