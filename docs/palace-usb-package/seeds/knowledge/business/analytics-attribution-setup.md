# Analytics & Attribution Setup — Stone AI Ecosystem

## Executive Overview

Analytics and attribution are the nervous system of your growth engine. Without accurate measurement, every marketing dollar is a guess, every optimization is an opinion, and every strategy is faith-based. This seed covers the complete analytics infrastructure for the Three-Headed Monster ecosystem: Google Analytics 4 setup, conversion tracking across the funnel, UTM strategy for campaign attribution, multi-touch attribution modeling, lifetime value calculations, and dashboard templates that turn raw data into decisions.

The goal is simple: know exactly where every user comes from, what they do, how much they're worth, and which marketing activities create the most value. When you have this, you can kill underperforming channels, double down on winners, and predict revenue with confidence.

---

## Google Analytics 4 (GA4) Setup

### GA4 Property Architecture

```
GA4 Account: Stone AI Ecosystem
├── Property: Stone AI (stone-ai.net)
│   ├── Data Stream: Web (stone-ai.net)
│   └── Data Stream: Mobile (if Best AI Mobile uses Firebase)
├── Property: Stone AI Tools (tools.stone-ai.net)
│   └── Data Stream: Web
└── Property: Best AI Mobile
    └── Data Stream: iOS + Android (via Firebase)
```

**Why separate properties?** Each product has different user journeys, conversion events, and KPIs. Mixing them in one property creates noisy data. Cross-property analysis is handled through BigQuery exports or Looker Studio with blended data sources.

### GA4 Event Configuration

GA4 is event-based (not session-based like Universal Analytics). Every meaningful user action is an event.

**Stone AI Custom Events:**

```javascript
// Core conversion events
gtag('event', 'sign_up', {
  method: 'google' | 'email' | 'github',
  plan: 'FREE',
  referral_code: referralCode || null,
});

gtag('event', 'upgrade', {
  from_plan: 'FREE',
  to_plan: 'STARTER',
  billing_period: 'monthly' | 'annual',
  promo_code: promoCode || null,
  value: 19.99,
  currency: 'USD',
});

gtag('event', 'first_agent_interaction', {
  agent_id: agentId,
  agent_name: agentName,
  time_from_signup_seconds: timeDelta,
});

gtag('event', 'bestie_setup_complete', {
  communication_style: style,
  language: language,
  time_from_signup_seconds: timeDelta,
});

gtag('event', 'onboarding_complete', {
  steps_completed: stepsCompleted,
  time_from_signup_seconds: timeDelta,
});

// Engagement events
gtag('event', 'agent_conversation', {
  agent_id: agentId,
  agent_name: agentName,
  message_count: messageCount,
  session_duration_seconds: duration,
});

gtag('event', 'forum_post', {
  category: category,
  is_first_post: isFirstPost,
});

gtag('event', 'referral_sent', {
  method: 'link' | 'code' | 'email' | 'social',
});

gtag('event', 'referral_converted', {
  referred_plan: plan,
  value: referralValue,
});

// Revenue events
gtag('event', 'purchase', {
  transaction_id: stripeInvoiceId,
  value: amount,
  currency: 'USD',
  items: [{
    item_id: planId,
    item_name: planName,
    price: planPrice,
    quantity: 1,
  }],
});

gtag('event', 'churn', {
  from_plan: previousPlan,
  reason: cancelReason || 'unknown',
  tenure_days: tenureDays,
  ltv: lifetimeValue,
});
```

### GA4 Conversion Configuration

Mark these events as conversions in GA4:
1. `sign_up` — New account creation
2. `upgrade` — Plan upgrade (FREE → paid, or tier upgrade)
3. `purchase` — Successful payment (Stripe webhook confirmed)
4. `first_agent_interaction` — Activation metric
5. `onboarding_complete` — Activation metric
6. `referral_converted` — Referral attribution

### GA4 Audiences

Create custom audiences for segmentation and remarketing:

| Audience | Definition | Use Case |
|----------|-----------|----------|
| Free Users | plan = FREE, signed up > 3 days ago | Upgrade campaigns |
| Power Free Users | plan = FREE, conversations > 20 | High-intent upgrade targets |
| New Signups (7 days) | signed up within 7 days | Onboarding optimization |
| Churned Users | had paid plan, now FREE or deleted | Win-back campaigns |
| High-Value Users | plan = SMART or PRO | Referral program targeting |
| At-Risk Users | paid plan, no login in 14+ days | Churn prevention |
| Referral Champions | referrals_sent >= 3 | Ambassador recruitment |
| Developer Users | visited tools.stone-ai.net + API key created | Tools cross-sell |

---

## Conversion Tracking Architecture

### Full-Funnel Tracking

```
AWARENESS          ACQUISITION         ACTIVATION          REVENUE           RETENTION
─────────────────────────────────────────────────────────────────────────────────────
Page views    →    Sign ups       →    First interaction → First payment  →  Monthly active
Unique visitors    Account created     Onboarding done     Upgrade          Renewal
Session duration   Email verified      Bestie setup        Payment success  Feature adoption
Bounce rate        OAuth connected     3+ conversations    Plan selection   Referral sent
Traffic source     Referral attributed                     Promo applied
```

### Server-Side Tracking

Client-side analytics (GA4 via gtag) misses 15-30% of events due to ad blockers, browser privacy features, and JavaScript errors. For revenue-critical events, implement server-side tracking:

```typescript
// Server-side event tracking (Next.js API route or middleware)
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Send server-side events via GA4 Measurement Protocol
async function trackServerEvent(event: {
  clientId: string;
  eventName: string;
  params: Record<string, string | number>;
}) {
  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${GA4_SECRET}`,
    {
      method: 'POST',
      body: JSON.stringify({
        client_id: event.clientId,
        events: [{
          name: event.eventName,
          params: event.params,
        }],
      }),
    }
  );
}

// Example: Track upgrade server-side (from Stripe webhook)
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  await trackServerEvent({
    clientId: user.analyticsClientId, // stored during signup
    eventName: 'upgrade',
    params: {
      plan: subscription.items.data[0].price.lookup_key,
      value: subscription.items.data[0].price.unit_amount / 100,
      currency: 'usd',
      billing_period: subscription.items.data[0].price.recurring.interval,
    },
  });
}
```

### Cross-Domain Tracking

Stone AI uses multiple domains/subdomains:
- `stone-ai.net` (main app)
- `tools.stone-ai.net` (developer platform)
- Clerk auth (may use different domain)
- Stripe checkout (external domain)

Configure GA4 cross-domain tracking to maintain user identity across domains:

```javascript
// GA4 configuration with cross-domain
gtag('config', 'G-XXXXXXXXXX', {
  linker: {
    domains: ['stone-ai.net', 'tools.stone-ai.net'],
    accept_incoming: true,
  },
});
```

For Stripe checkout, pass the GA4 client_id as a URL parameter or use Stripe's metadata field to reconnect the session after payment.

---

## UTM Strategy

### UTM Parameter Standards

UTM parameters are the foundation of campaign attribution. Every external link pointing to Stone AI must have UTMs.

**UTM Taxonomy:**

| Parameter | Purpose | Format | Examples |
|-----------|---------|--------|----------|
| `utm_source` | Where traffic comes from | lowercase, no spaces | `google`, `twitter`, `newsletter`, `youtube`, `reddit` |
| `utm_medium` | Marketing medium | lowercase, standardized | `cpc`, `organic`, `social`, `email`, `referral`, `affiliate` |
| `utm_campaign` | Campaign name | lowercase, dashes | `spring-promo-2026`, `product-launch`, `smart-tier-push` |
| `utm_content` | Ad/content variant | lowercase, dashes | `headline-a`, `blue-cta`, `video-ad-1` |
| `utm_term` | Paid keyword (PPC only) | lowercase | `ai-agents`, `chatgpt-alternative` |

### UTM Naming Convention

**Strict rules (enforced across all teams):**
1. Always lowercase (no `Twitter`, always `twitter`)
2. Use hyphens, not underscores or spaces (`spring-promo`, not `spring_promo`)
3. No special characters except hyphens
4. Source names are platform names (not URLs)
5. Medium names use industry standards (Google's channel definitions)

**Medium Standardization:**

| Medium Value | When to Use |
|-------------|------------|
| `cpc` | Paid search (Google Ads, Bing Ads) |
| `display` | Display/banner ads |
| `social` | Organic social media posts |
| `paid-social` | Paid social media ads |
| `email` | Email campaigns and newsletters |
| `referral` | Partner/affiliate links |
| `organic` | Organic search (auto-tagged, don't manually set) |
| `direct` | Direct traffic (auto-tagged) |
| `video` | YouTube/video platform ads |
| `affiliate` | Affiliate program links |
| `community` | Forum, Discord, Slack community links |

### UTM Link Examples

```
# Google Search Ad for "AI agents" keyword
https://stone-ai.net/?utm_source=google&utm_medium=cpc&utm_campaign=ai-agents-search&utm_term=ai-agents&utm_content=headline-specialist

# Twitter organic post about new feature
https://stone-ai.net/blog/new-feature?utm_source=twitter&utm_medium=social&utm_campaign=feature-launch-march-2026

# Email newsletter CTA
https://stone-ai.net/pricing?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-digest-w10-2026&utm_content=pricing-cta

# YouTube video description link
https://stone-ai.net/?utm_source=youtube&utm_medium=video&utm_campaign=agent-tutorial-series&utm_content=episode-3

# Reddit post
https://stone-ai.net/?utm_source=reddit&utm_medium=community&utm_campaign=r-artificial-launch-post

# Affiliate link
https://stone-ai.net/?utm_source=techblogger-name&utm_medium=affiliate&utm_campaign=affiliate-q1-2026
```

### UTM Link Builder

Create a spreadsheet or internal tool for generating UTM links:

```
INPUT:
  Base URL: https://stone-ai.net/pricing
  Source: newsletter
  Medium: email
  Campaign: smart-tier-push-march
  Content: top-banner-cta

OUTPUT:
  https://stone-ai.net/pricing?utm_source=newsletter&utm_medium=email&utm_campaign=smart-tier-push-march&utm_content=top-banner-cta

  Short link: stoneai.link/sm3 (for social media)
```

---

## Multi-Touch Attribution

### Why Multi-Touch Matters

Most users don't convert on their first visit. A typical Stone AI conversion path might be:

```
Day 1: Sees Twitter post about Stone AI → visits site → leaves
Day 3: Searches "AI agents" on Google → clicks organic result → reads blog post → leaves
Day 5: Receives retargeting ad → clicks → visits pricing page → leaves
Day 7: Gets email from newsletter signup → clicks → signs up for FREE
Day 14: Gets onboarding email → uses agents → upgrades to STARTER
```

**Which channel gets credit?** The answer depends on your attribution model.

### Attribution Models

**1. Last-Touch Attribution (Default in most tools)**
The last interaction before conversion gets 100% credit.
- Pro: Simple, easy to implement
- Con: Ignores all discovery and nurturing channels
- When to use: Quick-and-dirty analysis, when you need a simple answer

**2. First-Touch Attribution**
The first interaction gets 100% credit.
- Pro: Values discovery channels (content marketing, social, PR)
- Con: Ignores the conversion trigger
- When to use: Evaluating top-of-funnel marketing effectiveness

**3. Linear Attribution**
Every touchpoint gets equal credit.
- Pro: Acknowledges all channels in the journey
- Con: Doesn't differentiate between high-impact and low-impact touches
- When to use: When you want a balanced view across all channels

**4. Time-Decay Attribution**
Touchpoints closer to conversion get more credit.
- Pro: Values the conversion trigger while acknowledging earlier touches
- Con: Undervalues brand-building activities
- When to use: For optimizing conversion-focused channels

**5. Position-Based Attribution (Recommended for Stone AI)**
40% credit to first touch, 40% to last touch, 20% distributed among middle touches.
- Pro: Values both discovery and conversion triggers, acknowledges nurturing
- Con: Arbitrary weighting
- When to use: Default model for balanced marketing optimization

### Implementing Multi-Touch Attribution

```typescript
// Simplified multi-touch attribution tracking
interface TouchPoint {
  timestamp: Date;
  source: string;
  medium: string;
  campaign: string;
  page: string;
}

interface UserJourney {
  userId: string;
  touchPoints: TouchPoint[];
  conversionEvent: string | null;
  conversionValue: number;
}

// Store touchpoints in cookie/localStorage + server-side on signup
function recordTouchPoint(user: UserJourney, tp: TouchPoint) {
  user.touchPoints.push(tp);
}

// Position-based attribution calculation
function attributeRevenue(journey: UserJourney): Map<string, number> {
  const credits = new Map<string, number>();
  const { touchPoints, conversionValue } = journey;

  if (touchPoints.length === 0) return credits;
  if (touchPoints.length === 1) {
    credits.set(touchPointKey(touchPoints[0]), conversionValue);
    return credits;
  }

  // 40% first touch
  const firstKey = touchPointKey(touchPoints[0]);
  credits.set(firstKey, (credits.get(firstKey) || 0) + conversionValue * 0.4);

  // 40% last touch
  const lastKey = touchPointKey(touchPoints[touchPoints.length - 1]);
  credits.set(lastKey, (credits.get(lastKey) || 0) + conversionValue * 0.4);

  // 20% distributed among middle touches
  if (touchPoints.length > 2) {
    const middleCredit = (conversionValue * 0.2) / (touchPoints.length - 2);
    for (let i = 1; i < touchPoints.length - 1; i++) {
      const key = touchPointKey(touchPoints[i]);
      credits.set(key, (credits.get(key) || 0) + middleCredit);
    }
  }

  return credits;
}

function touchPointKey(tp: TouchPoint): string {
  return `${tp.source}/${tp.medium}/${tp.campaign}`;
}
```

---

## Lifetime Value (LTV) Calculations

### Why LTV Is the Most Important Metric

LTV tells you the total revenue a customer generates over their relationship with your product. It determines:
- How much you can spend to acquire a customer (CAC < LTV)
- Which customer segments are most valuable
- Whether your pricing strategy is working
- The long-term health of the business

### LTV Calculation Methods

**Method 1: Simple LTV (for early-stage)**
```
LTV = ARPU × Average Customer Lifetime (months)

Example:
  ARPU (Average Revenue Per User) = $65/month (weighted across tiers)
  Average lifetime = 8 months
  LTV = $65 × 8 = $520
```

**Method 2: Cohort-Based LTV (more accurate)**
Track revenue from each signup cohort over time:

```
Month   Cohort Jan    Cohort Feb    Cohort Mar
  1     $5,000        $6,200        $7,100
  2     $4,500        $5,800
  3     $4,200
  4     $3,900
  ...

LTV = Sum of all monthly revenue from cohort / Number of users in cohort
```

**Method 3: Predictive LTV (most sophisticated)**
```
LTV = (ARPU × Gross Margin) / Monthly Churn Rate

Example:
  ARPU = $65
  Gross Margin = 85%
  Monthly Churn Rate = 5%
  LTV = ($65 × 0.85) / 0.05 = $1,105
```

### LTV by Plan Tier

| Plan | Monthly Price | Est. Avg Lifetime | Est. LTV | LTV:CAC Target |
|------|-------------|-------------------|----------|----------------|
| FREE | $0 | N/A | $0 (conversion potential) | N/A |
| STARTER | $19.99 | 6 months | $120 | 3:1 |
| PLUS | $49.99 | 8 months | $400 | 3:1 |
| SMART (monthly) | $99.99 | 10 months | $1,000 | 4:1 |
| SMART (annual) | $84.99 | 14 months | $1,120 | 4:1 |
| PRO | $200 | 12 months | $2,400 | 5:1 |

### LTV:CAC Ratio

The LTV:CAC ratio is the single most important SaaS unit economic metric:
- **LTV:CAC < 1:1**: Losing money on every customer (unsustainable)
- **LTV:CAC = 1:1 to 2:1**: Breaking even or marginal (need to improve retention or reduce CAC)
- **LTV:CAC = 3:1**: Healthy SaaS business (industry benchmark)
- **LTV:CAC > 5:1**: Excellent (potentially under-investing in growth)

---

## Dashboard Templates

### Executive Dashboard

```
┌──────────────────────────────────────────────────────────┐
│  STONE AI — EXECUTIVE DASHBOARD — [Month Year]            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  MRR: $XX,XXX  (↑X% vs last month)                      │
│  ARR: $XXX,XXX (projected)                               │
│  Total Users: X,XXX | Paid Users: XXX                    │
│  Free-to-Paid Rate: X% | Churn Rate: X%                 │
│                                                           │
│  ┌─────────────────────────────────────────────┐         │
│  │ MRR Trend (12 months)                        │         │
│  │ ████████████████████████████████████████      │         │
│  └─────────────────────────────────────────────┘         │
│                                                           │
│  Revenue by Plan:                                         │
│  STARTER: $X,XXX (XX%)  PLUS: $X,XXX (XX%)              │
│  SMART: $X,XXX (XX%)    PRO: $X,XXX (XX%)               │
│                                                           │
│  Top Acquisition Channels (by revenue attributed):       │
│  1. Organic Search: $X,XXX (XX%)                         │
│  2. Referrals: $X,XXX (XX%)                              │
│  3. Paid Social: $X,XXX (XX%)                            │
│  4. Email: $X,XXX (XX%)                                  │
│  5. Direct: $X,XXX (XX%)                                 │
│                                                           │
│  LTV: $XXX | CAC: $XX | LTV:CAC: X.X:1                  │
│  Payback Period: X months                                 │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Marketing Performance Dashboard

```
┌──────────────────────────────────────────────────────────┐
│  MARKETING PERFORMANCE — [Month Year]                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Traffic: XX,XXX sessions (↑X%)                          │
│  Signups: X,XXX (↑X%) | Conv Rate: X.X%                 │
│  Upgrades: XXX (↑X%)                                     │
│                                                           │
│  Channel Performance:                                     │
│  ┌──────────┬──────────┬────────┬──────┬───────┐        │
│  │ Channel  │ Sessions │Signups │ CAC  │ ROAS  │        │
│  ├──────────┼──────────┼────────┼──────┼───────┤        │
│  │ Organic  │ X,XXX    │ XXX    │ $0   │ ∞     │        │
│  │ Paid     │ X,XXX    │ XXX    │ $XX  │ X.Xx  │        │
│  │ Social   │ X,XXX    │ XXX    │ $X   │ X.Xx  │        │
│  │ Email    │ X,XXX    │ XXX    │ $X   │ X.Xx  │        │
│  │ Referral │ X,XXX    │ XXX    │ $XX  │ X.Xx  │        │
│  └──────────┴──────────┴────────┴──────┴───────┘        │
│                                                           │
│  Content Performance (Top 5):                             │
│  1. [Blog Title] — X,XXX views, XX signups               │
│  2. [Blog Title] — X,XXX views, XX signups               │
│                                                           │
│  Campaign Performance:                                    │
│  ┌────────────────────┬────────┬────────┬───────┐       │
│  │ Campaign           │ Spend  │Revenue │ ROAS  │       │
│  ├────────────────────┼────────┼────────┼───────┤       │
│  │ [Campaign 1]       │ $XXX   │ $X,XXX │ X.Xx  │       │
│  │ [Campaign 2]       │ $XXX   │ $XXX   │ X.Xx  │       │
│  └────────────────────┴────────┴────────┴───────┘       │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Product Analytics Dashboard

```
┌──────────────────────────────────────────────────────────┐
│  PRODUCT ANALYTICS — [Month Year]                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  DAU: X,XXX | WAU: X,XXX | MAU: XX,XXX                  │
│  DAU/MAU Ratio: XX% (stickiness)                         │
│                                                           │
│  Activation Funnel:                                       │
│  Signup ──→ Onboarding ──→ First Agent ──→ Day 7 Active  │
│  100%       72%             58%             34%           │
│                                                           │
│  Agent Usage (Top 10):                                    │
│  1. Agent #X [Name]: XX,XXX conversations                │
│  2. Agent #X [Name]: XX,XXX conversations                │
│  ...                                                      │
│                                                           │
│  Bestie Engagement:                                       │
│  Setup rate: XX% | Daily interactions: X.X per user      │
│  Style distribution: Style A XX%, Style B XX%            │
│                                                           │
│  Feature Adoption:                                        │
│  Forum: XX% of users | Referrals: XX% | Backdrops: XX%  │
│                                                           │
│  Retention Curve (by cohort):                            │
│  Week 1: XX% | Week 4: XX% | Week 12: XX% | Week 24: XX%│
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)
```
□ GA4 properties created for all three products
□ Custom events defined and implemented (client-side)
□ Conversion events marked in GA4
□ UTM naming convention documented and shared
□ UTM link builder created (spreadsheet or tool)
□ Basic conversion funnel configured in GA4
```

### Phase 2: Enhancement (Week 3-4)
```
□ Server-side tracking for revenue events
□ Cross-domain tracking configured
□ Custom audiences created in GA4
□ LTV calculation implemented (simple method)
□ First dashboard built (executive or marketing)
□ Attribution model selected and documented
```

### Phase 3: Optimization (Month 2-3)
```
□ Multi-touch attribution tracking implemented
□ Cohort-based LTV analysis running
□ All dashboards built and automated
□ Monthly reporting cadence established
□ A/B test analytics integrated
□ Anomaly alerts configured (traffic drops, conversion drops)
```

### Phase 4: Advanced (Month 4+)
```
□ Predictive LTV model built
□ BigQuery export for advanced analysis
□ Custom attribution model tuned to data
□ Real-time dashboard for critical metrics
□ Cross-product analytics (Stone AI + Tools + Mobile)
□ Machine learning for churn prediction
```
