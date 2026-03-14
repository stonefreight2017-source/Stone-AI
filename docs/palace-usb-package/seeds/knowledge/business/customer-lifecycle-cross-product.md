# Customer Lifecycle — Cross-Product Management

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Cardinal (Head 2)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Strategic

---

## 1. Executive Summary

A customer's lifecycle in a single-product company is linear: acquire, activate, retain, monetize, refer. In a three-product ecosystem, the lifecycle branches, loops, and compounds. A user acquired in one product can be activated in another, retained by a third, and monetized across all three. This seed maps the complete cross-product customer lifecycle, from first touch to ecosystem ambassador.

---

## 2. Lifecycle Stages

### 2.1 The Cross-Product Lifecycle Model

```
AWARENESS → ACQUISITION → ACTIVATION → ENGAGEMENT → EXPANSION → RETENTION → ADVOCACY
    │            │            │             │            │           │          │
    │            │            │             │            │           │          │
    ▼            ▼            ▼             ▼            ▼           ▼          ▼
 Knows about  Signs up    First value   Regular     Adopts 2nd   Stays      Refers
 any product  for one     moment in     usage in    product      across     others,
              product     that product  product 1                products   creates
                                                                            content
```

Unlike single-product lifecycles, cross-product lifecycle has these unique properties:
- **Multiple entry points**: Users can enter through any of three products
- **Parallel stages**: A user can be in "engagement" on one product and "acquisition" on another simultaneously
- **Compounding retention**: Each additional product increases overall stickiness
- **Non-linear expansion**: Users don't follow a fixed product adoption sequence

### 2.2 Stage Definitions

**Stage 1: Awareness**
```
Definition: User knows at least one product exists
Channels:
  - Organic search (SEO for Stone AI, ASO for Best AI, DevRel for Tools)
  - Social media (Concept E parent account + product accounts)
  - Word of mouth / referrals
  - Paid advertising
  - Content marketing / tech blogs
  - App Store browsing
  - Developer communities (GitHub, Discord, Stack Overflow)

Cross-Product Awareness:
  - Awareness of one product → awareness of ecosystem
  - Footer endorsement: "A Concept E company — also try Best AI & Stone AI Tools"
  - Unified social presence drives awareness for all products
```

**Stage 2: Acquisition**
```
Definition: User creates account on any product
Key Metrics:
  - Signup conversion rate (visitor → account)
  - Cost per acquisition (CPA) by channel
  - Entry product distribution (which product acquires most users?)

Cross-Product Acquisition:
  - Single Clerk account serves all products
  - First product signup = ecosystem entry
  - Track "entry product" in user metadata
  - Entry product influences cross-sell sequence
```

**Stage 3: Activation**
```
Definition: User experiences first "aha moment"
Activation Events by Product:
  Stone AI: First meaningful agent interaction (>3 exchanges)
  Best AI: First agent interaction via mobile (any length)
  Tools: First successful API call that returns useful data

Cross-Product Activation:
  - Activated on product 1 but not product 2 = partial activation
  - Full ecosystem activation = activated on all adopted products
  - Activation rate tracks per product AND cross-product
```

**Stage 4: Engagement**
```
Definition: Regular, recurring usage
Engagement Thresholds:
  Stone AI: 3+ sessions per week, 5+ agent interactions per session
  Best AI: 5+ app opens per week, 3+ agent interactions per session
  Tools: 50+ API calls per week, active integration

Cross-Product Engagement:
  - Engagement on multiple products compounds total time with ecosystem
  - Cross-product features (bestie sync, conversation handoff) deepen engagement
  - Ecosystem score reflects multi-product engagement
```

**Stage 5: Expansion**
```
Definition: User adopts additional products or upgrades tiers
Expansion Types:
  - Horizontal: Adopts second or third product
  - Vertical: Upgrades tier on existing product
  - Both: New product + tier upgrade simultaneously (bundle)

Cross-Product Expansion Triggers:
  - Behavioral triggers (see cross-sell trigger system)
  - Tier limit hits → expansion opportunity
  - Feature needs that another product fulfills
  - Bundle pricing incentive
```

**Stage 6: Retention**
```
Definition: User remains active over extended periods
Retention Measurement:
  - Per-product: Active in last 30 days on specific product
  - Cross-product: Active on ANY product in last 30 days
  - Deep retention: Active on ALL adopted products in last 30 days

Cross-Product Retention Dynamics:
  - Users on 2 products: 85% 90-day retention (vs. 65% single-product)
  - Users on 3 products: 93% 90-day retention
  - Each additional product adds ~10-15% retention lift
  - Losing one product doesn't mean losing the user
```

**Stage 7: Advocacy**
```
Definition: User actively promotes the ecosystem
Advocacy Behaviors:
  - Referral program participation (spans all products)
  - Forum contributions (Stone AI)
  - App Store reviews (Best AI)
  - GitHub stars / community contributions (Tools)
  - Social media mentions
  - Case studies / testimonials

Cross-Product Advocacy:
  - Ecosystem ambassadors (score >80) → active promoters
  - Referral rewards scale with products referred to
  - Community leaders get cross-product perks
```

---

## 3. Acquisition Strategies by Entry Product

### 3.1 Stone AI (Web) Acquisition

**Primary Channels**:
| Channel | Strategy | CAC Target | Volume |
|---------|----------|-----------|--------|
| SEO | "AI agents for [use case]" content | $0-5 | High |
| Google Ads | "[Competitor] alternative" + "AI assistant" | $15-30 | Medium |
| Social Media | Agent showcase demos, before/after | $5-15 | Medium |
| Referrals | Existing users invite friends | $0-10 | Medium |
| Product Hunt | Launch campaign | $0 | Spike |

**Onboarding Flow**:
```
1. Landing page → "Try free" CTA
2. Clerk signup (email, Google, GitHub)
3. Onboarding wizard:
   a. "What brings you here?" (use case selection)
   b. Pick your backdrop (visual personalization)
   c. Meet your Bestie (companion setup)
   d. First agent interaction (guided)
4. Activation milestone: Complete first agent conversation
5. Post-activation: Explore 3 more agents → engaged
```

### 3.2 Best AI (Mobile) Acquisition

**Primary Channels**:
| Channel | Strategy | CAC Target | Volume |
|---------|----------|-----------|--------|
| App Store Optimization | Keywords, screenshots, description | $0-3 | High |
| Apple Search Ads | "AI assistant" "AI chat" keywords | $2-8 | Medium |
| Social Media | Mobile demo videos (TikTok, Instagram) | $3-10 | High |
| Cross-Sell (Stone AI) | Existing web users → mobile download | $0 | Medium |
| Influencer | Tech YouTubers, productivity bloggers | $10-25 | Low-Med |

**Onboarding Flow**:
```
1. App Store download
2. Quick signup (under 30 seconds)
   - "Already have a Stone AI account? Sign in" (cross-product link)
   - New user: email/social signup
3. Simplified onboarding:
   a. "What do you need help with?" (3 quick-pick options)
   b. Bestie intro (voice or text preference)
   c. First interaction (voice or text)
4. Activation: First agent response that makes user smile/think
5. Push notification opt-in (day 2, after value demonstrated)
```

### 3.3 Stone AI Tools (API) Acquisition

**Primary Channels**:
| Channel | Strategy | CAC Target | Volume |
|---------|----------|-----------|--------|
| Developer SEO | "AI agent API" "LLM API" content | $0-5 | Medium |
| GitHub | Open-source SDK, examples, integrations | $0 | Medium |
| Dev Communities | Discord, Reddit, HN, Dev.to posts | $0-10 | Medium |
| Documentation | Exceptional docs drive organic adoption | $0 | High |
| Cross-Sell | Stone AI/Best AI users with dev profiles | $0 | Low-Med |

**Onboarding Flow**:
```
1. tools.stone-ai.net landing → "Get API Key" CTA
2. Clerk signup (prioritize GitHub SSO)
3. Developer onboarding:
   a. Generate API key
   b. Interactive API explorer (try a call right now)
   c. Quick-start code snippet (copy-paste to terminal)
   d. First successful API response
4. Activation: 10+ successful API calls in first week
5. Follow-up: SDK recommendations based on detected language
```

---

## 4. Cross-Product Expansion Playbook

### 4.1 Expansion Paths

**Most Common Paths** (predicted):
```
Path 1 (45%): Stone AI → Best AI → Tools
  Web users go mobile, then some become developers

Path 2 (25%): Stone AI → Tools
  Web power users want programmatic access

Path 3 (15%): Best AI → Stone AI → Tools
  Mobile-first users discover the full web experience

Path 4 (10%): Tools → Stone AI → Best AI
  Developers explore the consumer product

Path 5 (5%): Best AI → Stone AI
  Mobile users expand to web, don't need API
```

### 4.2 Expansion Timing

When to introduce the second product:
```
Signal-based (preferred over time-based):
  ✓ User hits tier limits → suggest product with more capacity
  ✓ User asks about a feature the other product has → suggest it
  ✓ User shows behavior matching other product's use case → suggest it
  ✓ User's ecosystem score reaches 30+ → ready for expansion

Time-based fallbacks:
  Day 14: If engaged but no expansion signal, gentle introduction
  Day 30: If still single-product, targeted cross-sell campaign
  Day 60: If no expansion, reduce cross-sell frequency (not interested)
```

### 4.3 Expansion Incentives

| Incentive | Trigger | Offer |
|-----------|---------|-------|
| Free trial upgrade | Signs up for 2nd product | 7-day premium access on product 2 |
| Bundle discount | Active on 2 products | 20% off when bundling |
| Feature unlock | Expands to 3rd product | Exclusive "Ecosystem Pioneer" badge |
| Referral bonus | Refers someone to any product | Double referral credit |
| Loyalty reward | 90 days on 2+ products | 1 month free on lowest-tier product |

---

## 5. Unified Churn Prevention

### 5.1 Churn Signals (Cross-Product)

```typescript
interface ChurnSignal {
  userId: string;
  signalType: string;
  product: string;
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: Date;
  daysUntilPredictedChurn: number;
}
```

**Churn Signal Matrix**:
| Signal | Severity | Product | Time to Act |
|--------|----------|---------|-------------|
| No login in 7 days (any product) | Low | All | 14 days |
| Session duration declining 3 weeks | Medium | Product-specific | 21 days |
| Downgraded tier | High | Product-specific | 7 days |
| Cancelled subscription | Critical | Product-specific | 3 days |
| Negative support interaction | High | Product-specific | 5 days |
| Removed API integration | Critical | Tools | 3 days |
| Disabled push notifications | Medium | Best AI | 14 days |
| Deleted bestie | Critical | Any | Immediate |
| No login across ALL products 14 days | Critical | All | 3 days |
| Competing product detected in conversation | High | Any | 7 days |

### 5.2 Retention Interventions

**Tier 1 — Automated (Low-Medium signals)**:
```
Bestie-delivered nudge:
  "Hey, I haven't seen you on [product] in a while.
   [Personalized value reminder based on their usage history]"

Email sequence:
  Day 7: "What you missed this week on [product]"
  Day 14: "[Personalized] Your [favorite agent] has a new trick"
  Day 21: "We'd love you back — here's 20% off your next month"
```

**Tier 2 — Targeted (High signals)**:
```
Personal outreach:
  - Founder email (for high-value users)
  - Support check-in call/chat
  - Feature preview / early access offer

Product intervention:
  - Unlock premium feature for 7 days
  - Assign dedicated support contact
  - Cross-product bundle offer at deep discount
```

**Tier 3 — Emergency (Critical signals)**:
```
All-hands retention:
  - Immediate founder alert via sendFounderAlert()
  - Personal email from founder
  - Full account audit: what went wrong?
  - Custom retention package
  - If lost: exit survey + win-back campaign at 30/60/90 days
```

### 5.3 Cross-Product Retention Advantage

The key insight: **cross-product users are dramatically harder to churn**.

```
Churn Rates (projected):
  Single product, free tier:     12-15% monthly
  Single product, paid tier:     5-7% monthly
  Two products, paid:            2-4% monthly
  Three products, paid:          1-2% monthly
  Three products, bundle:        <1% monthly

Every cross-product adoption reduces churn by ~40-50%
```

**Why multi-product users don't churn**:
1. Higher sunk cost (time invested across products)
2. More integrated workflows (switching cost)
3. Social connections across products (forum + mobile)
4. Bestie relationship deepens with more touchpoints
5. Bundle pricing makes any single product feel cheap
6. Ecosystem achievements create status/identity

---

## 6. Revenue Optimization Across Products

### 6.1 Monetization Strategy

**Free to Paid Conversion Path**:
```
Free (any product)
  → Hit limit → see value of paid
    → Upgrade single product ($19.99-$200/mo)
      → Discover second product (free tier)
        → Hit limit on second product
          → Bundle offer (save 20-30%)
            → Full ecosystem customer ($250-400/mo)
```

**Average Revenue Per User (ARPU) Targets**:
| Segment | Current ARPU | 6-Month Target | 12-Month Target |
|---------|-------------|---------------|----------------|
| Free only | $0 | $0 | $0 |
| Single product paid | $45 | $55 | $65 |
| Two products paid | $75 | $95 | $120 |
| Three products paid | $120 | $160 | $200 |
| Bundle customer | $140 | $180 | $220 |

### 6.2 Upgrade Triggers

| Current State | Upgrade Target | Trigger |
|--------------|---------------|---------|
| Free on Product A | Paid on Product A | Tier limit hit + value demonstrated |
| Paid on Product A | Paid A + Free B | Cross-sell trigger fired |
| Paid A + Free B | Paid A + Paid B | Tier limit hit on Product B |
| Paid A + Paid B | Bundle A+B | Cost savings shown at next renewal |
| Bundle A+B | Bundle A+B+C | Cross-sell to Product C |
| Any paid | Higher tier | Usage growth + feature need |

### 6.3 Lifetime Value (LTV) Modeling

```typescript
function calculateLTV(user: User): number {
  const monthlyRevenue = calculateMonthlyRevenue(user);
  const churnRate = estimateChurnRate(user);
  const avgLifetimeMonths = 1 / churnRate;

  // Expansion revenue (predicted cross-product adoption)
  const expansionMultiplier = predictExpansionMultiplier(user);

  // LTV = Monthly Revenue × Average Lifetime × Expansion Multiplier
  return monthlyRevenue * avgLifetimeMonths * expansionMultiplier;
}

// Expected LTV by segment
const ltvBenchmarks = {
  singleProductFree: 15,        // Ad value + potential conversion
  singleProductPaid: 540,       // $45 × 12 months avg
  twoProductsPaid: 1800,        // $75 × 24 months avg
  threeProductsPaid: 4800,      // $120 × 40 months avg
  bundleCustomer: 6600,         // $140 × 47 months avg
};
```

---

## 7. Cross-Product Communication Strategy

### 7.1 Email Cadence

**Transactional** (immediate, per-product):
- Welcome email (product-specific + ecosystem introduction)
- Password reset
- Subscription confirmation/change
- API key generated (Tools)
- Security alerts

**Behavioral** (trigger-based, cross-product aware):
- Activation nudge (if not activated in 48 hours)
- Cross-sell recommendation (signal-based)
- Re-engagement (dormancy detected)
- Tier limit notification
- Achievement/badge earned

**Marketing** (scheduled, parent brand):
- Weekly digest (personalized across products used)
- Feature announcements (relevant products only)
- Monthly ecosystem newsletter (Concept E brand)
- Promotional campaigns (bundle offers, seasonal)

### 7.2 Communication Rules

1. **Maximum 3 emails per week** (across all types, all products)
2. **Never duplicate content** across product emails
3. **Respect preferences** — if unsubscribed from marketing on one product, respect across all
4. **Personalize by ecosystem state** — single vs multi-product user gets different messaging
5. **Time zone aware** — send during user's business hours
6. **A/B test everything** — subject lines, CTAs, send times

---

## 8. Lifecycle Analytics

### 8.1 Lifecycle Stage Tracking

```sql
-- Track which lifecycle stage each user is in per product
CREATE TABLE analytics.user_lifecycle_stages (
  user_id TEXT NOT NULL,
  product TEXT NOT NULL,
  current_stage TEXT NOT NULL,  -- awareness, acquired, activated, engaged, expanded, retained, advocate
  entered_stage_at TIMESTAMPTZ DEFAULT NOW(),
  previous_stage TEXT,
  days_in_previous_stage INTEGER,
  PRIMARY KEY (user_id, product)
);

-- Track stage transitions
CREATE TABLE analytics.lifecycle_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product TEXT NOT NULL,
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  trigger TEXT,                  -- What caused the transition
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.2 Lifecycle Funnel Metrics

```
CROSS-PRODUCT LIFECYCLE FUNNEL (Monthly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Aware (visited any product):        10,000  (100%)
Acquired (signed up):                2,500  (25%)
Activated (first value):             1,750  (70% of acquired)
Engaged (regular usage):               875  (50% of activated)
Expanded (2+ products):                220  (25% of engaged)
Retained 90d (still active):           176  (80% of expanded)
Advocates (active referrers):           44  (25% of retained)

Key Conversion Points to Improve:
  Aware → Acquired: 25% (target 30%)
  Engaged → Expanded: 25% (target 35%)
```

---

## 9. Implementation Priorities

### Phase 1: Single Product Lifecycle (Current)
- Stone AI lifecycle fully mapped and tracked
- Activation, engagement, retention flows operational
- Basic churn prevention

### Phase 2: Cross-Product Foundation (Best AI + Tools Launch)
- Shared lifecycle tracking across products
- Cross-sell trigger system live
- Unified email cadence
- Basic expansion incentives

### Phase 3: Lifecycle Intelligence (Month 3-6)
- Predictive churn modeling
- Automated expansion recommendations
- LTV-based resource allocation
- Lifecycle stage optimization

### Phase 4: Ecosystem Maturity (Month 6-12)
- Full ambassador program
- Predictive LTV scoring
- Dynamic pricing based on lifecycle stage
- Automated lifecycle optimization

---

*Seed created by Agent Stone (Head 1) + Cardinal (Head 2) — Three-Headed Monster Operations*
*In a multi-product ecosystem, the customer lifecycle isn't a funnel — it's a flywheel. Each product adoption accelerates the spin.*
