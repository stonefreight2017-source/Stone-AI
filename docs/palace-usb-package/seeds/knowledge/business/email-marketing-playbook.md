# Email Marketing Playbook — Stone AI Ecosystem

## Executive Overview

Email marketing remains the highest-ROI marketing channel across all industries, averaging $36-42 return per $1 spent. For SaaS businesses, email is the backbone of the entire customer lifecycle — from acquisition to activation, retention, expansion, and win-back. Unlike social media, you own your email list. No algorithm changes, no platform risk, no pay-to-play surprises. This playbook covers the complete email marketing system for Stone AI (SaaS), Best AI Mobile (app), and Stone AI Tools (developer marketplace).

The three businesses share infrastructure (Stripe billing events, user behavior data) but require distinct email strategies because their users have different needs, expectations, and conversion triggers. Stone AI users want productivity transformation. Best AI Mobile users want convenience and simplicity. Stone AI Tools developers want technical precision and reliability.

---

## Email Infrastructure & Deliverability

### Sending Infrastructure

**Recommended ESP (Email Service Provider):**
- **Primary: Resend** ($0-20/month): Developer-friendly, excellent deliverability, React Email for templates, built for SaaS. Integrates cleanly with Next.js.
- **Alternative: Postmark** ($15/month): Best deliverability in the industry. Transactional and marketing emails. More expensive at scale.
- **Budget option: Amazon SES** ($0.10/1,000 emails): Cheapest at scale. Requires more setup. No built-in template editor.

**Do NOT use Gmail SMTP for marketing emails.** The existing Nodemailer + Gmail setup (3headedm@gmail.com) is for internal founder alerts only. Marketing emails through Gmail will destroy deliverability and get the domain blacklisted.

### Deliverability Checklist

1. **SPF Record**: Add your ESP's sending servers to your domain's SPF record in Cloudflare DNS.
   ```
   v=spf1 include:_spf.google.com include:[esp-domain] -all
   ```

2. **DKIM**: Enable DKIM signing through your ESP. Add the DKIM CNAME records to Cloudflare DNS.

3. **DMARC**: Set up DMARC policy to monitor and eventually enforce email authentication.
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@stone-ai.net
   ```

4. **Custom sending domain**: Send from a subdomain like mail.stone-ai.net or notifications.stone-ai.net. This protects the root domain's reputation.

5. **Warm-up schedule**: New sending domains must be warmed up gradually:
   - Week 1: 50 emails/day
   - Week 2: 200 emails/day
   - Week 3: 500 emails/day
   - Week 4: 1,000 emails/day
   - Week 5+: Increase 25% per day until target volume

6. **List hygiene**: Remove bounced emails immediately. Remove unengaged subscribers (no opens in 90 days) quarterly. This is the single most impactful deliverability action.

7. **Unsubscribe compliance**: One-click unsubscribe header (required by Gmail/Yahoo as of Feb 2024). Clear unsubscribe link in every email. Process unsubscribes within 24 hours.

8. **Spam testing**: Use tools like Mail Tester (mail-tester.com) or GlockApps to check spam scores before sending campaigns.

### Email Authentication Setup for Cloudflare
Since Stone AI uses Cloudflare DNS with proxy enabled:
- SPF: TXT record on root domain (proxy doesn't affect TXT records)
- DKIM: CNAME records per ESP instructions (set to DNS-only/grey cloud, not proxied)
- DMARC: TXT record on _dmarc subdomain
- Return-Path/bounce domain: CNAME to ESP (DNS-only)

---

## Segmentation Strategy

Segmentation is the difference between 15% open rates and 45% open rates. Every email should target a specific segment with a specific message.

### Primary Segmentation Dimensions

**By Product:**
- Stone AI users
- Best AI Mobile users
- Stone AI Tools developers
- Multi-product users (cross-sell opportunities)

**By Lifecycle Stage:**
- Lead (signed up but not activated)
- Activated (completed key action — first agent chat, first API call, first mobile session)
- Engaged (regular usage in last 7 days)
- At-risk (no usage in 14+ days)
- Churned (cancelled subscription or no usage in 30+ days)
- Win-back target (churned 30-90 days ago)

**By Plan Tier (Stone AI):**
- FREE ($0): 4 agents
- STARTER ($19.99): 16 agents
- PLUS ($49.99): 30 agents
- SMART ($99.99): 39 agents — annual option $79.99
- PRO ($200): 42 agents — annual option $170

**By Behavior:**
- Feature usage patterns (which agents they use, API endpoints called)
- Login frequency (daily, weekly, monthly)
- Feature discovery (have they tried feature X?)
- Billing events (payment failed, trial ending, plan change)
- Engagement signals (forum posts, referrals made, support tickets)

**By Acquisition Source:**
- Organic search
- Social media (by platform)
- Referral (from existing user)
- Paid ads (by campaign)
- Product Hunt / launch event
- Direct / brand

### Segment Combinations for Targeting

| Segment Name | Criteria | Email Strategy |
|-------------|----------|----------------|
| Hot leads | Signed up <24h, not activated | Aggressive onboarding sequence |
| Power users on free | Daily usage, FREE plan, 30+ days | Upgrade nudge with usage data |
| Underutilizers | Paid plan, using <50% of available agents | Feature discovery campaigns |
| Churn risk | Paid, no login in 7+ days | Re-engagement + value reminder |
| Annual upsell | Monthly paid, 3+ months tenure | Annual discount pitch |
| Expansion ready | STARTER/PLUS, hitting limits | Upgrade to next tier |
| Champions | High usage, high NPS, has referred others | Referral program, testimonial request |
| Failed payment | Card declined, invoice unpaid | Dunning sequence |

---

## Welcome & Onboarding Sequences

### Stone AI Welcome Sequence (7 emails over 14 days)

**Email 1: Welcome (Immediate)**
- Subject: "Welcome to Stone AI — here's your first agent"
- Content: Warm welcome, direct link to first agent interaction, what to expect from emails
- CTA: "Chat with your first agent now"
- Emotional goal: Excitement, easy first win

**Email 2: Quick Win (Day 1, 4 hours after signup)**
- Subject: "Try this: Ask Agent [X] to [specific task]"
- Content: Specific, actionable prompt the user can copy-paste. Show expected output.
- CTA: "Try it now (takes 30 seconds)"
- Emotional goal: "Wow, this actually works"

**Email 3: Feature Discovery (Day 3)**
- Subject: "Did you know Stone AI can do this?"
- Content: Introduce a feature they haven't used yet (based on behavior data). Include screenshots/GIFs.
- CTA: "Explore [feature name]"
- Emotional goal: Depth appreciation, "there's more here than I thought"

**Email 4: Social Proof (Day 5)**
- Subject: "How [user/company] saves 10 hours/week with Stone AI"
- Content: Mini case study. Specific numbers, specific use case. User testimonial.
- CTA: "See more success stories" or "Try the same workflow"
- Emotional goal: FOMO, validation of decision to sign up

**Email 5: Bestie Introduction (Day 7)**
- Subject: "Meet your Bestie — your personalized AI companion"
- Content: Explain the Bestie feature, customization options, communication styles. Make it personal.
- CTA: "Set up your Bestie"
- Emotional goal: Emotional connection, personalization, stickiness

**Email 6: Upgrade Nudge (Day 10)**
- Subject: "You've used [X] agents. Unlock [Y] more."
- Content: Show usage stats. Highlight what they'd unlock on the next tier. Include promo pricing if available ($9.99 first month STARTER).
- CTA: "Upgrade and save"
- Emotional goal: Progress awareness, aspiration for more

**Email 7: Community Invite (Day 14)**
- Subject: "Join 5,000+ Stone AI users in our community"
- Content: Invite to forum and/or Discord. Highlight recent interesting discussions. Show that they're not alone.
- CTA: "Join the community"
- Emotional goal: Belonging, peer connection

### Best AI Mobile Welcome Sequence (5 emails over 10 days)

**Email 1: Welcome + Download Confirmation (Immediate)**
- Subject: "You're in! Here's how to get the most from Best AI"
- Content: Quick-start guide (3 tips), link to app if they haven't downloaded yet
- CTA: "Open the app and try this"

**Email 2: Daily Use Case (Day 2)**
- Subject: "Morning routine: How to start your day with AI"
- Content: Specific daily use case. "Ask Best AI to summarize your day's news, plan your tasks, draft your first email."
- CTA: "Try your morning AI routine"

**Email 3: Feature Highlight (Day 5)**
- Subject: "This feature saves 20 minutes every day"
- Content: Highlight a power feature (voice input, quick actions, etc.)
- CTA: "Try it in the app"

**Email 4: Rating Request (Day 7)**
- Subject: "Quick favor? (Takes 10 seconds)"
- Content: If they've been active, ask for an App Store rating. If inactive, skip this and send a re-engagement email instead.
- CTA: "Rate us on the App Store"

**Email 5: Cross-Sell (Day 10)**
- Subject: "Want even more AI power?"
- Content: Introduce Stone AI full platform for desktop/web. Position as "your mobile AI companion's big sibling."
- CTA: "Try Stone AI free"

### Stone AI Tools Developer Welcome Sequence (6 emails over 21 days)

**Email 1: API Key + Quickstart (Immediate)**
- Subject: "Your API key is ready. Here's a 5-minute quickstart."
- Content: API key (if applicable), link to quickstart guide, first API call example with curl command
- CTA: "Make your first API call"

**Email 2: SDK Introduction (Day 2)**
- Subject: "Python or JavaScript? Your SDK is ready."
- Content: Link to SDKs, code examples in both languages, link to GitHub repos
- CTA: "Install the SDK"

**Email 3: Use Case Deep Dive (Day 5)**
- Subject: "3 things developers are building with Stone AI Tools"
- Content: Real examples of integrations other developers have built. Code snippets.
- CTA: "Explore the API docs"

**Email 4: Rate Limits & Best Practices (Day 10)**
- Subject: "Avoid these 5 common API mistakes"
- Content: Best practices, error handling, rate limit guidance, performance tips
- CTA: "Read the best practices guide"

**Email 5: Developer Community (Day 14)**
- Subject: "Join 500+ developers building with Stone AI"
- Content: Discord invite, GitHub discussions, developer forum, hackathon announcements
- CTA: "Join the developer community"

**Email 6: Paid Plan Introduction (Day 21)**
- Subject: "Ready to scale? Here's your upgrade path."
- Content: Usage stats, how paid plans unlock higher rate limits, priority support, advanced features
- CTA: "View pricing"

---

## Upgrade & Expansion Emails

### Upgrade Nudge Framework

**Trigger-based upgrade emails** are 3-5x more effective than calendar-based ones. Send upgrade emails when the user demonstrates readiness, not on an arbitrary schedule.

**Trigger 1: Approaching Agent Limit**
- When: FREE user has used 3 of 4 agents in a single session
- Subject: "You're using 3 of 4 free agents. Unlock 12 more for $19.99/mo."
- Content: Show which agents they've used, show which popular agents they're missing, include most compelling testimonial
- CTA: "Unlock 16 agents — $9.99 first month"

**Trigger 2: High-Value Feature Attempt**
- When: FREE user attempts to access a paid feature
- Subject: "Great taste! [Feature] is available on STARTER."
- Content: Explain the feature, show a preview, create desire
- CTA: "Start free trial" or "Upgrade to STARTER"

**Trigger 3: Usage Milestone**
- When: User completes 50th / 100th / 500th agent interaction
- Subject: "You've had 100 AI conversations! You're a power user."
- Content: Usage stats, congratulations, "users like you typically upgrade to [tier] for [benefit]"
- CTA: "See what you're missing"

**Trigger 4: Time-Based for Free Users**
- When: FREE user hits 14 days, 30 days, 60 days
- Day 14: Light nudge — "Here's what paid users love most"
- Day 30: Stronger nudge — "You've been free for a month. Ready for more?"
- Day 60: Final push — "Exclusive offer: $9.99/month for your first month of STARTER"

**Trigger 5: Tier-to-Tier Expansion**
- When: STARTER user regularly uses all 16 agents
- Subject: "You're maxing out STARTER. PLUS unlocks 14 more agents + [feature]."
- Content: Specific agents they'd unlock, features they'd gain, price delta
- CTA: "Upgrade to PLUS"

### Annual Plan Upsell

Annual plans dramatically reduce churn and increase LTV. Target monthly subscribers after 3+ months of consistent usage.

**Email 1 (Month 3):**
- Subject: "Save $240/year. Switch to annual and get 2 months free."
- Content: Calculate their savings (monthly price x 12 vs. annual price), show that they've been happy for 3 months
- CTA: "Switch to annual and save"

**Email 2 (Month 4, if they didn't convert):**
- Subject: "Quick math: You've spent $[amount] so far. Here's how to spend less."
- Content: Show cumulative spend, projected annual spend, vs. annual plan price
- CTA: "Save [amount] per year"

**SMART tier annual upsell** is particularly compelling: $99.99/mo = $1,199.88/yr vs. $79.99/mo annual = $959.88/yr. That's $240 savings — a clear, easy-to-understand number.

---

## Churn Prevention & Re-Engagement

### Churn Risk Identification

Monitor these signals daily (automate via Stripe webhooks + usage tracking):

| Signal | Risk Level | Action |
|--------|-----------|--------|
| No login in 3 days (daily user) | Medium | Soft re-engagement email |
| No login in 7 days (any paid user) | High | Strong re-engagement + "what's wrong?" |
| No login in 14 days | Critical | Last-chance email + discount offer |
| Payment failed | Critical | Dunning sequence (see below) |
| Downgrade initiated | High | Save attempt with counter-offer |
| Cancel initiated | Critical | Exit survey + save offer |

### Re-Engagement Email Sequence

**Email 1: Soft Nudge (Day 3 of inactivity for daily users, Day 7 for weekly users)**
- Subject: "We miss you! Here's what's new in Stone AI."
- Content: Latest feature updates, popular use cases, link to something specifically relevant to their past usage
- CTA: "Come back and try [new feature]"
- Tone: Friendly, not desperate

**Email 2: Value Reminder (Day 7 / Day 14)**
- Subject: "Remember when Stone AI helped you [specific action they took]?"
- Content: Reference their actual usage history. "You've generated 47 AI responses, saved approximately 8 hours, and used Agent [X] the most." Remind them of the value they've already received.
- CTA: "Pick up where you left off"
- Tone: Personal, data-backed

**Email 3: Concern Check (Day 10 / Day 21)**
- Subject: "Everything okay? Quick question."
- Content: Short, personal. "Hey [name], I noticed you haven't logged in for a while. Is something not working? Hit reply and let me know — I read every response." Signed by the founder.
- CTA: Reply (not a button — replies are higher-value signals)
- Tone: Genuine concern

**Email 4: Last Chance (Day 14 / Day 28)**
- Subject: "Before you go — a special offer just for you"
- Content: Exclusive discount or extended trial. "We'd hate to lose you. Here's 50% off your next month." Include a deadline.
- CTA: "Claim your discount"
- Tone: Urgency, generosity

### Dunning Sequence (Failed Payment Recovery)

Failed payments account for 20-40% of all churn in SaaS. A good dunning sequence recovers 30-50% of failed payments.

**Dunning Email 1 (Immediately after failure)**
- Subject: "Action needed: Your payment didn't go through"
- Content: "Your payment of $[amount] for Stone AI [plan] failed. This is usually a temporary issue. Please update your payment method to keep your account active."
- CTA: "Update payment method" (link directly to billing settings)
- Tone: Informative, not alarming

**Dunning Email 2 (Day 3)**
- Subject: "Reminder: Update your payment to keep Stone AI [plan]"
- Content: "Your account is at risk of downgrade. You'll lose access to [specific features] on [date]. Update your card to keep everything working."
- CTA: "Update payment now"
- Tone: Slightly more urgent

**Dunning Email 3 (Day 5)**
- Subject: "Last chance: Your Stone AI account will be downgraded tomorrow"
- Content: "If we don't receive payment by [date], your account will be downgraded to FREE. You'll lose access to [X agents], [feature 1], and [feature 2]. We don't want that, and we're sure you don't either."
- CTA: "Save my account"
- Tone: Urgent, final warning

**Dunning Email 4 (Day 7 — downgrade notification)**
- Subject: "Your account has been downgraded"
- Content: "Your Stone AI account has been downgraded to FREE. You can upgrade at any time to restore your [plan] features. Here's a special offer: upgrade in the next 48 hours and get [discount]."
- CTA: "Restore my plan"
- Tone: Matter-of-fact, door-open

### Win-Back Campaign (30-90 Days After Churn)

**Email 1 (Day 30 after churn)**
- Subject: "A lot has changed at Stone AI. Come see."
- Content: Major updates since they left. New features, new agents, improvements. Show momentum.
- CTA: "See what's new"

**Email 2 (Day 45)**
- Subject: "[Name], we built this because users like you asked for it"
- Content: Specific feature that addresses a common pain point or feature request
- CTA: "Try it free for 7 days"

**Email 3 (Day 60)**
- Subject: "Come back offer: 60% off for 3 months"
- Content: Aggressive discount. Only sent to users who were previously on paid plans. Time-limited.
- CTA: "Claim your comeback deal"

**Email 4 (Day 90 — Final)**
- Subject: "One last thing before we stop emailing"
- Content: "We've been sending updates because we want you back. But we respect your inbox. This is the last email unless you want to hear from us. Here's a standing offer: [discount]. Use it anytime."
- CTA: "Keep me updated" or "Unsubscribe"
- Tone: Respectful, no pressure

---

## Newsletter Strategy

### Purpose
A weekly newsletter keeps Stone AI top-of-mind for all users (free and paid), builds thought leadership, and creates a regular touchpoint that doesn't feel like marketing.

### Newsletter Format: "The AI Agent Dispatch"

**Frequency**: Weekly (Tuesday or Wednesday mornings — highest open rates)

**Structure**:
1. **Opener** (2-3 sentences): Quick, engaging introduction tied to something happening in AI or the world
2. **Product Update** (1-2 paragraphs): What's new in Stone AI this week. Features, improvements, bug fixes.
3. **Featured Agent** (1 paragraph + example): Spotlight one agent. Show a specific use case with example input/output.
4. **AI Industry Insight** (2-3 paragraphs): Commentary on a significant AI development. Position Stone AI's perspective.
5. **Community Spotlight** (1 paragraph): Feature a user, a forum post, a cool use case shared by the community.
6. **Tip of the Week** (1-2 sentences): Quick productivity tip using Stone AI.
7. **CTA**: Changes based on priority — could be upgrade, referral, community join, new feature try, etc.

### Newsletter Metrics Targets
| Metric | Target | Action if Below |
|--------|--------|----------------|
| Open rate | >30% | Test subject lines, check deliverability |
| Click rate | >3% | Improve content relevance, CTA clarity |
| Unsubscribe rate | <0.3% | Reduce frequency, improve value |
| Reply rate | >0.5% | Ask more questions, make personal |

### Subject Line Formulas That Work
- Curiosity: "This AI trick saved me 3 hours yesterday"
- News: "OpenAI just changed everything. Here's what it means for you."
- List: "5 Stone AI prompts you haven't tried yet"
- Personal: "I almost gave up on this feature. Here's why I didn't."
- Urgency: "New feature dropping tomorrow — you're going to love it"
- Question: "Are you using the wrong AI agent?"

---

## A/B Testing Framework

### What to Test (Priority Order)
1. **Subject lines**: Highest impact, easiest to test. Test every email.
2. **Send time**: Test morning vs. afternoon vs. evening. Test day of week.
3. **CTA text**: "Upgrade now" vs. "See plans" vs. "Unlock more agents"
4. **Email length**: Short (100 words) vs. medium (250 words) vs. long (500+ words)
5. **From name**: "Stone AI" vs. "[Founder name] from Stone AI" vs. "[Founder name]"
6. **Design**: HTML template vs. plain text. For SaaS, plain text often wins.
7. **Personalization depth**: Name only vs. name + usage data vs. highly personalized content

### A/B Testing Rules
- **Sample size**: Minimum 200 recipients per variant for statistical significance
- **Winner selection**: Wait 24 hours before declaring a winner (some people check email on delay)
- **One variable at a time**: Never test subject line AND send time simultaneously
- **Document everything**: Keep a spreadsheet of test results. Patterns emerge over time.
- **Winning threshold**: >10% improvement is meaningful. <5% is noise.

### Testing Calendar
- Week 1: Subject line test
- Week 2: Send time test
- Week 3: CTA test
- Week 4: Content format test
- Monthly: Review all test results, implement winners permanently

---

## Transactional Emails

Transactional emails (receipts, confirmations, notifications) have 80-90% open rates — 3-4x higher than marketing emails. They are an underutilized marketing channel.

### Transactional Emails to Optimize

**Signup Confirmation**
- Standard content: "Your account is confirmed"
- Marketing upgrade: Add "Quick tip: Try Agent [X] for [use case]" and a testimonial

**Payment Receipt**
- Standard content: "Here's your receipt for $X"
- Marketing upgrade: Add "Pro tip: You now have access to [feature]. Try it here."

**Plan Upgrade Confirmation**
- Standard content: "You've been upgraded to [plan]"
- Marketing upgrade: "Welcome to [plan]! Here are the 3 things to try first..." with links

**Password Reset**
- Standard content: "Reset your password here"
- Marketing upgrade: Keep this clean. Don't market in security emails. Trust is paramount.

**Feature Notification**
- Standard content: "New feature available"
- Marketing upgrade: Show the feature with a screenshot/GIF, include a CTA to try it

**Referral Notification**
- Standard content: "Someone used your referral code"
- Marketing upgrade: "Nice! Keep sharing — here's your unique link. You've referred [X] people so far."

---

## Email Automation Sequences (Complete Map)

### Sequence 1: Welcome & Onboarding
- Trigger: User signup
- Emails: 5-7 over 14 days
- Goal: Activation (first meaningful product interaction)

### Sequence 2: Activation Push
- Trigger: Signed up but hasn't completed key action in 48 hours
- Emails: 3 over 7 days
- Goal: Complete activation milestone

### Sequence 3: Feature Discovery
- Trigger: Active user, 14+ days, hasn't tried specific features
- Emails: 1 per undiscovered feature (max 1/week)
- Goal: Increase feature adoption, increase stickiness

### Sequence 4: Upgrade Nurture
- Trigger: FREE user, 7+ days active, high engagement signals
- Emails: 4 over 21 days
- Goal: Convert to STARTER

### Sequence 5: Tier Expansion
- Trigger: Paid user approaching plan limits
- Emails: 2-3 over 14 days
- Goal: Upgrade to next tier

### Sequence 6: Annual Upsell
- Trigger: Monthly paid user, 3+ months tenure
- Emails: 2-3 over 14 days
- Goal: Convert to annual billing

### Sequence 7: Re-Engagement
- Trigger: Active user goes inactive (no login 3-7 days depending on baseline)
- Emails: 4 over 14-28 days
- Goal: Reactivate usage

### Sequence 8: Dunning (Failed Payment)
- Trigger: Stripe payment_intent.payment_failed webhook
- Emails: 4 over 7 days
- Goal: Recover payment, prevent involuntary churn

### Sequence 9: Win-Back
- Trigger: 30 days after plan cancellation
- Emails: 4 over 60 days
- Goal: Resubscribe

### Sequence 10: NPS & Feedback
- Trigger: 30 days after paid signup, then every 90 days
- Emails: 1 (with follow-up based on score)
- Goal: Collect NPS, identify promoters and detractors

### Sequence 11: Referral Activation
- Trigger: User gives NPS 9-10, or hits usage milestone, or 30 days of active paid usage
- Emails: 2 over 7 days
- Goal: Activate referral sharing

### Sequence 12: Newsletter
- Trigger: Subscribed (opt-in at signup, default on)
- Frequency: Weekly
- Goal: Retention, engagement, brand awareness

---

## Segmented Campaign Ideas

### Campaign 1: "Agent Mastery Series" (Stone AI)
- Target: Active users on any paid plan
- Format: 6-email series, one per week
- Content: Deep dive into one agent per email. Advanced prompts, pro tips, real examples.
- Goal: Increase feature adoption, reduce churn

### Campaign 2: "AI for Your Industry" (Stone AI)
- Target: Users segmented by industry (from onboarding survey)
- Format: 3-email mini-series
- Content: Industry-specific use cases and examples
- Goal: Show relevance, increase engagement

### Campaign 3: "Mobile AI Challenge" (Best AI Mobile)
- Target: All Best AI Mobile users
- Format: 5-day email challenge
- Content: One task per day using the app. "Day 1: Summarize your morning reading. Day 2: Draft 3 emails using voice."
- Goal: Build habit, increase daily active usage

### Campaign 4: "Build With Stone AI" (Stone AI Tools)
- Target: Registered developers
- Format: 4-email tutorial series
- Content: Build a complete project using the API, one step per email
- Goal: Move developers from registered to active users

### Campaign 5: "Refer & Earn" (All Products)
- Target: Active users with high NPS
- Format: 3-email sequence
- Content: Referral program details, referral link, progress updates
- Goal: Drive referral signups

### Campaign 6: "Year in Review" (All Products)
- Target: All users (end of year)
- Format: 1 email
- Content: Personal usage stats, AI industry milestones, thank you, what's coming next year
- Goal: Engagement, social sharing, retention

---

## Compliance & Legal

### CAN-SPAM Compliance (US)
- Include physical mailing address in every email
- Clear and prominent unsubscribe link
- Process unsubscribes within 10 business days (best practice: immediately)
- Do not use deceptive subject lines
- Identify the message as an ad (for promotional emails)

### GDPR Compliance (EU Users)
- Obtain explicit consent before sending marketing emails
- Provide clear privacy policy link
- Allow users to export their data
- Honor data deletion requests within 30 days
- Maintain consent records

### CASL Compliance (Canada)
- Express consent required for commercial emails
- Include sender identification
- Include unsubscribe mechanism
- Keep consent records for duration of consent + 6 months after

### Best Practices
- Double opt-in for newsletter subscriptions (reduces spam complaints by 75%+)
- Separate transactional and marketing email streams (different sending domains)
- Include email preferences center (let users choose frequency and content types)
- Regular list cleaning (monthly review of bounces, complaints, and inactivity)

---

## Email Template System

### Design Principles
1. **Mobile-first**: 65%+ of emails are opened on mobile. Design for small screens first.
2. **Simple**: One primary CTA per email. One column layout. Minimal images.
3. **Fast-loading**: Total email size under 100KB. Optimize images. Use web-safe fonts.
4. **Branded but clean**: Consistent header (logo), consistent footer (links, unsubscribe). Clean middle.
5. **Plain text option**: Always include a plain text version. Some email clients strip HTML.

### Template Types
1. **Welcome/Onboarding**: Warm, personal, logo header, single CTA button, minimal design
2. **Product Update**: Feature screenshot/GIF, brief description, CTA to try it
3. **Newsletter**: Multi-section with clear dividers, multiple links, consistent weekly format
4. **Upgrade/Promotional**: Bold CTA, pricing comparison, testimonial, urgency element
5. **Transactional**: Clean, informational, receipt-style, subtle marketing element
6. **Win-back**: Personal tone, minimal design (feels like a personal email, not marketing)
7. **Dunning**: Clear, urgent, action-oriented, payment update button

### From Name & Reply-To Strategy
- Onboarding emails: "[Founder Name] from Stone AI" — personal, sets the tone
- Product updates: "Stone AI" — brand authority
- Newsletter: "[Founder Name] @ Stone AI" — mix of personal and brand
- Transactional: "Stone AI" — professional, trustworthy
- Win-back: "[Founder Name]" — most personal, feels like a real email
- All emails: reply-to a monitored inbox. Replies to marketing emails are gold — read every one.

---

## Revenue Attribution & Reporting

### Email Revenue Tracking
1. **UTM parameters**: Every email link includes utm_source=email, utm_medium=[sequence_name], utm_campaign=[campaign_name]
2. **Conversion tracking**: Track email click → signup → paid conversion → revenue
3. **Stripe integration**: Tag Stripe customers with their email acquisition source
4. **LTV by email source**: Calculate lifetime value of customers acquired through each email sequence

### Monthly Email Report
1. **Deliverability**: Delivery rate, bounce rate, spam complaint rate
2. **Engagement**: Open rate, click rate, reply rate (by sequence and campaign)
3. **Conversion**: Email-attributed signups, trials, paid conversions
4. **Revenue**: Email-attributed MRR, expansion revenue, recovered revenue (dunning)
5. **List health**: Growth rate, churn rate, engagement distribution
6. **Test results**: A/B test outcomes and learnings
7. **Sequence performance**: Each automation sequence's key metrics
8. **Action items**: What to optimize, what to test, what to build next

### Benchmarks for AI SaaS Email Marketing
| Metric | Below Average | Average | Good | Excellent |
|--------|--------------|---------|------|-----------|
| Open rate | <15% | 15-25% | 25-35% | >35% |
| Click rate | <1% | 1-3% | 3-5% | >5% |
| Unsubscribe rate | >0.5% | 0.3-0.5% | 0.1-0.3% | <0.1% |
| Free→Paid conversion | <2% | 2-5% | 5-10% | >10% |
| Dunning recovery | <20% | 20-35% | 35-50% | >50% |

---

*This playbook is the operational manual for email marketing across all three Stone AI businesses. Every sequence, trigger, and template should be implemented, tested, and optimized continuously. Email is a compounding channel — small improvements in conversion rates multiply across the entire funnel over time.*
