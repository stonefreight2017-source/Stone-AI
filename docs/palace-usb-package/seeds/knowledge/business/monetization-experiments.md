# Monetization Experiments — Stone AI Ecosystem

## Seed Classification
- **Domain**: Revenue Operations / Growth Strategy
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe API, Prisma 7.4
- **Applies To**: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Why Monetization Experiments Matter

### The Revenue Optimization Gap

Most SaaS founders set their pricing once and never touch it again. This leaves enormous revenue on the table. Research shows that SaaS companies that actively experiment with pricing grow 2-3x faster than those that don't. Monetization experiments — systematic tests of pricing, packaging, feature gating, trial structure, and upgrade flows — are the highest-leverage growth activity after achieving product-market fit.

Stone AI's current pricing structure (FREE/$0, STARTER/$19.99, PLUS/$49.99, SMART/$99.99, PRO/$200) was designed thoughtfully, but it's a hypothesis. Every element — the price points, the feature allocation, the tier names, the billing periods — should be tested and validated with real user behavior.

### Experiment Categories

| Category | What You're Testing | Expected Impact |
|----------|-------------------|----------------|
| Price point testing | Is $99.99 better than $89 or $109? | 5-30% revenue change |
| Feature gating | Which features drive upgrades? | 10-40% upgrade rate change |
| Freemium optimization | How many free agents maximize conversion? | 10-25% conversion change |
| Trial length testing | 7 days vs 14 days vs 30 days? | 5-20% conversion change |
| Packaging experiments | Different tier compositions | 10-30% ARPU change |
| Upgrade flow testing | UI/UX of the upgrade process | 5-15% upgrade rate change |

---

## 2. A/B Testing Pricing

### Why Price Testing Is Dangerous (and How to Do It Safely)

Price testing is uniquely risky because customers who see different prices for the same product feel cheated. Two rules:

1. **Never show different prices to existing customers**: Only test on new visitors who haven't seen your pricing before.
2. **Test value framing, not just the number**: Instead of showing $89 vs $99, test $99/month vs "$79/month billed annually" vs "$99/month (most popular)" vs "$99/month — save 12 hours/week."

### Price Sensitivity Testing Methods

**Method 1: Van Westendorp Price Sensitivity Meter**

Survey potential or free users with four questions:
1. At what price would this be so cheap you'd question the quality? (Too Cheap)
2. At what price would this be a great deal? (Cheap/Good Value)
3. At what price would this be getting expensive but still worth it? (Expensive but OK)
4. At what price would this be too expensive to consider? (Too Expensive)

Plot the results to find the optimal price range and the point of maximum revenue.

```
Price Sensitivity Analysis Results (example):
├── Too Cheap threshold: $29/month (below this, quality concerns)
├── Optimal Price Point: $79-$119/month (intersection of curves)
├── Point of Marginal Expensiveness: $149/month
└── Too Expensive threshold: $199/month

Current SMART price ($99.99): Within optimal range ✓
Potential upside: Test $109 or $119 for SMART tier
```

**Method 2: Conjoint Analysis**

Show users different feature/price combinations and ask them to choose:
- Package A: 20 agents, no Bestie, $49/mo
- Package B: 30 agents, Bestie basic, $79/mo
- Package C: 39 agents, Bestie full, $99/mo

Analyze which combinations users prefer to understand:
- What features drive willingness to pay
- What the optimal price-to-feature ratio is
- Where to set tier boundaries

**Method 3: Live A/B Test (Careful!)**

```typescript
// Price testing via edge middleware (new visitors only)
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only test on pricing page
  if (!request.nextUrl.pathname.startsWith('/pricing')) {
    return NextResponse.next();
  }

  // Only test new visitors (no existing cookie)
  if (request.cookies.get('price_test_variant')) {
    return NextResponse.next();
  }

  // Don't test logged-in users (they've seen original pricing)
  if (request.cookies.get('__clerk_db_jwt')) {
    return NextResponse.next();
  }

  // Assign variant
  const variant = Math.random() < 0.5 ? 'control' : 'test';

  const response = NextResponse.next();
  response.cookies.set('price_test_variant', variant, {
    maxAge: 60 * 60 * 24 * 90, // 90 days (sticky)
    httpOnly: true,
  });
  response.headers.set('x-price-variant', variant);

  return response;
}

// Pricing page component reads variant
function PricingPage() {
  const variant = cookies().get('price_test_variant')?.value || 'control';

  const pricing = variant === 'test'
    ? { smart: 109.99, smartAnnual: 89.99 } // Test higher price
    : { smart: 99.99, smartAnnual: 79.99 }; // Control (current)

  // Track which variant was shown
  trackEvent('pricing_page_view', { variant });

  return <PricingGrid pricing={pricing} />;
}
```

### Price Testing Metrics

| Metric | Control | Test | Winner |
|--------|---------|------|--------|
| Pricing page → Signup | X% | Y% | Higher rate |
| Signup → Paid (SMART specifically) | X% | Y% | Higher rate |
| Revenue per pricing page visitor | $X | $Y | Higher value |
| Average revenue per user (ARPU) | $X | $Y | Higher |
| 30-day retention (post-purchase) | X% | Y% | Must not decrease |

**Decision rule**: The test wins ONLY if revenue per visitor increases AND 30-day retention doesn't decrease. Higher price with lower conversion can still win if revenue per visitor is higher.

---

## 3. Feature Gating Experiments

### What Features Drive Upgrades?

Feature gating determines which features are available at each tier. The right gating creates a natural upgrade path: free users get enough value to love the product, but hit limits that make upgrading feel like a natural next step.

### Current Gating Strategy

```
FREE (4 agents): Basic writing, research, Q&A, analysis
STARTER (16 agents): + specialized agents, basic Bestie
PLUS (30 agents): + advanced agents, full Bestie, forum
SMART (39 agents): + premium agents, priority support
PRO (42 agents): + all agents, everything unlocked
```

### Feature Gating Experiments to Run

**Experiment 1: Agent Count per Tier**
- Hypothesis: Increasing FREE from 4 to 6 agents increases engagement without hurting conversion
- Test: 4 agents (control) vs. 6 agents (variant)
- Metrics: 7-day retention, free-to-paid conversion at 30 days, ARPU
- Risk: More free agents may reduce upgrade motivation

**Experiment 2: Which Agents Are Free?**
- Hypothesis: Making the most popular agent paid (instead of free) increases upgrade intent
- Test: Current free agents (control) vs. swapping most-used free agent with a less-used paid agent (variant)
- Metrics: Free agent engagement, upgrade rate, user satisfaction

**Experiment 3: Bestie as Upgrade Driver**
- Hypothesis: Giving free users a "taste" of Bestie (limited interactions) then gating it drives upgrades
- Test: No Bestie for free (control) vs. 5 Bestie interactions/day for free (variant)
- Metrics: Bestie engagement, free-to-paid conversion, plan tier selected at upgrade

**Experiment 4: Usage Limits vs. Feature Limits**
- Hypothesis: Limiting conversations per day (instead of agents) creates more upgrade urgency
- Test: Agent-gated (control) vs. 20 conversations/day limit across all agents (variant)
- Metrics: Daily active usage, upgrade rate, user satisfaction

### Feature Gating A/B Test Framework

```typescript
// Feature flag system for monetization experiments
interface FeatureGate {
  name: string;
  enabled: boolean;
  variants: {
    control: FeatureConfig;
    test: FeatureConfig;
  };
  allocation: number; // 0-1, percent in test group
  targetAudience: 'new_users' | 'free_users' | 'all';
}

const featureGates: FeatureGate[] = [
  {
    name: 'free_agent_count',
    enabled: true,
    variants: {
      control: { freeAgentCount: 4 },
      test: { freeAgentCount: 6 },
    },
    allocation: 0.5,
    targetAudience: 'new_users',
  },
  {
    name: 'bestie_free_taste',
    enabled: false, // Not yet running
    variants: {
      control: { bestieFree: false },
      test: { bestieFree: true, bestieFreeDailyLimit: 5 },
    },
    allocation: 0.5,
    targetAudience: 'free_users',
  },
];

// Get feature config for a user
function getFeatureConfig(userId: string, gateName: string): FeatureConfig {
  const gate = featureGates.find(g => g.name === gateName);
  if (!gate || !gate.enabled) return gate?.variants.control;

  // Deterministic assignment based on userId
  const hash = hashCode(userId + gateName);
  const bucket = (hash % 100) / 100;

  return bucket < gate.allocation
    ? gate.variants.test
    : gate.variants.control;
}
```

---

## 4. Freemium Optimization

### The Freemium Balancing Act

The FREE tier must:
- Provide enough value that users love the product (drives word-of-mouth)
- Create enough limitation that power users naturally want more (drives conversion)
- Not cannibalize paid tiers (free users shouldn't feel "this is enough forever")

### Freemium Metrics

| Metric | Healthy Range | Action if Outside |
|--------|-------------|-------------------|
| Free-to-paid conversion rate | 2-5% | Below 2%: free tier too generous. Above 5%: free tier too limited. |
| Time to first paid conversion | 7-30 days | Below 7: users feel forced. Above 30: not enough urgency. |
| Free user monthly active rate | 30-50% | Below 30%: free tier not engaging enough. |
| Free user NPS | 30+ | Below 30: free experience is frustrating. |
| Free user referral rate | 5-10% | Free users should refer even if they don't pay. |

### Freemium Experiments

**Experiment: Time-Limited Feature Access**
Give free users access to ALL agents for the first 7 days, then restrict to 4.
- Hypothesis: Users who experience the full product convert at higher rates
- Risk: Users may feel bait-and-switched

**Experiment: Value-Based Free Tier**
Instead of agent count, limit by output quality or depth.
- Free: All agents available, but responses are shorter/simpler
- Paid: Full-depth responses, advanced analysis, longer outputs
- Hypothesis: This is a more natural upgrade trigger than agent count

**Experiment: Social Free Tier**
Free users get +1 extra agent for every referral who signs up (up to 8 total).
- Hypothesis: Creates viral growth while maintaining paid tier value
- Incentive aligns: more referrals = more free agents = more engaged free users

---

## 5. Trial Length Testing

### Trial Structure Options

| Structure | Pros | Cons |
|-----------|------|------|
| No trial (free tier only) | Simple, no expectation of paid features | Harder to showcase paid value |
| 7-day trial | Urgency to evaluate quickly | May not be enough time for complex workflows |
| 14-day trial | Good balance of evaluation time and urgency | Industry standard, well-understood |
| 30-day trial | Full evaluation, low pressure | Low urgency, easy to forget |
| Reverse trial (paid first, then free) | Users experience best version first | Expectations set high, downgrade feels bad |

### Trial Experiment Design

```typescript
// Trial length A/B test
const trialExperiment = {
  name: 'trial_length_test',
  variants: {
    control: { trialDays: 14, plan: 'SMART' },
    short: { trialDays: 7, plan: 'SMART' },
    long: { trialDays: 30, plan: 'SMART' },
    reverse: { trialDays: 14, plan: 'PRO', revertsTo: 'FREE' },
  },
  metrics: [
    'trial_start_rate',      // % of signups who start trial
    'trial_activation_rate', // % who use product during trial
    'trial_to_paid_rate',    // % who convert to paid after trial
    'paid_plan_selected',    // Which plan they choose
    'day_30_retention',      // Retention after 30 days
    'ltv_90_day',           // Revenue over first 90 days
  ],
};
```

### Trial Communication Sequence

The communication during a trial directly impacts conversion:

```
Day 0: "Welcome to your [X]-day SMART trial!"
Day 1: "Here's what you can do that free users can't"
Day 3: "Have you tried [premium feature]?"
Day [X-3]: "Your trial ends in 3 days"
Day [X-1]: "Last day of your trial"
Day [X]: "Your trial ended. Here's what you'll miss"
Day [X+3]: "We saved your settings. Come back anytime"
Day [X+7]: "Special offer: X% off your first month"
```

---

## 6. Packaging Experiments

### Alternative Tier Structures

**Current Structure (Agent-based):**
FREE (4) → STARTER (16) → PLUS (30) → SMART (39) → PRO (42)

**Alternative A: Usage-Based**
FREE (50 msgs/day) → BASIC (200 msgs) → STANDARD (unlimited msgs, basic agents) → PREMIUM (unlimited, all agents) → PRO (unlimited, priority)

**Alternative B: Persona-Based**
FREE → WRITER ($29, writing agents focus) → RESEARCHER ($29, research agents) → DEVELOPER ($29, code agents) → ALL-ACCESS ($99, everything)

**Alternative C: Simplified**
FREE → PERSONAL ($29/mo, 20 agents) → PRO ($99/mo, all agents + priority)

### How to Test Packaging Without Breaking Everything

Don't change the actual pricing page. Instead:
1. **Survey test**: Show different packaging to a survey panel and measure preference
2. **Landing page test**: Create alternative landing pages with different packaging, run ads to each
3. **New user test**: Assign new users to different packaging experiences via feature flags
4. **Conjoint analysis**: Present combinations and measure willingness to pay

---

## 7. Upgrade Flow Optimization

### The Upgrade Moment

The moment a user decides to upgrade is the most fragile moment in the conversion funnel. Any friction, confusion, or second thought can kill it. The upgrade flow must be:

1. **Fast**: Click "Upgrade" → see confirmation in under 60 seconds
2. **Clear**: Exactly what they're getting, exactly what they're paying
3. **Smooth**: Pre-filled information, minimal form fields
4. **Reassuring**: "Cancel anytime," "30-day money-back guarantee"

### Upgrade Flow Experiments

**Experiment 1: Upgrade Button Copy**
- "Upgrade to SMART" vs. "Get 39 Agents" vs. "Unlock Full Power" vs. "$99.99/month — Start Now"
- Metric: Upgrade page → payment completion rate

**Experiment 2: Price Anchoring on Upgrade Page**
- Control: Show just the plan price
- Test: Show plan price + "per agent" breakdown ($2.56/agent/month for SMART)
- Hypothesis: Per-agent framing makes the price feel more reasonable

**Experiment 3: Social Proof on Upgrade Page**
- Control: No social proof
- Test A: "12,000+ users on this plan"
- Test B: "Rated 4.8/5 by SMART plan users"
- Test C: User testimonial from a SMART plan user
- Metric: Upgrade completion rate

**Experiment 4: Annual vs. Monthly Default**
- Control: Monthly is pre-selected, annual is an option
- Test: Annual is pre-selected (with savings highlighted), monthly is an option
- Hypothesis: Pre-selecting annual increases annual subscription rate
- Risk: Higher upfront cost may reduce overall conversion

**Experiment 5: Urgency on Upgrade Page**
- Control: No urgency
- Test A: "First month $9.99 — offer ends in 48 hours"
- Test B: "X users upgraded today"
- Test C: "You've used X% of your free limit"
- Metric: Upgrade rate and time from page view to upgrade

---

## 8. Experiment Management

### Experiment Prioritization (ICE Framework)

| Experiment | Impact (1-10) | Confidence (1-10) | Ease (1-10) | ICE Score | Priority |
|-----------|:---:|:---:|:---:|:---:|:---:|
| SMART price test ($99 vs $109) | 8 | 6 | 7 | 336 | 1 |
| Annual pre-selected | 7 | 7 | 9 | 441 | 2 |
| Upgrade button copy | 5 | 7 | 9 | 315 | 3 |
| Free agent count (4 vs 6) | 7 | 5 | 6 | 210 | 4 |
| Trial length (7 vs 14 vs 30) | 6 | 5 | 7 | 210 | 5 |
| Bestie free taste | 7 | 4 | 5 | 140 | 6 |
| Persona-based packaging | 8 | 3 | 3 | 72 | 7 |

### Experiment Log Template

```markdown
# Experiment: [Name]

## Hypothesis
[If we change X, then Y will improve because Z]

## Design
- **Type**: A/B test / Survey / Feature flag
- **Variants**: Control: [description]. Test: [description].
- **Traffic allocation**: [50/50, 80/20, etc.]
- **Target audience**: [New users, free users, all users]
- **Sample size required**: [Calculated]
- **Duration**: [Minimum X weeks]

## Metrics
- **Primary**: [The ONE metric that determines the winner]
- **Secondary**: [Supporting metrics]
- **Guardrail**: [Metrics that must NOT decrease]

## Results
- **Start date**: [Date]
- **End date**: [Date]
- **Sample size achieved**: [N per variant]
- **Primary metric**: Control X% vs Test Y% (p-value: Z)
- **Winner**: [Control / Test / Inconclusive]

## Decision
[Implement / Iterate / Abandon]

## Learnings
[What did we learn? How does this inform future experiments?]
```

### Monthly Monetization Review

```
# Monetization Review — [Month Year]

## Active Experiments
| Experiment | Status | Preliminary Result |
|-----------|--------|-------------------|
| [Name] | Running (week 2/4) | +X% (not yet significant) |
| [Name] | Complete | Winner: Test (+12% ARPU) |

## Implemented Wins
| Change | Impact | Revenue Effect |
|--------|--------|---------------|
| [Change] | +X% [metric] | +$X,XXX MRR |

## Key Learnings
1. [Learning from completed experiment]
2. [Learning from completed experiment]

## Next Month Experiments
1. [Experiment with ICE score and hypothesis]
2. [Experiment with ICE score and hypothesis]

## Revenue Health
- MRR: $XX,XXX
- ARPU: $XX.XX (↑$X.XX from experiments)
- Free-to-paid: X% (↑X% from experiments)
- Estimated annual revenue impact of experiments: $XX,XXX
```
