# Competitive Analysis Framework

## Core Principle

Competitive analysis is not about copying competitors. It's about understanding the landscape so you can find gaps, avoid traps, and build defensible advantages. The goal is POSITIONING, not imitation.

## The 5-Step Framework

### Step 1: Identify the Competitive Set

```
TEMPLATE:
  Direct competitors (same product, same market):
  - [Company]: [What they do] [Their positioning]

  Indirect competitors (different product, same need):
  - [Company]: [What they do] [How they solve the same user need]

  Potential competitors (could enter your market):
  - [Company]: [Why they might enter] [Their advantages if they do]

APPLIED TO AI SAAS:
  Direct: ChatGPT (OpenAI), Claude.ai (Anthropic), Gemini (Google),
          Perplexity, Character.ai, Poe
  Indirect: Notion AI, GitHub Copilot, Jasper, Copy.ai
            (specialized AI tools that solve overlapping needs)
  Potential: Apple (Siri evolution), Meta (open source models),
            Amazon (Alexa + Bedrock)
```

### Step 2: Map Positioning

```
TEMPLATE — For each competitor, map:
  Target user: [Who they're built for]
  Core value prop: [One sentence — why users choose them]
  Pricing strategy: [Free/freemium/paid, price points]
  Distribution: [How they acquire users]
  Moat: [What makes them hard to compete with]

POSITIONING MAP:
  Y-axis: Generalist ←→ Specialist
  X-axis: Consumer ←→ Enterprise

  Plot each competitor on this grid. Where are the clusters?
  Where are the gaps?
```

### Step 3: Find the Gaps

```
TEMPLATE:
  Unserved segments:
  - [User type] needs [capability] but no one offers it because [reason]

  Underserved segments:
  - [User type] uses [competitor] but is frustrated by [limitation]

  Overserved segments (avoid these):
  - [User type] has too many options and switching costs are high

APPLIED TO STONE AI:
  Gap hypothesis: Users who want MULTIPLE specialized AI agents
  (not just one chatbot) with personality and ongoing relationships
  (Bestie). Most competitors offer one-size-fits-all or purely
  functional tools. Stone AI is in the gap between "chat with AI"
  and "AI that knows you."
```

### Step 4: Assess Defensibility

```
TEMPLATE — For your product, score each moat type 1-5:

NETWORK EFFECTS: Does your product get better as more users join?
  1 = No network effects (each user is independent)
  5 = Strong network effects (users attract users)
  Stone AI: 2/5 (Forum creates some, but core product is individual)

SWITCHING COSTS: How hard is it for users to leave?
  1 = Zero cost (can switch in minutes)
  5 = Very high (years of data, deep integration)
  Stone AI: 3/5 (Bestie relationship, conversation history, customization
             creates emotional and data switching costs)

DATA ADVANTAGE: Do you get better with more data?
  1 = No data advantage
  5 = Massive data advantage (more data = much better product)
  Stone AI: 3/5 (User preferences, Bestie training, agent interaction
             patterns — but needs scale to matter)

BRAND: Is your brand a reason users choose you?
  1 = No brand recognition
  5 = Brand IS the product (users come for the brand)
  Stone AI: 1/5 (Early stage — brand is not yet a moat)

COST ADVANTAGE: Can you offer the same thing cheaper?
  1 = No cost advantage (same costs as competitors)
  5 = Massive cost advantage (10x cheaper)
  Stone AI: 2/5 (vLLM local inference is cheaper than cloud-only,
             but not dramatically so at scale)

OVERALL DEFENSIBILITY: Sum / 25 = percentage
  Stone AI: 11/25 = 44% — moderate defensibility
  Focus areas: Build switching costs (Bestie/data) and network effects (community)
```

### Step 5: Identify Constraints

```
TEMPLATE:
  What constraints do competitors face that you don't?
  - [Competitor] can't [do X] because [reason]
  - This creates an opportunity for us to [strategy]

  What constraints do you face that competitors don't?
  - We can't [do X] because [reason]
  - This means we must [strategy to work around it]

APPLIED:
  Competitor constraints:
  - OpenAI/Google can't offer niche personality features (they serve billions,
    must be generic) → Opportunity: Stone AI can be the "AI with personality" player
  - Character.ai can't do serious work tasks (they're positioned as entertainment)
    → Opportunity: Stone AI bridges entertainment AND productivity

  Our constraints:
  - We can't match compute resources of OpenAI/Google
    → Strategy: Use their models (Anthropic) for quality, local models
    (vLLM) for cost, differentiate on EXPERIENCE not raw capability
  - We can't match marketing budgets of funded competitors
    → Strategy: Community-driven growth, referrals, SEO for niche queries
```

## Competitive Intelligence Signals

Things to monitor regularly:

```
PRICING CHANGES:
  - Competitor raises prices → opportunity to capture price-sensitive users
  - Competitor drops prices → prepare for commoditization defense

FEATURE LAUNCHES:
  - Competitor launches what you have → your differentiation weakens
  - Competitor launches what you don't → assess if users actually want it

FUNDING/ACQUISITIONS:
  - Competitor raises money → they'll grow faster, prepare to differentiate
  - Competitor gets acquired → uncertainty, some users will look elsewhere

USER SENTIMENT:
  - Competitor reviews/complaints → find specific pain points to address
  - Competitor praise → understand what's working (don't copy blindly)

API/PLATFORM CHANGES:
  - AI provider changes pricing or terms → impacts YOUR costs too
  - Platform changes (Vercel, Cloudflare) → may create opportunities or threats
```

## Decision Rules

```
COMPETE when:
  - You can win on a specific dimension (not all dimensions)
  - The market is growing (not zero-sum)
  - Your advantage is sustainable

AVOID when:
  - Competitor has >10x resources AND is focused on your segment
  - The market is commoditizing and you don't have cost advantage
  - You'd have to abandon your differentiation to compete

DIFFERENTIATE when:
  - Competitors are clustered in one area of the positioning map
  - Users have unmet needs that competitors ignore
  - You can build something they CAN'T copy (due to their constraints)
```

## Integration

- **First Principles** to drill through competitor claims vs reality
- **Second-Order Effects** to predict consequences of competitive moves
- **Market Analysis** for the broader market context
- **Trend vs Noise** to separate real competitive threats from hype
- **Theory of Constraints** to identify what's actually limiting competitive position
