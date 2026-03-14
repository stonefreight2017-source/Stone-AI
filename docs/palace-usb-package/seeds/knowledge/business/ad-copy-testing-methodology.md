# Ad Copy Testing Methodology

## Seed Classification
- **Domain**: Copywriting / Paid Advertising
- **Relevance**: Stone AI paid acquisition, Google Ads, Meta Ads, performance marketing
- **Last Updated**: 2026-03-09

---

## Google Ads Copy

### Search Ad Structure

Google Search ads have specific character limits that constrain your copy:

| Element | Character Limit | Count |
|---|---|---|
| Headline | 30 characters each | Up to 15 headlines |
| Description | 90 characters each | Up to 4 descriptions |
| Display URL path | 15 characters each | 2 paths |
| Sitelink title | 25 characters | Up to 8 |
| Sitelink description | 35 characters each | 2 lines per sitelink |
| Callout | 25 characters | Up to 10 |

### Responsive Search Ads (RSAs)

Google's primary ad format. You provide multiple headlines and descriptions; Google tests combinations.

**Strategy**: Write headlines that work in ANY combination. Don't assume headline 1 and headline 2 will appear together.

**Headline categories to cover** (provide 2-3 of each):

1. **Benefit headlines**: "Save 15+ Hours Every Week" / "Cut Ops Costs by 60%"
2. **Feature headlines**: "44 Specialized AI Agents" / "Persistent Agent Memory"
3. **Brand headlines**: "Stone AI - AI Agent Platform" / "Try Stone AI Free"
4. **Social proof headlines**: "Trusted by 2,000+ Founders" / "4.9/5 User Rating"
5. **CTA headlines**: "Start Free Today" / "Get Your AI Team Now"
6. **Keyword headlines**: "{KeyWord: AI Agents}" / "{KeyWord: AI Platform}"

**Description writing rules**:
- Description 1: Primary value proposition + CTA
- Description 2: Secondary benefit + objection removal
- Description 3: Social proof + urgency or offer
- Description 4: Feature summary + CTA variant

### Stone AI Google Ads Examples

**Campaign: Brand Keywords**
```
Headlines:
H1: Stone AI - Your AI Workforce
H2: 44 Specialized AI Agents
H3: Start Free - No Credit Card
H4: Replace Your Tool Stack
H5: AI Agents That Remember You
H6: Trusted by 2,000+ Founders

Descriptions:
D1: 44 specialized AI agents that execute, remember, and collaborate. Start free today — no credit card required.
D2: Replace 10+ tools with one AI platform. Copywriting, data analysis, development, and more. Free plan available.

Display path: stone-ai.net/ai-agents
```

**Campaign: Competitor Keywords**
```
Headlines:
H1: Looking for a ChatGPT Alternative?
H2: Beyond Single-Agent AI Tools
H3: 44 Agents vs 1 Chatbot
H4: AI That Actually Remembers You
H5: Switch to Stone AI Free
H6: More Than Just a Chat Interface

Descriptions:
D1: Tired of re-explaining your business every chat? Stone AI agents remember everything and work together as a team.
D2: One chatbot can't do it all. 44 specialized agents covering every business function. Start free, upgrade when ready.

Display path: stone-ai.net/compare
```

**Campaign: Category Keywords (AI tools, AI agents, AI platform)**
```
Headlines:
H1: AI Agents for Business
H2: Build Faster With AI Agents
H3: Your AI Team, Ready Now
H4: 44 Agents, One Platform
H5: Free AI Agent Platform
H6: Enterprise AI Made Simple

Descriptions:
D1: Deploy 44 specialized AI agents across copywriting, data analysis, development, security, and strategy. Free to start.
D2: The AI platform founders trust to replace their tool stack. Persistent memory. Agent collaboration. Start in minutes.

Display path: stone-ai.net/platform
```

### Dynamic Keyword Insertion (DKI)

DKI automatically inserts the user's search term into your ad. Increases relevance and click-through rate.

**Syntax**: `{KeyWord:Default Text}`

**Rules**:
- Default text must make sense on its own (it shows when the keyword is too long)
- Don't use DKI in every headline — mix with static headlines
- Never use DKI in descriptions (looks unnatural in longer copy)
- Capitalize appropriately: `{KeyWord:}` = Title Case, `{keyword:}` = lowercase

**Example**:
```
Headline: Best {KeyWord:AI Agents} for Business
```
If someone searches "AI agents for startups" → "Best AI Agents For Startups"
If keyword is too long → "Best AI Agents for Business" (default)

### Ad Extensions Copy

Extensions increase ad real estate and CTR. Each needs careful copy:

**Sitelink Extensions**:
```
1. Title: "See All 44 Agents" / Desc: "Browse specialized agents for every business function"
2. Title: "Pricing Plans" / Desc: "Free plan available. Paid plans from $19.99/mo"
3. Title: "How It Works" / Desc: "Deploy your AI team in under 5 minutes"
4. Title: "Customer Stories" / Desc: "See how founders use Stone AI to ship faster"
```

**Callout Extensions**:
```
"Free Plan Available" | "No Credit Card Required" | "44 AI Agents" |
"Persistent Memory" | "Agent Collaboration" | "Cancel Anytime" |
"Setup in 2 Minutes" | "24/7 Availability"
```

**Structured Snippets**:
```
Header: Types
Values: Copywriting, Data Analysis, Development, Security, Strategy, DevOps
```

**Price Extensions**:
```
Free: $0/mo - 4 Agents
Starter: $19.99/mo - 16 Agents
Plus: $49.99/mo - 30 Agents
Smart: $99.99/mo - 39 Agents
Pro: $200/mo - 42 Agents
```

---

## Meta Ad Copy (Facebook + Instagram)

### Ad Format Specifications

| Element | Character Limit | Best Practice |
|---|---|---|
| Primary text | 125 chars visible (up to 1,000 total) | Front-load value in first 125 |
| Headline | 40 characters | 25-30 chars optimal |
| Description | 30 characters | Often hidden on mobile |
| CTA button | Preset options | "Sign Up" or "Learn More" |

### Meta Ad Copy Formulas

#### Formula 1: Problem → Solution → CTA
```
Primary: Tired of re-explaining your business to AI every single time?

Stone AI remembers everything. 44 specialized agents. One platform. Zero context loss.

Start free →
Headline: Your AI Team, Ready Now
CTA: Sign Up
```

#### Formula 2: Social Proof → Promise → CTA
```
Primary: 2,000+ founders switched from ChatGPT to Stone AI.

Why? Because one chatbot can't replace a team. But 44 specialized agents can.

Free plan. No credit card. Try it in 2 minutes.
Headline: Replace Your AI Tool Stack
CTA: Learn More
```

#### Formula 3: Specific Result → How → CTA
```
Primary: "I cut my operations time from 20 hours to 6 hours per week." — Sarah, SaaS founder

She replaced 5 tools with Stone AI's specialized agents. They remember her business, work together, and cost less than a single subscription.

Join 2,000+ founders building with AI teams.
Headline: Save 15+ Hours Every Week
CTA: Sign Up
```

#### Formula 4: List → Value Stack → CTA
```
Primary: What $19.99/month buys you at Stone AI:

✅ 16 specialized AI agents
✅ Persistent memory (never re-explain)
✅ Agent collaboration
✅ Copywriting, analytics, development, and more
✅ Cancel anytime

That's less than one hour of freelancer time.
Headline: 16 AI Agents for $19.99/mo
CTA: Sign Up
```

#### Formula 5: Contrarian → Evidence → CTA
```
Primary: You don't need more AI tools. You need fewer.

Most founders use 5-7 AI tools that don't talk to each other. Stone AI gives you 44 specialized agents on one platform. They share context, collaborate on tasks, and remember your preferences.

One tool to replace them all.
Headline: Fewer Tools, More Output
CTA: Learn More
```

### Meta Ad Creative Guidelines

**Image ads**:
- Clear, simple visuals — avoid stock photos
- Text overlay: < 20% of image area (Meta penalizes text-heavy images)
- Show the product in action when possible
- High contrast for mobile scrolling

**Video ads**:
- Hook in first 3 seconds (skip rates spike at 3s)
- Design for sound-off viewing (captions required)
- 15-30 seconds optimal for feed ads
- 6-15 seconds for Stories/Reels
- End with clear CTA

**Carousel ads**:
- Card 1: Hook/problem statement
- Cards 2-4: Feature/benefit cards
- Card 5: Social proof + CTA
- Each card should work standalone but build a narrative

---

## Headline and Description Testing

### The Testing Hierarchy

Test elements in this order (highest impact first):

1. **Headline/hook** — determines if they engage at all
2. **Primary value proposition** — determines if they care
3. **CTA** — determines if they act
4. **Social proof elements** — determines trust level
5. **Offer/pricing framing** — determines urgency
6. **Visual creative** — determines attention capture

### A/B Test Framework for Ad Copy

**Structure each test as a hypothesis**:
"Changing [element] from [A] to [B] will improve [metric] because [reason]."

**Example**:
"Changing the headline from 'AI Platform for Founders' to 'Replace Your Ops Team With AI' will improve CTR because it implies a specific transformation rather than a generic category."

### Testing Methodology

**Phase 1: Broad Testing** (Week 1-2)
- Create 3-5 fundamentally different ad concepts
- Different angles: Problem-focused, benefit-focused, social-proof-focused, curiosity-focused
- Budget: Split evenly
- Goal: Identify winning angle

**Phase 2: Refinement** (Week 3-4)
- Take winning angle from Phase 1
- Create 3-5 variations within that angle
- Test specific word choices, number specificity, emotional tone
- Goal: Optimize the winning angle

**Phase 3: Element Testing** (Ongoing)
- Test individual elements: CTA button text, headline variations, description length
- One variable at a time
- Goal: Incremental improvement

### Statistical Requirements for Ad Tests

| Metric | Minimum Sample | Minimum Duration | Confidence Level |
|---|---|---|---|
| CTR | 1,000 impressions per variant | 3 days | 95% |
| Conversion rate | 100 conversions per variant | 7 days | 95% |
| CPA | 50 conversions per variant | 7 days | 90% |
| ROAS | 100 conversions per variant | 14 days | 95% |

**Rules**:
- NEVER call a test before minimum sample is reached
- Account for day-of-week effects (run tests in full-week increments)
- Don't test during anomalous periods (holidays, PR events, outages)
- Document every test: hypothesis, variants, results, learnings

### Common Testing Mistakes

1. **Testing too many variables at once**: You can't attribute the winner to any specific change
2. **Ending tests too early**: Statistical flukes look like winners in small samples
3. **Not testing negative results**: A losing variant teaches you what DOESN'T work
4. **Testing trivial differences**: "Start Free" vs "Start for Free" won't move the needle
5. **Ignoring downstream metrics**: High CTR with low conversion = bad targeting or misleading copy
6. **Not segmenting results**: A winning ad for cold traffic might lose for retargeting

---

## Ad Copy by Funnel Stage

### Top of Funnel (Awareness)

**Audience**: People who don't know Stone AI exists. May not know they need AI agents.

**Copy approach**: Lead with the problem or transformation, not the product.

```
Primary: You're spending 20 hours a week on tasks AI should be handling.

Not general AI that gives generic answers — specialized AI agents that know your business, work together, and actually execute.

Imagine reclaiming those 20 hours. Every week.

Headline: What Would You Do With 20 Extra Hours?
CTA: Learn More
```

**Key principles**:
- Don't mention pricing
- Don't assume familiarity with AI agents
- Focus on the PROBLEM or the OUTCOME
- Use "Learn More" CTA (not "Sign Up" — too aggressive)

### Middle of Funnel (Consideration)

**Audience**: People who know they need an AI solution. Evaluating options.

**Copy approach**: Differentiation. Why Stone AI vs alternatives.

```
Primary: Why 2,000+ founders chose Stone AI over ChatGPT, Claude, and Copilot:

→ 44 specialized agents (not one generalist)
→ Persistent memory (no re-explaining)
→ Agent collaboration (they work together)
→ Free plan (try before you decide)

One platform instead of 5+ subscriptions.

Headline: The AI Platform Founders Prefer
CTA: Sign Up
```

**Key principles**:
- Name competitors (when allowed by platform policy)
- Specific differentiators
- Social proof with numbers
- "Sign Up" CTA is appropriate here

### Bottom of Funnel (Decision)

**Audience**: People who've visited Stone AI, maybe tried the free plan. Need a final push.

**Copy approach**: Urgency, offer, risk removal, social proof.

```
Primary: Your free plan gives you 4 agents.

Upgrade to Starter ($19.99/mo) and get 16 — including Data Analytics, Security, and Strategy agents.

That's 12 more specialists for less than your morning coffee habit.

No contract. Cancel anytime. Upgrade takes 30 seconds.

Headline: Unlock 16 AI Agents — $19.99/mo
CTA: Sign Up
```

**Key principles**:
- Specific pricing
- Specific value (what they GET)
- Risk removal (cancel anytime)
- Direct CTA

### Retargeting Copy

**For visitors who didn't sign up**:
```
Primary: Still thinking about it?

Stone AI is free to start. No credit card. No commitment. Just 4 specialized AI agents ready to work.

2 minutes to set up. Zero reasons to wait.

Headline: Start Free — No Strings
CTA: Sign Up
```

**For free users who didn't upgrade**:
```
Primary: You've seen what 4 agents can do.

Imagine 16. Or 30. Or 42.

Starter: $19.99/mo for 16 agents
Plus: $49.99/mo for 30 agents
Pro: $200/mo for 42 agents

Every agent remembers your business. They all work together.

Headline: Upgrade Your AI Team
CTA: Sign Up
```

---

## Ad Copy Quality Scoring

### The 5-Point Quality Check

Score each ad 1-5 on each dimension:

1. **Relevance** (1-5): Does the ad match the audience's intent and awareness level?
2. **Clarity** (1-5): Can a stranger understand the value in 3 seconds?
3. **Differentiation** (1-5): Does it stand out from competitor ads?
4. **Credibility** (1-5): Are claims specific and believable?
5. **Action-orientation** (1-5): Is the next step clear and compelling?

**Scoring**:
- 20-25: Ship it
- 15-19: Revise weak areas
- 10-14: Rewrite from scratch
- Under 10: Wrong angle entirely

### Ad Copy Review Checklist

- [ ] Headline conveys core value in < 30 characters
- [ ] Primary text hooks within first line (125 chars for Meta)
- [ ] One clear CTA (not competing actions)
- [ ] Specific claims (numbers, timeframes, outcomes)
- [ ] Social proof included where possible
- [ ] Objection addressed (price, risk, effort)
- [ ] Platform character limits respected
- [ ] No trademarked terms used improperly
- [ ] Landing page matches ad promise (message match)
- [ ] Mobile-optimized (short paragraphs, clear formatting)

---

## Competitor Ad Analysis

### How to Analyze Competitor Ads

**Tools**:
- Meta Ad Library (ads.facebook.com/ads/library) — see ALL active Meta ads for any page
- Google Ads Transparency Center — see search ads by advertiser
- SpyFu / SEMrush — competitor keyword and ad copy data

**What to analyze**:
1. **Headline patterns**: What angles are competitors using? Problem, benefit, brand?
2. **Value propositions**: What features/benefits do they lead with?
3. **Social proof**: How do they build credibility?
4. **CTAs**: What actions do they push?
5. **Offers**: Free trial, discount, money-back guarantee?
6. **Creative style**: Photos, illustrations, screenshots, video?
7. **Landing pages**: Where do ads lead? What's the message match?

### Competitive Positioning in Ad Copy

**If competitor leads with price**: You lead with value/quality
**If competitor leads with features**: You lead with outcomes
**If competitor leads with social proof**: You lead with specificity
**If competitor leads with ease of use**: You lead with power/capability

**Rule**: Never play their game. Find the angle they're NOT covering and own it.

---

## Budget Allocation for Ad Copy Testing

### Testing Budget Framework

**Monthly ad budget breakdown**:
- 70% on proven winners (scale what works)
- 20% on tests (new copy, new angles, new formats)
- 10% on moonshots (radically different approaches)

### Cost Per Test Calculation

Minimum spend per ad variant to reach statistical significance:
```
Cost per test = (Required conversions × CPA) × 2 variants

Example:
- Required: 50 conversions per variant
- CPA: $5
- 2 variants
- Minimum spend: 50 × $5 × 2 = $500 per test
```

### Test Velocity

**Target**: 2-4 copy tests per month per platform

**Week 1**: Launch test
**Week 2**: Gather data
**Week 3**: Analyze + implement winner + prep next test
**Week 4**: Launch next test

**Documentation**: Every test goes into a testing log:
```
Test ID: GA-2026-015
Platform: Google Ads
Campaign: Category Keywords
Hypothesis: Leading with "Replace Your Tool Stack" will outperform "AI Platform for Business"
Variant A: [original copy]
Variant B: [test copy]
Duration: 14 days
Sample: 2,400 impressions per variant
Result: Variant B +23% CTR, +12% conversion rate
Winner: B
Action: Implement B as new control, test next angle
```

---

*This seed is part of the Stone AI Palace USB Package — Copywriting domain.*
