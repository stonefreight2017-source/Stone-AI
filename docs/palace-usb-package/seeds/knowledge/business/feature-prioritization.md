# Feature Prioritization — Complete Knowledge Seed

## Purpose
This document contains every major framework for deciding what to build, when to build it, and how to evaluate the decision. Applied to Stone AI's feature set, agent roster, and growth stage.

---

## 1. RICE Scoring

### The Framework
RICE = Reach × Impact × Confidence / Effort

Each feature is scored on four dimensions:
- **Reach**: How many users will this affect in a given time period? (number of users per quarter)
- **Impact**: How much will this move the needle for each affected user? (scored 0.25, 0.5, 1, 2, 3)
- **Confidence**: How confident are you in your estimates? (percentage: 50%, 80%, 100%)
- **Effort**: How many person-months will this take? (person-months)

```
RICE Score = (Reach × Impact × Confidence) / Effort
```

Higher score = higher priority.

### Impact Scale
- 3 = Massive impact (life-changing for users, major revenue driver)
- 2 = High impact (significant improvement to user experience or revenue)
- 1 = Medium impact (noticeable improvement)
- 0.5 = Low impact (minor improvement)
- 0.25 = Minimal impact (nice to have)

### Stone AI RICE Examples

**Example 1: Improved Onboarding Flow**
- Reach: 1,000 new users per quarter.
- Impact: 2 (high — directly affects activation and conversion).
- Confidence: 80% (we know onboarding matters, exact improvement uncertain).
- Effort: 1 person-month.
- RICE = (1,000 × 2 × 0.8) / 1 = 1,600. **High priority.**

**Example 2: Add 5 New Agents to PLUS Tier**
- Reach: 200 PLUS users per quarter.
- Impact: 1 (medium — more agents, but existing ones cover most needs).
- Confidence: 60% (uncertain if these specific agents drive retention).
- Effort: 2 person-months (system prompts, testing, integration).
- RICE = (200 × 1 × 0.6) / 2 = 60. **Lower priority.**

**Example 3: Dunning System for Payment Failures**
- Reach: 50 users per quarter (estimated failed payments).
- Impact: 3 (massive — saves users who didn't intend to churn).
- Confidence: 90% (dunning systems have proven ROI).
- Effort: 0.5 person-months.
- RICE = (50 × 3 × 0.9) / 0.5 = 270. **Medium-high priority.** (Low reach but high impact and low effort.)

**Example 4: Dark Mode**
- Reach: 800 users per quarter (common request).
- Impact: 0.5 (low — nice to have, doesn't change core experience).
- Confidence: 90% (straightforward to build and evaluate).
- Effort: 0.5 person-months.
- RICE = (800 × 0.5 × 0.9) / 0.5 = 720. **Medium priority.** (High reach but low impact.)

### RICE Strengths and Weaknesses
**Strengths**: Forces quantification. Reduces gut-feeling decisions. Easy to compare across very different features.
**Weaknesses**: Reach and Impact estimates can be unreliable. Bias toward high-reach features over high-impact-per-user features. Doesn't account for strategic importance.

---

## 2. ICE Framework

### The Framework
ICE = Impact × Confidence × Ease

Simpler than RICE. Each dimension scored 1-10.
- **Impact**: How much will this move the metric you care about? (1-10)
- **Confidence**: How sure are you about Impact and Ease estimates? (1-10)
- **Ease**: How easy is this to implement? (1-10, where 10 = trivial)

```
ICE Score = Impact × Confidence × Ease
```

### When to Use ICE vs RICE
- Use ICE for quick prioritization of a long backlog. It's faster because you don't need to estimate Reach separately.
- Use RICE when Reach varies significantly between features (e.g., comparing a feature for all users vs a feature for PRO users only).
- Use ICE for internal decisions and roadmap planning. Use RICE for stakeholder presentations where you need to show your math.

### Stone AI ICE Examples

**Annual Billing Toggle on Pricing Page**
- Impact: 7 (drives annual conversions, reduces churn).
- Confidence: 9 (well-established best practice).
- Ease: 9 (UI change, Stripe supports it).
- ICE = 7 × 9 × 9 = 567. **High priority.**

**Agent Performance Analytics Dashboard**
- Impact: 5 (helps optimize agents but doesn't directly affect users).
- Confidence: 6 (unsure how much optimization will improve output).
- Ease: 4 (requires logging infrastructure, dashboard development).
- ICE = 5 × 6 × 4 = 120. **Lower priority.**

**Conversation Export Feature**
- Impact: 4 (power users want it, most don't).
- Confidence: 8 (clear feature, easy to assess).
- Ease: 7 (technically straightforward).
- ICE = 4 × 8 × 7 = 224. **Medium priority.**

---

## 3. Kano Model

### The Framework
Classifies features into categories based on how they affect satisfaction:

**Basic (Must-Have)**
- Expected by all users. Their presence doesn't delight — their absence causes frustration.
- If you don't have these, users leave. If you do, they don't give you credit.
- Stone AI examples: Chat works reliably. Messages send without errors. Login works. Pages load.

**Performance (More Is Better)**
- Satisfaction scales linearly with quality. Better performance = more satisfaction.
- Stone AI examples: Response speed (faster = better). Response quality (smarter = better). Number of agents (more = better, up to a point).

**Excitement (Delighters)**
- Users don't expect these. Their absence doesn't disappoint, but their presence creates delight and differentiation.
- Stone AI examples: Bestie remembering previous conversations. Easter eggs. Emotes. Personalized onboarding. OG badges.

**Indifferent**
- Users don't care either way. Building these is wasted effort.
- Stone AI examples (hypothetical): Detailed API documentation for a consumer product. Advanced admin analytics for users (not the founder).

**Reverse**
- Features that actually reduce satisfaction for some users. They actively don't want it.
- Stone AI examples (hypothetical): Aggressive notification system. Auto-playing sounds. Mandatory tutorials.

### Applying Kano to Stone AI's Feature Set

| Feature | Kano Category | Implication |
|---------|--------------|-------------|
| Chat works | Basic | Must be flawless. No negotiation. |
| Agent switching | Basic (approaching Performance) | Core promise. Must work smoothly. |
| Response quality | Performance | Continuously improve. |
| Response speed | Performance | Continuously optimize. |
| Agent count | Performance (diminishing returns) | More helps, but quality matters more. |
| Bestie | Excitement → Performance | Was a delighter, becoming expected by engaged users. |
| Forum | Excitement | Adds unexpected community value. |
| Backdrops | Excitement | Personalization delight. Low effort to maintain. |
| Emotes | Excitement | Fun, engaging, memorable. |
| Easter eggs / OG badges | Excitement | Rewards exploration and loyalty. |
| Dark mode | Basic (for many users) | Some users expect it and leave without it. |
| Conversation export | Indifferent → Basic (for power users) | Most don't care; power users may need it. |

### Kano Strategy
1. **Basics first.** If any basic feature is broken or missing, fix it before building anything else.
2. **Invest in Performance features.** These are the biggest drivers of satisfaction and differentiation.
3. **Sprinkle Excitement features.** These create word-of-mouth, delight, and differentiation — but don't over-invest because they become Basic over time.
4. **Avoid Indifferent features.** Every hour spent on something users don't care about is an hour not spent on something they do.
5. **Test for Reverse features.** Before building, ask: could any user segment actively dislike this?

### Kano Evolution
Features migrate between categories over time:
- **Excitement → Performance → Basic.** What delights today is expected tomorrow.
- Bestie is on this trajectory. It was an excitement feature (unexpected AI companion). As users get accustomed, it becomes Performance (they expect it to work well) and eventually Basic (they'd be angry if it broke).
- Plan for this. Today's delighters need continuous innovation to stay exciting.

---

## 4. Jobs-to-Be-Done (JTBD)

### The Framework
Users don't buy products — they "hire" products to do a job. Understand the job, and you understand what to build.

### What Job Does Each Stone AI Feature Do?

**Chat Agents**
- Job: "Help me solve a specific problem without spending hours researching."
- Functional: Get an answer, get it fast, get it right.
- Emotional: Feel confident in the answer. Feel supported. Feel smart.
- Social: Be able to produce work that impresses others.

**Bestie**
- Job: "Give me a companion I can talk to when I need to think out loud or don't want to be alone."
- Functional: Have a conversation, process thoughts, get emotional feedback.
- Emotional: Feel heard, feel connected, feel less alone.
- Social: Not applicable (Bestie is private).

**Agent Switching**
- Job: "Let me get the right expert for the right problem without leaving the platform."
- Functional: Switch contexts seamlessly.
- Emotional: Feel like I have a team behind me, not just one bot.

**Tier Upgrade**
- Job: "Give me access to better tools so I can do better work."
- Functional: More agents, better models, more capability.
- Emotional: Feel like I'm investing in myself. Feel professional.

**Forum**
- Job: "Connect me with other people who use this product so I can learn and share."
- Functional: Ask questions, share tips, read discussions.
- Emotional: Feel part of a community. Feel like I'm not alone in using AI tools.

### Applying JTBD to Feature Decisions

When evaluating a new feature, ask:
1. **What job would this feature be hired to do?**
2. **How are users currently doing this job?** (What are they "hiring" instead?)
3. **How well do current solutions do the job?** (What's the satisfaction gap?)
4. **Would this feature do the job significantly better?**

If the answer to #4 is "marginally" or "not really," don't build it.

### Unmet Jobs (Feature Opportunities)

**Job: "Help me learn how to use AI better."**
- Currently doing: Googling "best AI prompts," watching YouTube tutorials.
- Opportunity: In-app tips, agent-generated prompt suggestions, "how to get the most from this agent" guides.
- Priority: Medium. Improves activation and retention.

**Job: "Help me collaborate with others using AI."**
- Currently doing: Copy-pasting AI outputs into shared docs.
- Opportunity: Shared conversations, team features, collaborative agents.
- Priority: Low now (solo founder, B2C product). High later if B2B enters.

**Job: "Show me the value I'm getting from this subscription."**
- Currently doing: Nothing — users can't quantify their value.
- Opportunity: Monthly value reports, usage analytics, time-saved estimates.
- Priority: Medium-high. Directly prevents "not using it enough" churn.

---

## 5. Opportunity Scoring

### The Framework
Score features based on the gap between importance and satisfaction.

For each user need:
- **Importance**: How important is this need to users? (1-10)
- **Satisfaction**: How satisfied are users with the current solution? (1-10)

```
Opportunity Score = Importance + max(Importance - Satisfaction, 0)
```

High importance + low satisfaction = huge opportunity.
High importance + high satisfaction = already handled.
Low importance + low satisfaction = don't bother.

### Stone AI Opportunity Map

| Need | Importance | Satisfaction | Opportunity |
|------|-----------|-------------|-------------|
| Get quick, accurate answers | 9 | 7 | 11 |
| Switch between specialists | 8 | 8 | 8 |
| Affordable pricing | 8 | 6 | 10 |
| Fast response times | 8 | 5 | 11 |
| Personal AI companion | 6 | 7 | 6 |
| Community/Forum | 4 | 5 | 4 |
| Conversation history/export | 5 | 3 | 7 |
| Mobile experience | 7 | 4 | 10 |
| UI customization (backdrops) | 3 | 7 | 3 |
| Understand value received | 7 | 2 | 12 |

### Reading the Opportunity Map
- "Understand value received" has the highest opportunity score (12). Users care about knowing what they're getting but we don't show them. **Build monthly value reports.**
- "Fast response times" and "Get quick, accurate answers" score 11. Users care a lot and we're not fully satisfying them. **Optimize response speed and quality.**
- "Mobile experience" scores 10. Users want good mobile use and we're under-delivering. **Invest in responsive design / PWA.**
- "UI customization" scores 3. Users don't care much and we're already doing okay. **Don't invest further.**

---

## 6. Build vs Buy vs Integrate

### The Decision Framework

For each capability needed, ask:

**Build In-House When:**
- It's a core differentiator (agents, Bestie, chat interface).
- You need full control over the experience.
- No existing solution fits your exact needs.
- The long-term cost of building is lower than licensing.

**Buy (License/Subscribe) When:**
- It's not a differentiator (auth, payments, email sending).
- A proven solution exists that's better than what you'd build.
- Time-to-market matters more than customization.
- The total cost of ownership is lower than building.

**Integrate (API/Plugin) When:**
- You need a specific capability but not the full product.
- An API provides the exact functionality.
- Integration effort is small relative to building from scratch.

### Stone AI Build/Buy/Integrate Decisions

| Capability | Decision | Rationale |
|-----------|----------|-----------|
| Authentication | Buy (Clerk) | Not a differentiator. Clerk handles edge cases we'd never cover. |
| Payments | Buy (Stripe) | Industry standard. PCI compliance alone justifies it. |
| AI Models | Integrate (vLLM + Anthropic API) | Core to product but not our models to build. |
| Chat Interface | Build | Core differentiator. Must be exactly right. |
| Agent System | Build | THE differentiator. System prompts are our IP. |
| Bestie | Build | Unique feature. No existing solution. |
| Forum | Build | Needs to be integrated, not a separate platform. |
| Email (transactional) | Buy/Integrate (Nodemailer + Gmail SMTP) | Standard infrastructure. |
| Database | Buy (Neon PostgreSQL) | Managed PG with pgvector. Don't run your own. |
| Hosting | Buy (Vercel) | Next.js optimized. Don't manage servers. |
| CDN/DNS | Buy (Cloudflare) | Industry standard. Better than anything we'd build. |
| Analytics | Build or Buy | Depends on depth needed. Basic: buy. User health scoring: build. |

### Decision Principles
1. **Build your moat. Buy everything else.** Agents and Bestie are the moat. Auth and payments are plumbing.
2. **Speed matters.** If buying saves 2 months of development, buy. You can always replace later.
3. **Evaluate total cost of ownership**, not just upfront cost. Clerk at $X/month saves engineering time worth $10X/month.
4. **Integration tax is real.** Every external service adds complexity, dependency risk, and potential failure points. Don't integrate 50 services when 5 would do.

---

## 7. Technical Debt vs Feature Development

### What Is Technical Debt?
Shortcuts taken during development that create future work. Like financial debt — you borrow speed now and pay interest later (in bugs, slow development, fragile systems).

### Types of Technical Debt

**Intentional Debt**
- "We know this isn't ideal, but shipping now is more important. We'll fix it later."
- Acceptable when: Time-to-market is critical. The shortcut is documented. "Later" is actually scheduled.
- Stone AI example: Using a simple in-memory cache instead of Redis for early development, knowing you'll migrate later.

**Unintentional Debt**
- "We didn't realize this approach would cause problems."
- Happens when: Inexperience, time pressure, or incomplete understanding of the problem.
- Stone AI example: A database schema that doesn't scale. Discovered only when usage grows.

**Bit Rot**
- Code that degrades as dependencies update, requirements change, and the codebase grows around it.
- Prevention: Regular dependency updates, periodic refactoring, comprehensive testing.

### When to Pay Down Debt vs Build Features

**Pay down debt when:**
- Development speed is significantly slowed by the debt. (If adding a new agent takes 3 days instead of 1 because of architectural issues, fix the architecture.)
- Bugs are recurring from the same root cause. (Same bug appearing in different places = systemic debt.)
- Security is at risk. (Security debt is never acceptable to carry. Fix immediately.)
- The debt is in a hot path (frequently modified code). Debt in rarely-touched code is cheaper to carry.

**Build features when:**
- The debt is manageable and not slowing you down.
- The feature has immediate revenue or retention impact.
- You're pre-product-market-fit. Speed > cleanliness.
- The debt is in code you might replace entirely.

### The 80/20 Rule for Debt
- Spend ~80% of development time on features and ~20% on debt reduction.
- If debt is critical: flip to 50/50 or even 80% debt for a sprint.
- If you're shipping fast and debt is minimal: go 90/10 features.
- Never go 100% features for more than 2-3 sprints. Debt compounds.

---

## 8. Post-Launch Optimization vs New Feature Development

### The Shift Point
After launch, there's a natural tension: do you build new features or optimize existing ones?

**Optimize existing features when:**
- Core features aren't performing well (low activation, high churn at specific feature touchpoints).
- User feedback consistently points to existing feature quality.
- Retention is the bottleneck (not acquisition).
- Small improvements to existing features would move metrics more than a new feature.

**Build new features when:**
- The core product is stable and performing well.
- There's a clear gap in the product that users are asking for.
- A new feature would open a new market segment.
- Competitive pressure demands it.

### Optimization Opportunities in Stone AI

**Agent Response Quality**
- Every 10% improvement in response quality improves retention, satisfaction, and word-of-mouth.
- Optimization: Better system prompts, model fine-tuning, response format improvements.
- This is infinite work — there's always room to improve. Budget continuous effort.

**Response Speed**
- Speed is a Performance feature (Kano). Faster is always better.
- Optimization: Caching, pre-warming, streaming responses, model optimization.
- Diminishing returns below ~500ms. Users won't notice the difference between 300ms and 400ms, but they'll notice 2 seconds vs 500ms.

**Onboarding Flow**
- Every percentage point of activation improvement compounds into more revenue.
- Optimization: A/B test flows, reduce friction, improve first response, add conversation starters.

**Pricing Page**
- The pricing page is the highest-leverage page on the site. Small improvements here directly affect revenue.
- Optimization: Test layouts, tier descriptions, CTA copy, discount presentation.

### The Optimization Mindset
- New features are exciting. Optimization is boring. But optimization often has higher ROI.
- A new feature serves some users. Optimization of an existing feature serves all users.
- The best products are great at a few things, not mediocre at many things.
- Rule: Before building a new feature, ask "Could we get the same impact by improving an existing one?"

---

## 9. The "One Metric That Matters" (OMTM)

### The Principle
At each growth stage, there's one metric that matters more than all others. Focus on it. Don't try to optimize everything simultaneously.

### OMTM by Growth Stage

**Pre-Launch / Early Stage**
- OMTM: **Activation Rate** (% of signups who reach aha moment).
- Why: Nothing else matters if users don't experience value.
- When to move on: When activation rate is stable at 40%+.

**Post-Launch / Growth Stage**
- OMTM: **Week 1 Retention** (% of activated users who return in week 1).
- Why: Retention is the foundation of growth. Without it, acquisition is pouring water into a leaky bucket.
- When to move on: When W1 retention is stable at 30%+.

**Scaling Stage**
- OMTM: **MRR Growth Rate** (month-over-month revenue growth).
- Why: Revenue is the ultimate measure of product-market fit + execution.
- When to move on: When MRR growth is consistently positive and sustainable.

**Mature Stage**
- OMTM: **Net Revenue Retention (NRR)** (are existing customers spending more?).
- Why: At scale, growing from existing customers is more efficient than acquiring new ones.
- NRR > 100% means the business grows even with zero new customers.

### OMTM for Stone AI Right Now
Based on current stage (post-launch, early growth):
- **Primary OMTM: Week 1 Retention.**
- Secondary metrics to track: Activation rate, MRR, churn rate.
- Everything built should be evaluated against: "Does this improve Week 1 retention?"

---

## 10. Feature Evaluation Checklist

Before greenlighting any new feature, answer these questions:

### Strategic Fit
1. Does this support the OMTM? If not, why build it now?
2. Does this strengthen a moat (agents, Bestie, ecosystem)?
3. Does this serve the target user or a different user entirely?

### User Impact
4. What job is this feature hired to do?
5. How many users will this affect? (Reach)
6. How much will it matter to them? (Impact)
7. What's the current alternative? Is it good enough?

### Execution
8. How long will this take? (Effort)
9. What's the confidence level in our estimates?
10. Does this create technical debt? How much?
11. Does this require ongoing maintenance?

### Opportunity Cost
12. What are we NOT building by building this?
13. Could we get the same impact by optimizing an existing feature?
14. Is this a Type 1 (irreversible) or Type 2 (reversible) decision?

### Scoring
- If the feature passes 10+ of these 14 checks favorably, it's likely a good investment.
- If it fails 5+, reconsider.
- If it fails the OMTM check (#1), it should be tabled regardless of other scores.

---

## 11. Quick Reference: Prioritization Framework Comparison

| Framework | Best For | Complexity | Time to Score |
|-----------|----------|------------|---------------|
| RICE | Comparing features with different reach | Medium | 10-15 min/feature |
| ICE | Quick backlog prioritization | Low | 2-5 min/feature |
| Kano | Understanding feature category/type | Medium | Requires user research |
| JTBD | Understanding why users want features | High | Requires interviews/data |
| Opportunity Scoring | Finding gaps in user satisfaction | Medium | Requires survey data |
| OMTM | Focusing the entire team | Low | One decision, revisit quarterly |

### Recommended Approach for Stone AI
1. Use **OMTM** to set the strategic focus.
2. Use **ICE** for quick weekly prioritization of the backlog.
3. Use **RICE** for quarterly planning and major feature decisions.
4. Use **Kano** once a quarter to classify new feature requests.
5. Use **JTBD** when evaluating entirely new product directions.
6. Use **Opportunity Scoring** annually (or when user survey data is available).
