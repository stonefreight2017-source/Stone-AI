# Marketing Automation Workflows — Stone AI Ecosystem

## Executive Overview

Marketing automation is the infrastructure that makes personalized, timely communication possible at scale. Without automation, you'd need a team of people manually sending emails, tracking user behavior, scoring leads, and triggering follow-ups — activities that are repetitive, time-sensitive, and error-prone. With automation, every user gets the right message at the right time based on their actual behavior, not a one-size-fits-all schedule.

For Stone AI, marketing automation connects three critical systems: the product (user behavior and subscription data), the email platform (communication delivery), and the billing system (Stripe events that trigger lifecycle communications). When a user signs up, their onboarding emails start automatically. When they upgrade, their nurture sequence changes. When their payment fails, dunning emails fire. When they haven't logged in for two weeks, a re-engagement campaign activates. All of this happens without human intervention.

---

## Email Automation Architecture

### System Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   STONE AI APP   │     │  EMAIL PLATFORM   │     │     STRIPE       │
│                  │     │  (Resend, SES,    │     │                  │
│  User behavior   │────→│   or SendGrid)    │     │  Billing events  │
│  Events & data   │     │                  │     │  Webhooks        │
│                  │     │  Templates        │     │                  │
│  Prisma DB       │     │  Sequences        │     │                  │
│  (user state)    │     │  Delivery         │     │                  │
└────────┬─────────┘     └──────────────────┘     └────────┬─────────┘
         │                                                   │
         └──────────────── AUTOMATION ENGINE ────────────────┘
                     (Next.js API routes + cron jobs
                      or dedicated service)
```

### Email Platform Selection

| Platform | Best For | Cost | Key Features |
|----------|---------|------|-------------|
| Resend | Developer-first, Next.js native | $20/mo for 50K emails | React email templates, great API |
| SendGrid | High volume, established | $20/mo for 50K emails | Powerful automation, analytics |
| Amazon SES | Maximum cost efficiency | ~$0.10 per 1K emails | Cheapest at scale, requires more setup |
| Postmark | Transactional email reliability | $10/mo for 10K emails | Best deliverability for transactional |
| Loops | SaaS-focused automation | $49/mo for 5K contacts | Built for SaaS lifecycle marketing |

**Recommendation**: Resend for transactional emails (account creation, password reset, payment receipts) + Loops or custom-built for marketing automation sequences. As Stone AI scales, consider SendGrid for its automation builder.

### Email Types and Prioritization

**Transactional (must-send, high deliverability)**
- Account creation confirmation
- Password reset
- Payment receipts and invoices
- Subscription changes (upgrade, downgrade, cancel)
- Failed payment notifications
- Security alerts

**Lifecycle (automated, behavior-triggered)**
- Onboarding sequence (Day 0-14)
- Activation nudges (feature-based triggers)
- Re-engagement campaigns (inactivity triggers)
- Upgrade prompts (usage-based triggers)
- Churn prevention (risk signals)
- Win-back campaigns (post-churn)

**Marketing (scheduled, segment-targeted)**
- Weekly newsletter
- Feature announcements
- Promotional campaigns
- Content marketing (blog digest)
- Seasonal campaigns

---

## Core Automation Workflows

### Workflow 1: Onboarding Sequence

**Trigger**: User creates account (any tier)
**Duration**: 14 days
**Goal**: Activate user (first agent interaction + Bestie setup)

```
Day 0 (Immediate):
  IF signup_method = 'google_oauth'
    → Email: "Welcome! Your account is ready" (skip password setup)
  ELSE
    → Email: "Welcome! Verify your email to get started"

Day 0 (+2 hours):
  IF user.firstConversation = false
    → Email: "Your AI team is waiting — try your first agent"
  ELSE
    → Skip (already activated)

Day 1:
  IF user.bestieSetup = false
    → Email: "Meet your Bestie — your personal AI companion"
  ELSE
    → Email: "Your Bestie is ready! Here's how to get the most out of it"

Day 3:
  IF user.agentsUsed < 2
    → Email: "Agent spotlight: [Most popular agent for their use case]"
  ELSE
    → Email: "You're exploring! Here are 3 agents you haven't tried yet"

Day 5:
  → Email: "5 things you can do with Stone AI you might not know about"

Day 7:
  IF user.conversationCount > 5
    → Email: "You're a power user already! Here's an advanced tip"
  ELSE IF user.conversationCount > 0
    → Email: "Keep the momentum going — here's a task to try today"
  ELSE
    → Email: "We noticed you haven't chatted with your agents yet. Need help?"

Day 10:
  IF user.plan = 'FREE' && user.conversationCount > 10
    → Email: "You're getting great use from Stone AI! See what STARTER unlocks"
  ELSE
    → Email: "Pro tip: [Feature they haven't discovered yet]"

Day 14:
  → Email: "Two weeks with Stone AI — here's your recap"
    (Show: conversations, agents used, Bestie interactions)
  IF user.plan = 'FREE'
    → Include soft upgrade CTA
```

### Workflow 2: Upgrade Nurture (FREE Users)

**Trigger**: User is on FREE plan + has been active for 7+ days
**Duration**: Ongoing (monthly cadence after initial sequence)
**Goal**: Convert FREE → paid

```
Entry Criteria:
  plan = FREE AND daysSinceSignup >= 7 AND conversationCount >= 3

Week 2:
  → Email: "You're using {agentsUsed} of 4 free agents. Here's what 16 agents look like."
  → Show: Agent grid with free (unlocked) and STARTER (locked) agents

Week 4:
  IF user tried to access locked agent
    → Email: "You tried to use {agentName}. Unlock it for $9.99/first month"
  ELSE
    → Email: "Users who upgraded to STARTER saved an average of X hours/week"

Week 8:
  → Email: "Special offer: First month of STARTER for $9.99"
  → Offer expires in 7 days (create urgency)

Monthly (ongoing):
  → Email: "What's new on Stone AI" + subtle upgrade CTA
  → Rotate between: agent spotlights, user stories, feature previews

EXIT CONDITIONS:
  - User upgrades → Move to "Paid User Nurture" workflow
  - User unsubscribes → Stop all marketing emails
  - User churns (deletes account) → Move to "Win-Back" workflow
```

### Workflow 3: Paid User Engagement

**Trigger**: User upgrades to any paid plan
**Duration**: Ongoing
**Goal**: Maximize feature adoption + prevent churn

```
Upgrade Day (Immediate):
  → Email: "Welcome to {planName}! Here's everything you just unlocked"
  → List: New agents available, features unlocked, Bestie upgrades

Day 3:
  → Email: "3 agents you should try on your {planName} plan"
  → Personalized based on their usage patterns

Day 7:
  → Email: "How's {planName} treating you? Quick feedback?"
  → 1-question survey: "How likely are you to continue? (1-5)"
  IF response <= 2
    → Alert support team for personal outreach

Day 30:
  → Email: "Your first month on {planName} — here's your report"
  → Usage stats, agents used, Bestie interactions, value delivered

Ongoing (monthly):
  → Usage report with personalization
  → Feature adoption nudges for unused features
  → Upgrade nudge (if applicable): "Ready for {nextTierName}?"

TRIGGER: Low usage detected (< 3 sessions in 14 days)
  → Re-engagement email: "Your agents miss you"
  → In-app notification on next login

TRIGGER: High usage detected (top 10% of plan)
  → Email: "You're getting amazing value! Consider {nextTierName} for even more"
```

### Workflow 4: Stripe Billing Event Automation

**Trigger**: Stripe webhook events
**Goal**: Automate all billing-related communication

```typescript
// Stripe webhook → email automation mapping
const billingAutomation: Record<string, EmailAction> = {

  // Payment succeeded
  'invoice.payment_succeeded': {
    email: 'payment-receipt',
    data: { amount, plan, nextBillingDate },
    timing: 'immediate',
  },

  // Payment failed (first attempt)
  'invoice.payment_failed': {
    email: 'payment-failed-soft',
    data: { amount, retryDate, updatePaymentLink },
    timing: 'immediate',
    // "Your payment of $X didn't go through. We'll retry on [date].
    //  Update your card here: [link]"
  },

  // Subscription past due (payment failed multiple times)
  'customer.subscription.updated[status=past_due]': {
    email: 'payment-failed-urgent',
    data: { amount, daysUntilCancellation, updatePaymentLink },
    timing: 'immediate',
    // "Your Stone AI subscription is at risk. Update your payment
    //  method to keep your {planName} features."
  },

  // Trial ending
  'customer.subscription.trial_will_end': {
    email: 'trial-ending',
    data: { trialEndDate, planName, price },
    timing: '3 days before trial end',
    // "Your trial ends on [date]. You'll be charged $X for {planName}.
    //  Keep your plan or switch — here's how."
  },

  // Subscription canceled
  'customer.subscription.deleted': {
    email: 'subscription-canceled',
    data: { planName, accessEndDate, reactivateLink },
    timing: 'immediate',
    // "Your {planName} subscription has been canceled. You'll keep
    //  access until [date]. Miss us? Reactivate anytime."
    followUp: [
      { delay: '7d', email: 'win-back-day-7' },
      { delay: '30d', email: 'win-back-day-30' },
      { delay: '60d', email: 'win-back-day-60' },
    ],
  },

  // Subscription upgraded
  'customer.subscription.updated[plan_change=upgrade]': {
    email: 'upgrade-confirmation',
    data: { fromPlan, toPlan, newFeatures },
    timing: 'immediate',
  },

  // Subscription downgraded
  'customer.subscription.updated[plan_change=downgrade]': {
    email: 'downgrade-confirmation',
    data: { fromPlan, toPlan, lostFeatures, effectiveDate },
    timing: 'immediate',
    // "You've switched from {fromPlan} to {toPlan}. You'll keep
    //  {fromPlan} features until [date]. Changed your mind? [Undo link]"
  },

  // Annual renewal approaching
  'invoice.upcoming[annual]': {
    email: 'annual-renewal-reminder',
    data: { amount, renewalDate, planName },
    timing: '14 days before renewal',
    // "Your annual {planName} subscription renews on [date] for $X.
    //  Thank you for being a loyal member!"
  },
};
```

---

## Lead Scoring

### What Is Lead Scoring?

Lead scoring assigns a numerical value to each user based on their behavior and characteristics. Higher scores indicate higher likelihood of conversion (for free users) or higher engagement/retention risk management (for paid users).

### Scoring Model

**Behavioral Scoring (actions in the product):**

| Action | Points | Rationale |
|--------|--------|-----------|
| Account created | +10 | Baseline |
| Email verified | +5 | Commitment signal |
| First conversation | +15 | Activation |
| Bestie setup | +10 | Emotional investment |
| 5+ conversations | +10 | Engagement |
| 10+ conversations | +15 | Power user signal |
| Used 3+ different agents | +10 | Feature exploration |
| Forum post | +5 | Community engagement |
| Referral sent | +15 | Advocacy signal |
| Visited pricing page | +20 | Purchase intent |
| Visited upgrade page | +25 | High purchase intent |
| Attempted locked agent | +15 | Feature desire |
| No login in 7 days | -10 | Engagement decline |
| No login in 14 days | -20 | Churn risk |
| Support ticket (billing) | -5 | Friction signal |

**Demographic Scoring (user attributes):**

| Attribute | Points | Rationale |
|-----------|--------|-----------|
| Professional email domain | +5 | Higher LTV potential |
| Referred by existing user | +10 | Social proof, higher retention |
| Signed up with Google OAuth | +5 | Lower friction = more engaged |
| Located in high-LTV country | +5 | US, UK, DE, JP = higher conversion |

### Score Thresholds and Actions

| Score Range | Classification | Action |
|-------------|---------------|--------|
| 0-25 | Cold | Onboarding nurture, basic engagement |
| 26-50 | Warm | Feature discovery nudges, soft upgrade |
| 51-75 | Hot | Upgrade offer, priority support |
| 76+ | Champion | Ambassador recruitment, referral program |

### Scoring Implementation

```typescript
// Lead scoring service
interface UserScore {
  userId: string;
  behavioralScore: number;
  demographicScore: number;
  totalScore: number;
  classification: 'cold' | 'warm' | 'hot' | 'champion';
  lastCalculated: Date;
}

async function calculateUserScore(userId: string): Promise<UserScore> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      conversations: true,
      referrals: true,
      forumPosts: true,
    },
  });

  let behavioral = 10; // base (account created)

  if (user.emailVerified) behavioral += 5;
  if (user.conversations.length >= 1) behavioral += 15;
  if (user.conversations.length >= 5) behavioral += 10;
  if (user.conversations.length >= 10) behavioral += 15;
  if (user.bestieSetup) behavioral += 10;
  if (uniqueAgentsUsed(user) >= 3) behavioral += 10;
  if (user.forumPosts.length > 0) behavioral += 5;
  if (user.referrals.length > 0) behavioral += 15;
  if (visitedPricingPage(user)) behavioral += 20;

  // Decay for inactivity
  const daysSinceLogin = daysSince(user.lastActiveAt);
  if (daysSinceLogin > 14) behavioral -= 20;
  else if (daysSinceLogin > 7) behavioral -= 10;

  let demographic = 0;
  if (isProfessionalEmail(user.email)) demographic += 5;
  if (user.referredBy) demographic += 10;
  if (user.signupMethod === 'google') demographic += 5;

  const total = Math.max(0, behavioral + demographic);
  const classification =
    total >= 76 ? 'champion' :
    total >= 51 ? 'hot' :
    total >= 26 ? 'warm' : 'cold';

  return { userId, behavioralScore: behavioral, demographicScore: demographic,
           totalScore: total, classification, lastCalculated: new Date() };
}
```

---

## Behavioral Triggers

### Event-Based Automation

Beyond scheduled sequences, automation should respond to real-time user behavior:

```typescript
// Behavioral trigger definitions
const behavioralTriggers = {

  // Agent exploration trigger
  'agent.locked_access_attempt': {
    condition: 'user tried to access a locked agent',
    action: async (event) => {
      await sendEmail(event.userId, 'agent-unlock-nudge', {
        agentName: event.agentName,
        requiredPlan: event.requiredPlan,
        promoAvailable: await hasActivePromo(event.userId),
      });
    },
    cooldown: '7d', // Don't re-trigger for 7 days
  },

  // Usage milestone
  'user.conversation_milestone': {
    condition: 'user hits 10, 25, 50, 100, 500, 1000 conversations',
    action: async (event) => {
      await sendEmail(event.userId, 'milestone-celebration', {
        count: event.milestone,
        badge: getBadgeForMilestone(event.milestone),
      });
      if (event.milestone >= 50 && event.userPlan === 'FREE') {
        await sendEmail(event.userId, 'power-user-upgrade', {
          milestone: event.milestone,
        });
      }
    },
    cooldown: 'per_milestone', // Once per milestone level
  },

  // Referral success
  'referral.converted': {
    condition: 'referred user upgrades to paid',
    action: async (event) => {
      await sendEmail(event.referrerId, 'referral-reward', {
        referredName: event.referredName,
        reward: event.rewardDetails,
      });
    },
    cooldown: 'none', // Every referral triggers
  },

  // Re-engagement
  'user.inactive': {
    condition: 'no login in 7+ days AND was previously active (5+ sessions)',
    action: async (event) => {
      const daysSince = event.daysSinceLastLogin;
      if (daysSince === 7) {
        await sendEmail(event.userId, 'we-miss-you-soft');
      } else if (daysSince === 14) {
        await sendEmail(event.userId, 'we-miss-you-urgent');
      } else if (daysSince === 30) {
        await sendEmail(event.userId, 'comeback-offer');
      }
    },
    cooldown: '7d',
  },

  // Plan limit approaching
  'usage.approaching_limit': {
    condition: 'user has used 80% of plan agent interactions',
    action: async (event) => {
      await sendEmail(event.userId, 'usage-limit-approaching', {
        currentUsage: event.currentUsage,
        limit: event.planLimit,
        nextPlan: event.nextPlanOption,
      });
    },
    cooldown: '30d',
  },
};
```

### Trigger Management Best Practices

1. **Cooldown periods**: Never send the same trigger email more than once per cooldown period. Users who get bombarded unsubscribe.
2. **Global send limit**: Maximum 1 triggered email per day per user (excluding transactional). Marketing emails should not overwhelm.
3. **Unsubscribe respect**: If a user unsubscribes from marketing emails, only transactional emails continue.
4. **A/B test triggers**: Test different trigger conditions, email content, and timing to optimize conversion.
5. **Audit log**: Log every triggered email with the trigger condition, user state, and outcome for debugging and optimization.

---

## Automation Performance Measurement

### Email Metrics by Category

| Metric | Transactional Target | Lifecycle Target | Marketing Target |
|--------|---------------------|-----------------|-----------------|
| Open rate | 80%+ | 35-45% | 25-35% |
| Click rate | 20%+ | 8-15% | 3-8% |
| Unsubscribe rate | < 0.1% | < 0.3% | < 0.5% |
| Bounce rate | < 1% | < 2% | < 3% |
| Spam complaint rate | < 0.01% | < 0.05% | < 0.1% |

### Workflow Performance Dashboard

```
# Automation Performance — [Month Year]

## Workflow Summary
| Workflow | Emails Sent | Open Rate | Click Rate | Conversion |
|----------|------------|-----------|------------|------------|
| Onboarding | X,XXX | XX% | XX% | XX% activated |
| Upgrade Nurture | X,XXX | XX% | XX% | XX% upgraded |
| Re-engagement | XXX | XX% | XX% | XX% re-engaged |
| Win-back | XXX | XX% | XX% | XX% won back |
| Billing | X,XXX | XX% | XX% | XX% resolved |

## Top Performing Emails
1. [Email name] — XX% open, XX% click
2. [Email name] — XX% open, XX% click

## Underperforming Emails (Action Needed)
1. [Email name] — XX% open (below target)
2. [Email name] — XX% click (below target)

## Behavioral Triggers
| Trigger | Fires/Month | Conversion | Revenue Impact |
|---------|------------|------------|----------------|
| Locked agent | XXX | XX% upgrade | $X,XXX |
| Milestone | XXX | XX% share | Indirect |
| Inactive | XXX | XX% re-engaged | $X,XXX saved |

## Email Deliverability
- Delivery rate: XX%
- Bounce rate: X%
- Spam complaints: X
- Domain reputation: [Good/Watch/Bad]
```

### Implementation Priority

```
Phase 1 (Week 1-2): Foundation
□ Set up email platform (Resend for transactional)
□ Implement Stripe webhook → email triggers
□ Build onboarding sequence (Day 0-14)
□ Set up transactional emails (receipts, password reset, verification)

Phase 2 (Week 3-4): Lifecycle
□ Build upgrade nurture workflow (FREE users)
□ Build re-engagement workflow (inactive users)
□ Implement behavioral triggers (top 3)
□ Set up lead scoring model

Phase 3 (Month 2): Optimization
□ Build win-back workflow
□ Build paid user engagement workflow
□ A/B test email subject lines and content
□ Implement global send limits and cooldowns

Phase 4 (Month 3+): Scale
□ Advanced behavioral triggers
□ Predictive scoring (ML-based)
□ Cross-product automation (Stone AI + Tools + Mobile)
□ Dynamic content personalization in emails
□ Advanced segmentation and micro-campaigns
```
