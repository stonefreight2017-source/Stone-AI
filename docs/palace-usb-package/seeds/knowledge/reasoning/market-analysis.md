# Market Analysis Framework

## Core Principle

Market analysis answers three questions: How big is the opportunity? Is it growing or shrinking? Can you capture a meaningful share? Everything else is noise. Focus on numbers and signals, not narratives.

## TAM/SAM/SOM for AI SaaS

### Template

```
TAM (Total Addressable Market):
  "If EVERYONE who could use this DID use this, how much revenue?"
  - Define the broadest possible market
  - Use top-down (industry reports) AND bottom-up (user count x price)
  - TAM is a ceiling, not a target

SAM (Serviceable Addressable Market):
  "Of the TAM, who can we actually REACH with our product and distribution?"
  - Geographic limitations?
  - Language limitations?
  - Platform limitations?
  - Distribution channel reach?

SOM (Serviceable Obtainable Market):
  "Of the SAM, what can we REALISTICALLY capture in 2-3 years?"
  - Based on competitive dynamics and our resources
  - If SOM < cost to capture it → bad business
  - This is the number that matters for planning
```

### Applied to Stone AI

```
TAM — Global AI SaaS Market:
  ~150M potential users (people who use AI tools regularly)
  Average revenue per user: ~$20/month
  TAM: ~$36B annually
  Source: Industry reports + ChatGPT's 100M+ users as reference point

SAM — English-speaking users wanting multi-agent AI with personality:
  ~10% of TAM interested in specialized/personalized AI
  ~15M potential users
  Average revenue: ~$40/month (our tiers skew higher than chatbot-only)
  SAM: ~$7.2B annually

SOM — Realistic capture in 2-3 years:
  ~0.01-0.1% of SAM (new entrant without massive funding)
  ~1,500 - 15,000 paying users
  Average revenue: ~$50/month
  SOM: $900K - $9M annually

IMPLICATION: Even the low end of SOM is viable if costs are controlled.
The question isn't market size (it's big enough). The question is
distribution: how do we reach those 1,500-15,000 users?
```

## Leading vs Lagging Indicators

### Lagging Indicators (What Already Happened)

```
Revenue — How much money came in
  Useful for: Reporting, valuation
  NOT useful for: Predicting next month (too late to change)

Churn Rate — Who left
  Useful for: Understanding problems
  NOT useful for: Preventing churn (they already left)

Market Share — Your slice of the pie
  Useful for: Competitive positioning
  NOT useful for: Strategy (changes too slowly)
```

### Leading Indicators (What's About to Happen)

```
Sign-up Rate — New users entering the funnel
  Predicts: Future revenue (2-4 weeks ahead)
  Watch for: Trend changes, not absolute numbers

Activation Rate — Users who complete onboarding and use core features
  Predicts: Conversion to paid (1-2 weeks ahead)
  Watch for: Drop below 30% = onboarding problem

Feature Usage — Which features are used and how often
  Predicts: Retention (1-3 months ahead)
  Watch for: Features used <1x/week by most users = low value

NPS / Satisfaction — User sentiment
  Predicts: Word-of-mouth growth or decline (1-6 months ahead)
  Watch for: Score below 30 = retention risk

Support Ticket Volume — Problems users report
  Predicts: Churn (2-4 weeks ahead)
  Watch for: Spike = something broke, trend up = product quality declining
```

### Leading Indicator Dashboard

```
WEEKLY CHECK:
  [] Sign-up rate: ___/week (trend: up/flat/down)
  [] Activation rate: ___% (target: >30%)
  [] Daily active users / Monthly active users: ___% (target: >20%)
  [] Support tickets: ___/week (trend: up/flat/down)

MONTHLY CHECK:
  [] Free → Paid conversion: ___% (target: >3%)
  [] Revenue per user: $___/month (trend: up/flat/down)
  [] NPS score: ___ (target: >30)
  [] Churn rate: ___% (target: <8% monthly)
```

## Signal vs Noise

### Signals (Act On These)

```
CONSISTENT TREND: Same direction for 4+ weeks
  - 4 weeks of declining signups = investigate
  - 4 weeks of increasing churn = urgent

CORRELATED INDICATORS: Multiple indicators pointing same direction
  - Signups down + NPS down + support up = real problem
  - One indicator moving alone = probably noise

STRUCTURAL CHANGE: External event that changes the market
  - Major competitor shuts down = opportunity
  - New regulation = threat or opportunity
  - Platform change (app store rules, API pricing) = adapt

USER BEHAVIOR CHANGE: How users interact with the product shifts
  - Feature X usage drops 50% = something changed
  - New use case emerges organically = potential feature opportunity
```

### Noise (Don't React to These)

```
SINGLE DATA POINT: One bad day/week in isolation
  - Revenue dips for one week = noise
  - Revenue dips for four weeks = signal

ANECDOTES WITHOUT DATA: "I heard from a user that..."
  - One user's opinion ≠ market signal
  - 50 users saying the same thing = signal

COMPETITOR ANNOUNCEMENTS: "Competitor X launched feature Y"
  - Announcement ≠ adoption. Wait to see if users actually use it.
  - React to market impact, not to press releases.

INDUSTRY HYPE: "AI market will be $X trillion by 20XX"
  - Analyst predictions are usually wrong on timing
  - Focus on YOUR metrics, not industry narratives
```

## Market Timing Assessment

```
TOO EARLY:
  - Only innovators/hobbyists are interested
  - Users need extensive education on WHY they'd want this
  - Infrastructure doesn't support the product yet
  - Sign: Lots of excitement, few paying customers

RIGHT TIME:
  - Early adopters are paying and recommending
  - Pragmatists are asking "how do I get this?"
  - Infrastructure is ready (AI APIs reliable, affordable, fast)
  - Sign: Organic demand without heavy marketing

TOO LATE:
  - Market is dominated by 2-3 players
  - Commoditization has driven margins to near zero
  - Users have high switching costs with existing providers
  - Sign: "The AI chatbot market" is a settled category

STONE AI TIMING ASSESSMENT:
  The multi-agent personalized AI market is in Early Adopter stage.
  General AI chatbots are Early Majority (ChatGPT, Claude.ai).
  Personalized AI companions are Early Adopter (Character.ai proved demand).
  Multi-agent SaaS with both utility AND personality = Innovator-to-Early Adopter.
  This is the RIGHT TIME to enter — demand exists but the market isn't settled.
```

## Revenue Model Validation

```
UNIT ECONOMICS CHECK:
  Customer Acquisition Cost (CAC): $___ per paying customer
  Average Revenue Per User (ARPU): $___/month
  Gross Margin: ___% (revenue minus direct costs like AI API calls)
  Lifetime Value (LTV): ARPU × average months subscribed × gross margin
  LTV:CAC ratio: ___ (target: >3:1)

  If LTV:CAC < 3:1 → either reduce CAC or increase ARPU/retention
  If LTV:CAC > 5:1 → you might be under-investing in growth

APPLIED TO STONE AI:
  ARPU: ~$50/month (weighted across tiers)
  Gross margin: ~70% (AI API costs are ~30% of revenue)
  Average lifespan: ~8 months (assumption for early SaaS)
  LTV: $50 × 8 × 0.70 = $280
  Target CAC: <$93 (LTV/3)

  This means: spend up to $93 to acquire a customer and still be healthy.
```

## Integration

- **Competitive Analysis** provides the competitive context for market analysis
- **Trend vs Noise** helps filter market signals
- **Second-Order Effects** predicts how market changes cascade
- **First Principles** challenges market assumptions
- **Theory of Constraints** identifies what's actually limiting market capture
