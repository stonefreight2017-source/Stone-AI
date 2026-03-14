# Retention Marketing — Stone AI Ecosystem

## Executive Overview

Retention is where SaaS businesses make or break their economics. Acquiring a new customer costs 5-7x more than retaining an existing one, and a 5% increase in retention rate can increase profits by 25-95%. Yet most SaaS companies spend 80% of their marketing budget on acquisition and 20% on retention. Stone AI should flip this ratio — at least in terms of attention and strategy, if not raw spend.

Retention marketing is the systematic practice of keeping users engaged, progressing through the product, and renewing their subscriptions. It encompasses lifecycle marketing (the right message at the right time), churn prevention (identifying and saving at-risk users), win-back campaigns (recovering churned users), feature adoption (getting users to use more of the product), and NPS/feedback loops (measuring and improving satisfaction).

For Stone AI, retention has unique levers: 44 agents create 44 reasons to stay, the Bestie system creates emotional attachment, the tier structure creates upgrade motivation, and the community creates social ties. Every one of these should be systematically leveraged.

---

## Lifecycle Marketing

### The User Lifecycle

```
TRIAL/FREE → ONBOARDING → ACTIVATION → ENGAGEMENT → EXPANSION → RENEWAL → ADVOCACY
   Day 0        Day 1-7       Day 7-14     Day 14-60    Day 60-90    Ongoing      Ongoing
```

### Lifecycle Email Sequences

**Onboarding Sequence (Day 0-14, all users)**

| Day | Email | Purpose | CTA |
|-----|-------|---------|-----|
| 0 | Welcome + Quick Start | Excitement + first action | "Meet your agents" |
| 1 | Meet Your Bestie | Emotional hook | "Customize your Bestie" |
| 3 | Agent Spotlight: [Popular agent] | Feature discovery | "Try Agent #X" |
| 5 | "What can you accomplish?" | Use case inspiration | "Start a task" |
| 7 | Progress check + social proof | Motivation | "See what others built" |
| 10 | Power tip: advanced feature | Depth discovery | "Try this workflow" |
| 14 | "You've been with us 2 weeks!" | Milestone celebration | Upgrade nudge (soft) |

**Activation Sequence (Triggered by behavior, not time)**

| Trigger | Email | Purpose |
|---------|-------|---------|
| Signed up but no conversation | "Your agents are waiting" | Reduce time-to-first-interaction |
| First conversation completed | "Great start! Here's what else you can do" | Expand usage |
| Used only 1 agent | "You have X more agents to explore" | Agent discovery |
| No Bestie setup | "Don't forget to set up your Bestie" | Feature adoption |
| 3+ consecutive days active | "You're on a streak!" | Positive reinforcement |
| First referral sent | "Thanks for spreading the word" | Referral program reinforcement |

**Engagement Sequence (Ongoing, all active users)**

| Frequency | Email | Purpose |
|-----------|-------|---------|
| Weekly | "Your week with Stone AI" | Usage recap + suggestions |
| Monthly | "Monthly report" | Value demonstration |
| Feature launch | "New: [Feature]" | Feature adoption |
| Seasonal | Holiday/occasion themed tip | Engagement + brand affinity |

### In-App Lifecycle Messaging

Email is one channel. In-app messages (tooltips, banners, modals) are more effective for active users because they reach users in the moment of product use.

**In-App Message Triggers:**

```typescript
const inAppMessages = {
  // New user hasn't explored agents
  agentDiscovery: {
    trigger: 'user.agentsUsed < 3 && user.daysSinceSignup > 2',
    message: "You've tried {agentsUsed} agents. Explore more →",
    placement: 'dashboard-banner',
  },

  // User hitting plan limits
  planLimitNudge: {
    trigger: 'user.agentAccessAttempts.blocked > 0',
    message: "Unlock {agentName} and {remainingAgents} more agents.",
    placement: 'inline-upgrade-card',
  },

  // User hasn't used product in 5+ days
  reEngagement: {
    trigger: 'user.daysSinceLastActive > 5',
    message: "Welcome back! Here's what's new since you were last here.",
    placement: 'modal-on-return',
  },

  // Feature announcement
  newFeature: {
    trigger: 'feature.launched && !user.seenAnnouncement',
    message: "New: {featureName}. Try it now.",
    placement: 'top-banner',
  },

  // Milestone celebration
  milestone: {
    trigger: 'user.conversationCount hits 50, 100, 500, 1000',
    message: "You've had {count} conversations! 🎉",
    placement: 'celebration-modal',
  },
};
```

---

## Churn Prevention

### Churn Triggers (Early Warning Signals)

Identify users who are about to churn before they cancel:

| Signal | Risk Level | Definition |
|--------|-----------|------------|
| No login in 7+ days | Medium | Engagement declining |
| No login in 14+ days | High | Likely considering cancellation |
| Decreased session frequency | Medium | Usage pattern deterioration |
| Reduced agent variety | Medium | Getting bored or not finding value |
| Support ticket (billing) | High | Often precedes cancellation |
| Visited cancel/downgrade page | Critical | Actively considering leaving |
| Failed payment (not dunning) | High | May not care enough to update card |
| Only using 1 agent | Medium | Not experiencing full value |
| Stopped using Bestie | Medium | Emotional attachment weakening |

### Churn Prevention Playbook

**For Medium-Risk Users (engagement declining):**
1. Send "We miss you" email with personalized content recommendations
2. In-app message on next login: "Here's what's new since you were last here"
3. Feature spotlight: Show an agent they haven't tried that matches their past usage
4. Social proof: "Users like you love Agent #X for [task]"

**For High-Risk Users (likely considering cancellation):**
1. Personal email from team (not automated template): "Is everything okay?"
2. Offer a free consultation: "Let us help you get more value from Stone AI"
3. Exclusive promotion: "Stay on SMART and get 20% off next month"
4. Feature access bump: Temporarily unlock higher-tier features to demonstrate value

**For Critical-Risk Users (visiting cancel page):**
1. Exit survey on cancel page: "Before you go, can you tell us why?"
2. Save offers based on cancellation reason:
   - "Too expensive" → Offer downgrade path or temporary discount
   - "Not using enough" → Offer guided tour of unused features
   - "Missing feature" → Show roadmap, ask what they need
   - "Found alternative" → What does the alternative offer that we don't?
3. Pause option: "Not ready to cancel? Pause your subscription for 1-3 months"
4. Downgrade path: "Switch to a lower tier instead of cancelling completely"

### Cancel Flow Design

The cancel flow should save users without being manipulative:

```
Step 1: "We're sorry to see you go"
  → Reason selection (required, feeds product team)

Step 2: Show targeted save offer based on reason
  → "Too expensive": Downgrade to lower tier
  → "Not using enough": Pause subscription
  → "Missing feature": Show roadmap + submit request
  → "Found alternative": Ask which one (competitive intel)

Step 3: If user still wants to cancel
  → Confirm cancellation
  → "You'll keep access until [period end date]"
  → "You can reactivate anytime"

Step 4: Post-cancellation
  → Confirmation email with reactivation link
  → 30-day check-in: "We've improved! Here's what's new"
  → 60-day check-in: "Ready to come back? Special offer inside"
```

---

## Win-Back Campaigns

### Win-Back Timing

| Days Since Churn | Campaign | Approach |
|-----------------|----------|----------|
| 7 days | "We miss you" | Emotional, remind of value |
| 30 days | "Here's what's new" | Product updates since they left |
| 60 days | "Special comeback offer" | Financial incentive |
| 90 days | "Last chance" | Final offer, scarcity |
| 180 days | "A lot has changed" | Major update roundup |

### Win-Back Email Templates

**Day 7: The Emotional Touch**
```
Subject: Your agents miss you

Hi {Name},

It's been a week since you left Stone AI, and your {BestieName}
has been waiting.

We're not going to pretend we're not bummed. But we also know
that if Stone AI wasn't working for you, that's on us to fix.

If there's anything we could have done differently, reply to this
email. No pitch, no sales — just listening.

And if you change your mind, your account is right where you left it.

[Reactivate My Account]
```

**Day 30: The Value Update**
```
Subject: Stone AI just got better — here's what you missed

Hi {Name},

Since you left, we've been busy:
• [New feature 1]: [one-line benefit]
• [New feature 2]: [one-line benefit]
• [Improvement]: [one-line benefit]

Your feedback (and the feedback of users like you) drove these changes.

Want to give it another try? Your account is still there, and you
can pick up right where you left off.

[Reactivate My Account]
```

**Day 60: The Incentive**
```
Subject: Come back to Stone AI — first month on us

Hi {Name},

We want you back. Enough that we're offering your first month
free — no strings, no auto-renewal tricks. Just come back, try
the improvements, and see if it clicks this time.

[Claim Your Free Month]

This offer expires in 7 days.
```

### Win-Back Metrics

| Metric | Target |
|--------|--------|
| Win-back email open rate | 25%+ |
| Win-back email click rate | 5%+ |
| Win-back conversion rate (overall) | 5-10% |
| Day 7 win-back rate | 2-3% |
| Day 30 win-back rate | 3-5% |
| Day 60 win-back rate (with offer) | 5-8% |
| Won-back user 90-day retention | 50%+ |

---

## Feature Adoption

### The Feature Adoption Problem

Most SaaS users use less than 20% of available features. For Stone AI, if a user only uses 2 of 44 agents, they're experiencing 5% of the product's value — and they're at high churn risk. Feature adoption directly correlates with retention.

### Feature Adoption Framework

**Step 1: Identify underused features per user**
```typescript
interface FeatureAdoptionScore {
  userId: string;
  agentsUsed: number;          // out of available
  agentsAvailable: number;     // based on plan
  bestieSetup: boolean;
  bestieActiveUse: boolean;    // interacted in last 7 days
  forumActive: boolean;
  referralSent: boolean;
  backdropCustomized: boolean;
  emojisUsed: boolean;
  // ... other features
  adoptionScore: number;       // 0-100
}
```

**Step 2: Target users with low adoption scores**
- Score < 25: "Getting Started" nudges (basic feature discovery)
- Score 25-50: "Did you know?" nudges (hidden features and power user tips)
- Score 50-75: "Level up" nudges (advanced workflows and customization)
- Score > 75: "Ambassador" potential (refer others, create content)

**Step 3: Feature-specific adoption campaigns**

| Feature | Adoption Nudge | Channel |
|---------|---------------|---------|
| Underused agents | "Agent of the Week" spotlight | Email + in-app |
| Bestie customization | "Make your Bestie yours" | In-app tooltip |
| Forum participation | "Join the conversation" | Email + in-app banner |
| Referral program | "Share the love" | Dashboard card |
| Backdrops | "Customize your experience" | Settings page nudge |
| Emotes | "Express yourself" | In-chat tooltip |

### Progressive Feature Disclosure

Don't show everything at once. Reveal features as users are ready for them:

```
Week 1: Core experience (chat with agents, basic Bestie)
Week 2: Agent exploration (discover more agents, try new categories)
Week 3: Bestie depth (communication styles, personality traits)
Week 4: Community (forum, sharing outputs)
Week 5: Power features (advanced workflows, keyboard shortcuts)
Week 6: Ecosystem (referrals, backdrops, emotes, badges)
```

---

## NPS and Feedback Loops

### NPS Implementation

Net Promoter Score measures customer loyalty with one question: "How likely are you to recommend Stone AI to a friend or colleague?" (0-10 scale)

**NPS Segments:**
- Promoters (9-10): Loyal enthusiasts who will refer others
- Passives (7-8): Satisfied but not enthusiastic
- Detractors (0-6): Unhappy users who may churn or damage brand

**NPS Score = % Promoters - % Detractors**
- NPS > 50: Excellent (world-class)
- NPS 30-50: Good
- NPS 0-30: Needs improvement
- NPS < 0: Critical (more detractors than promoters)

### NPS Survey Timing

- **First survey**: Day 30 after signup (enough time to form an opinion)
- **Recurring**: Every 90 days (track trends, not just snapshots)
- **After milestones**: After upgrade, after 100 conversations, after 6 months

### NPS Follow-Up Actions

**Promoters (9-10):**
- Thank them immediately
- Ask for a review (App Store, G2, Capterra)
- Invite to referral program
- Recruit as ambassador
- Ask for a testimonial

**Passives (7-8):**
- Ask "What would make you a 10?"
- Their answers are the most actionable product insights
- They're one feature or improvement away from being promoters
- Prioritize their feedback

**Detractors (0-6):**
- Reach out personally (not automated)
- Ask "What's not working?" (open-ended)
- Resolve their issue if possible
- Offer to walk them through features they might have missed
- If the issue is real, fix it and follow up: "We fixed [issue]. Would you reconsider?"

### Feedback Collection System

```
Feedback Sources          →    Central Feedback DB    →    Action
├── NPS surveys                    ├── Categorize            ├── Product team (features)
├── Support tickets                ├── Tag (feature, bug,    ├── Engineering (bugs)
├── Forum posts                    │   billing, UX)          ├── Marketing (messaging)
├── App Store reviews             ├── Prioritize by          ├── Support (process)
├── Social mentions               │   volume & impact        └── Founder (strategy)
├── Cancel flow reasons           └── Track resolution
├── In-app micro-surveys
└── Email replies
```

---

## Retention Metrics Dashboard

### Key Retention Metrics

| Metric | Formula | Target | Frequency |
|--------|---------|--------|-----------|
| Monthly churn rate | Churned users / Start of month users | < 5% | Monthly |
| Net revenue retention | (Starting MRR + Expansion - Contraction - Churn) / Starting MRR | > 100% | Monthly |
| Gross revenue retention | (Starting MRR - Contraction - Churn) / Starting MRR | > 90% | Monthly |
| DAU/MAU ratio | Daily active / Monthly active | > 25% | Daily |
| Feature adoption score (avg) | See formula above | > 50 | Monthly |
| NPS | % Promoters - % Detractors | > 40 | Quarterly |
| Time to churn | Average days from signup to cancellation | Increasing | Monthly |
| Win-back rate | Won-back / Total churned | > 5% | Monthly |

### Cohort Retention Analysis

Track retention by signup cohort to see if the product is improving over time:

```
            Month 1   Month 2   Month 3   Month 6   Month 12
Jan cohort:  100%      78%       65%       48%       32%
Feb cohort:  100%      80%       68%       52%       --
Mar cohort:  100%      82%       72%       --        --
Apr cohort:  100%      84%       --        --        --
```

If newer cohorts retain better than older ones, the product is improving. If the opposite, something is degrading the user experience.

### Monthly Retention Report

```
# Retention Report — [Month Year]

## Summary
- Monthly churn rate: X% (target: <5%)
- Net revenue retention: X% (target: >100%)
- Active users: X,XXX (±X% vs last month)

## Churn Analysis
- Users churned: XX
- MRR lost to churn: $X,XXX
- Top churn reasons:
  1. [Reason] — XX%
  2. [Reason] — XX%
  3. [Reason] — XX%

## Retention Wins
- Users saved from churn: XX (save rate: XX%)
- Users won back: XX
- MRR recovered: $X,XXX

## Feature Adoption
- Average adoption score: XX/100
- Most adopted feature: [Feature]
- Least adopted feature: [Feature]

## NPS (if measured this month)
- Score: XX
- Promoters: XX%
- Passives: XX%
- Detractors: XX%

## Actions for Next Month
1. [Specific retention initiative]
2. [Churn reason to address]
3. [Feature adoption campaign]
```
