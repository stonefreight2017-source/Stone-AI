# Referral Program Design — Stone AI Ecosystem

## Executive Overview

Referral programs are the most capital-efficient growth channel in SaaS because they leverage existing customers to acquire new ones. A well-designed referral program turns every satisfied user into a sales team of one — and unlike paid advertising, the cost per acquisition is fixed, predictable, and only triggered on success (you pay after the referral converts, not before).

Stone AI already has a referral system built into the platform with `@@unique` enforcement, server-side validation, and Prisma-backed tracking. This seed covers the strategic layer on top of that infrastructure: how to design incentive structures that maximize referral volume, how to create viral loops that compound growth, and how to build ambassador programs that turn power users into brand evangelists.

**Key Referral Metrics:**
- Referral rate: % of users who make at least one referral (target: 10-15%)
- Referral conversion rate: % of referred visitors who sign up (target: 25-40%)
- Viral coefficient (K): Average referrals per user × conversion rate (target: >0.3, dream: >1.0)
- Referral CAC: Cost of referral incentive / referred customer (target: <50% of paid CAC)
- Time to first referral: Days from signup to first referral (target: <14 days)

---

## Referral System Architecture (Stone AI)

### Current System Overview

Stone AI's referral system is built on:
- **Unique referral codes**: Generated per user, stored in Prisma with `@@unique` constraint
- **Server-side validation**: No client-side bypasses, all referral attribution happens server-side
- **Claims on User model**: Referral rewards survive account changes (same pattern as easter egg claims)
- **Audit trail**: Every referral event is logged for fraud detection and reporting

### Referral Flow

```
Existing User                    New User
     │                               │
     ├─ Gets referral link/code ──→  │
     │                               ├─ Clicks link / enters code
     │                               ├─ Signs up (FREE account)
     │                               ├─ Referral attributed server-side
     │                               │
     │  ←── Pending reward ──────── │
     │                               │
     │                               ├─ [Optional] Upgrades to paid
     │                               │
     │  ←── Full reward triggered ── │
     │                               │
     ├─ Reward delivered             ├─ Welcome bonus delivered
     │                               │
```

### Referral Data Model

```typescript
// Conceptual model (aligns with existing Prisma schema patterns)
model Referral {
  id              String   @id @default(cuid())
  referrerId      String   // User who referred
  referredId      String   // User who was referred
  referralCode    String   // Code used
  status          ReferralStatus @default(PENDING)
  referrerReward  RewardType?
  referredReward  RewardType?
  convertedAt     DateTime?  // When referred user upgraded to paid
  createdAt       DateTime @default(now())

  referrer        User     @relation("referrals_made", fields: [referrerId], references: [id])
  referred        User     @relation("referrals_received", fields: [referredId], references: [id])

  @@unique([referrerId, referredId]) // Prevent duplicate referrals
}

enum ReferralStatus {
  PENDING      // Referred user signed up but hasn't converted
  CONVERTED    // Referred user upgraded to paid
  REWARDED     // Both parties received rewards
  EXPIRED      // Referral didn't convert within window
  FRAUDULENT   // Flagged by fraud detection
}
```

---

## Incentive Structure Design

### Types of Referral Incentives

**1. Double-Sided Incentives (Recommended for Stone AI)**
Both the referrer and the referred user get a reward. This is the most effective structure because it gives the referred user a reason to use the referral link (they get something too).

| Referrer Gets | Referred Gets | When |
|--------------|--------------|------|
| 1 free month of current plan | 1 free month of STARTER | Referred user upgrades to any paid plan |
| $10 account credit | $10 off first month | Referred user upgrades to PLUS or above |
| Exclusive badge (OG Referrer) | Early adopter badge | Referred user creates account |

**2. Tiered Incentives (Recommended for growth phase)**
Rewards increase as users refer more people, creating a gamification loop:

| Referrals | Reward |
|-----------|--------|
| 1 | Exclusive profile badge |
| 3 | 1 free month of current plan |
| 5 | Upgrade to next tier for 1 month |
| 10 | Permanent "Ambassador" badge + 2 months free |
| 25 | Lifetime discount (10% off forever) |
| 50 | Free plan upgrade for 1 year |

**3. Community-Benefit Incentives**
Instead of (or in addition to) personal rewards, offer community benefits:
- "For every 100 referrals our community makes this month, we unlock a new free agent for everyone"
- Creates social pressure and shared goals
- Particularly effective for building community identity

### Incentive Economics

Calculate the maximum incentive you can afford:

```
Average LTV of a referred customer:        $X
Average paid CAC (ads, content, etc.):      $Y
Maximum referral incentive budget:          $Y × 0.5 (50% of paid CAC)
Split between referrer and referred:        60/40 or 50/50

Example:
- Average LTV: $600 (SMART plan × 6 months average retention)
- Average paid CAC: $120
- Max referral budget: $60 per successful referral
- Referrer reward: $35 equivalent (e.g., 1 month free of SMART)
- Referred reward: $25 equivalent (e.g., first month of STARTER free)
```

### Incentive Timing

**Immediate rewards** (on signup): Lower-value rewards that trigger instantly when the referred user creates an account. These encourage volume.
- Badge, profile customization unlock, small credit

**Deferred rewards** (on paid conversion): Higher-value rewards that trigger when the referred user upgrades to a paid plan. These encourage quality referrals.
- Free months, account credits, tier upgrades

**Recommended approach**: Combine both. Give a small immediate reward (badge) to create instant gratification, plus a larger deferred reward (free month) to incentivize quality.

---

## Viral Loop Design

### What Makes a Referral Go Viral

A referral program becomes a viral growth engine when the viral coefficient (K) exceeds 1.0, meaning every user brings in more than one new user. While sustaining K>1 indefinitely is rare, even K=0.3-0.5 significantly reduces effective CAC.

**Viral Coefficient Formula:**
```
K = i × c
Where:
  i = invitations per user (average referrals sent)
  c = conversion rate of referrals (% who sign up)

Example:
  i = 3 (average user sends 3 referral invites)
  c = 0.25 (25% of invited people sign up)
  K = 0.75

With K=0.75:
  100 users → 75 new users → 56 new users → 42 → 32 → 24 → 18 → ...
  Total from 100 original: ~347 users (3.47x multiplier)
```

### Viral Loop Architecture

**Loop 1: The Classic Referral Loop**
```
User signs up → Uses product → Gets value → Shares referral →
Friend signs up → Friend gets value → Friend shares referral → ...
```

Optimization levers:
- Reduce time to value (faster "aha moment" = faster sharing)
- Make sharing effortless (one-click share to WhatsApp, Twitter, email)
- Show referral progress visually (progress bar toward next reward)

**Loop 2: The Social Proof Loop**
```
User achieves something with Stone AI → Shares result on social media →
Followers see the result → Click link to try → Sign up → Achieve something → Share...
```

Optimization levers:
- Make outputs shareable (add "Share this result" button to agent outputs)
- Include subtle Stone AI branding on shared outputs ("Made with Stone AI")
- Create share-worthy outputs (beautiful formatting, impressive results)

**Loop 3: The Collaboration Loop**
```
User invites colleague to collaborate → Colleague signs up →
Colleague invites their contacts → ...
```

This loop activates when Stone AI adds team/workspace features. Even before that:
- "Share this conversation" links
- "Invite a friend to try this agent" prompts
- Collaborative features in the forum

**Loop 4: The Content Loop**
```
User creates content about Stone AI → Published on their blog/social →
Readers find it → Sign up → Create their own content → ...
```

Optimization levers:
- Provide content templates ("Write a review, get a free month")
- Feature user-generated content on Stone AI's channels
- Create an affiliate program for content creators (see Influencer Partnership seed)

### Viral Triggers — When to Prompt Sharing

Prompt users to share at moments of peak satisfaction:

1. **After a breakthrough result**: "That was impressive! Want to share this with a friend?"
2. **After hitting a usage milestone**: "You've completed 100 conversations! Share the love."
3. **After upgrading**: "Welcome to SMART! Invite a friend and you both get a free month."
4. **After receiving a great Bestie interaction**: "Your Bestie nailed it! Know someone who'd love this?"
5. **After completing onboarding**: "Now that you're set up, bring a friend along for the journey."
6. **Seasonal moments**: "New Year, new AI tools. Give the gift of Stone AI."

### Sharing Mechanisms

**Referral Link**
- Unique per user: `stone-ai.net/ref/ABC123`
- Works on all platforms (universal link)
- Tracks click-through and conversion

**Referral Code**
- Short, memorable: `STONE-ABC123` or custom vanity codes for ambassadors
- Entered during signup
- Fallback for situations where links don't work (podcasts, verbal referrals)

**One-Click Share Buttons**
- WhatsApp (highest conversion for personal referrals)
- Twitter/X (highest reach for public referrals)
- Email (highest conversion for professional referrals)
- Copy link (universal fallback)
- SMS (mobile-specific, high conversion)

**QR Code**
- Generated per user, includes referral link
- Useful for in-person sharing, printed materials, conference badges
- Downloadable from the user's referral dashboard

---

## Ambassador Program

### What Is an Ambassador Program?

An ambassador program formalizes the relationship with your most active referrers. Instead of hoping users share on their own, you recruit, equip, and reward a select group of power users to be your external sales force.

### Ambassador Program Tiers

**Tier 1: Community Champions (Open enrollment)**
- Requirement: 5+ successful referrals
- Benefits: Ambassador badge, exclusive Discord/forum channel, monthly newsletter with insider updates
- Expectations: Share referral link at least monthly, engage in community
- Reward: Standard referral rewards (1 free month per successful referral)

**Tier 2: Stone Advocates (Application-based)**
- Requirement: 15+ successful referrals, active in community, positive engagement history
- Benefits: All Tier 1 + free plan upgrade (one tier), early access to features, quarterly call with team
- Expectations: Create at least 1 piece of content about Stone AI per month (tweet, blog post, video)
- Reward: Enhanced referral rewards (2 free months per successful referral) + revenue share option

**Tier 3: Brand Ambassadors (Invitation-only)**
- Requirement: 50+ successful referrals, established social/professional presence, brand-aligned values
- Benefits: All Tier 2 + free PRO plan, co-marketing opportunities, exclusive swag, annual in-person meetup
- Expectations: Regular content creation, speaking about Stone AI at events, quarterly case study participation
- Reward: Revenue share (10-20% of first 3 months of referred users' payments)

### Ambassador Onboarding Kit

Every new ambassador receives:

1. **Welcome message**: Personal (not automated) message thanking them for their advocacy
2. **Brand assets**: Logos, color codes, approved screenshots, product descriptions
3. **Content templates**: Tweet templates, blog post outlines, email templates
4. **Exclusive vanity referral code**: Custom code they choose (e.g., STONE-ALEX)
5. **Ambassador dashboard**: Real-time tracking of referrals, rewards, and leaderboard position
6. **Community access**: Private forum channel or Discord for ambassadors to share tips and connect
7. **FAQ document**: Answers to common questions they'll get from referrals

### Ambassador Communication Cadence

| Frequency | Communication | Purpose |
|-----------|--------------|---------|
| Weekly | Leaderboard update email | Motivation and gamification |
| Bi-weekly | New content/feature preview | Give ambassadors first-look advantage |
| Monthly | Newsletter with talking points | Arm ambassadors with fresh content |
| Quarterly | Video call / AMA | Build personal connection, gather feedback |
| Annually | Ambassador report + rewards | Recognize top performers, renew commitment |

---

## Fraud Prevention

### Common Referral Fraud Patterns

1. **Self-referral**: User creates multiple accounts to refer themselves
2. **Referral rings**: Groups of users referring each other in circles
3. **Fake accounts**: Bot-created accounts to trigger referral rewards
4. **Incentive abuse**: Converting referral rewards without genuine referral activity

### Anti-Fraud Measures

**Technical Controls:**
```typescript
// Fraud detection checks (server-side, every referral event)
const fraudChecks = {
  // IP address matching
  sameIP: referrer.signupIP === referred.signupIP,

  // Email domain matching (disposable email detection)
  disposableEmail: isDisposableEmail(referred.email),

  // Device fingerprint matching
  sameDevice: referrer.deviceFingerprint === referred.deviceFingerprint,

  // Timing anomaly (account created just to use referral)
  suspiciouslyFast: referred.createdAt - clickedReferralAt < 30_000, // < 30 sec

  // Referral volume anomaly (too many referrals too fast)
  volumeAnomaly: referrer.referralCountLast24h > 10,

  // Payment method matching
  samePaymentMethod: referrer.stripeFingerprint === referred.stripeFingerprint,
};

// Flag for review if 2+ checks trigger
const fraudScore = Object.values(fraudChecks).filter(Boolean).length;
if (fraudScore >= 2) {
  flagForReview(referral);
}
```

**Process Controls:**
- Rewards for paid conversions only (not signups) — eliminates most fake account fraud
- Delayed reward delivery (7-day hold after conversion) — catches quick chargebacks
- Manual review for any user with >10 referrals in a month
- `@@unique` constraint on referrer-referred pair prevents duplicate claims
- Referral rewards are non-transferable (can't cash out, only apply to own account)

---

## Referral Program Optimization

### Referral Dashboard Design

Every user should have access to a referral dashboard in their settings:

```
┌─────────────────────────────────────────────────┐
│  YOUR REFERRAL HUB                               │
├─────────────────────────────────────────────────┤
│                                                   │
│  Your Referral Link: stone-ai.net/ref/ABC123     │
│  [Copy] [Share on Twitter] [Share on WhatsApp]   │
│                                                   │
│  ┌───────────────────────────────────┐           │
│  │  Invited: 12  │  Signed Up: 7    │           │
│  │  Converted: 3 │  Rewards: $35    │           │
│  └───────────────────────────────────┘           │
│                                                   │
│  Progress to Next Reward:                         │
│  ████████░░░░░░░░ 3/5 referrals                  │
│  → 2 more referrals = upgrade to next tier (1mo) │
│                                                   │
│  Referral History:                                │
│  ✅ Alex M. — Signed up, upgraded to PLUS        │
│  ✅ Jordan K. — Signed up, upgraded to STARTER   │
│  ✅ Sam R. — Signed up, upgraded to SMART        │
│  ⏳ Riley T. — Signed up, not yet upgraded       │
│  ⏳ Casey L. — Signed up, not yet upgraded       │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Referral Program A/B Tests

Test these elements to optimize referral performance:

1. **Incentive amount**: Test different reward values (1 month free vs. 2 weeks vs. account credit)
2. **Incentive framing**: "Get $20 credit" vs. "Get 1 free month" vs. "Unlock premium features"
3. **Share prompt timing**: After onboarding vs. after 7 days vs. after a great interaction
4. **Share channel priority**: Which sharing buttons convert best? Optimize placement order.
5. **Referral page copy**: Test different headlines, social proof, and CTAs on the referral landing page
6. **Email reminders**: Test frequency and copy of "you have unused referral rewards" emails

### Referral Program Lifecycle

**Launch Phase (Month 1-3)**
- Launch with simple double-sided incentive (1 month free each)
- Promote heavily in-app, in email, and on social
- Monitor for fraud patterns and adjust controls
- Target: 5% of users make at least one referral

**Growth Phase (Month 4-6)**
- Introduce tiered incentives (more referrals = better rewards)
- Launch ambassador program Tier 1
- Create referral content templates for users
- Target: 10% referral rate, K=0.3

**Optimization Phase (Month 7-12)**
- A/B test incentive structures
- Launch ambassador Tiers 2 and 3
- Implement viral loops (shareable outputs, social proof)
- Target: 15% referral rate, K=0.5

**Scale Phase (Month 13+)**
- Revenue share for top ambassadors
- Integrate referrals into product experience (not just a separate page)
- Cross-product referrals (Stone AI users referring Best AI Mobile, and vice versa)
- Target: 20% referral rate, K=0.7+
