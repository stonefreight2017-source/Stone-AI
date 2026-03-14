# SaaS Pricing Psychology — Complete Knowledge Seed

## Purpose
This document contains everything a Palace agent needs to understand about SaaS pricing psychology, applied specifically to Stone AI's tier structure. Use this to advise on pricing decisions, optimize tier design, write pricing page copy, and understand why users upgrade (or don't).

---

## 1. Anchor Pricing

### The Principle
Anchor pricing exploits the cognitive bias where the first price a person sees becomes their reference point for evaluating all subsequent prices. In a tiered SaaS model, the highest tier isn't just for whales — it reframes the entire pricing page.

### How It Works in Stone AI
- **PRO at $200/month** is the anchor. When a user sees $200 first (or prominently), $99.99 for SMART feels reasonable by comparison.
- The psychological math: "$200 is serious money, but $99.99 gets me 39 of the 42 agents? That's half the price for 93% of the product."
- Without the $200 anchor, $99.99 feels expensive on its own. With it, $99.99 feels like the smart middle ground.

### Anchor Placement Strategy
- On a pricing page, display tiers left-to-right from cheapest to most expensive, but **visually highlight the target tier** (SMART or PLUS depending on the page context).
- The anchor works even if almost nobody buys PRO. Its job is to make the middle tiers feel affordable.
- If you're running a promotion, always show the original price crossed out next to the promo price. The crossed-out price is the anchor.

### Anchoring Rules
1. **The anchor must be credible.** $200/month for PRO must be justified by real value (42 agents, priority everything, full access). If users think the price is fake or inflated, the anchor loses power.
2. **The gap between anchor and target shouldn't be too small.** PRO at $200 and SMART at $99.99 is a 50% gap — strong. If PRO were $120 and SMART were $99.99, the anchor barely moves the needle.
3. **The gap shouldn't be too large either.** If PRO were $500 and SMART were $99.99, users might think "the $500 tier is for enterprises, not me" and mentally discard it, nullifying the anchor.
4. **Multiple anchors work.** On a landing page, you might mention "enterprise AI solutions cost $500-2000/month" before showing your pricing. Now even PRO at $200 feels reasonable.

### External Anchoring
- ChatGPT Plus is $20/month for one model. Position Stone AI's multi-agent system as categorically different: "One brain vs 44 specialists."
- Claude Pro is $20/month. Midjourney is $10-60/month. These are single-tool prices. Stone AI bundles multiple capabilities.
- The framing: "You could subscribe to 5 different AI tools for $100+/month, or get 44 specialized agents in one place."

---

## 2. Decoy Tiers

### The Principle
A decoy tier is a pricing option that exists partly to make another option look better. It's not designed to be the most popular — it's designed to push people toward the tier you actually want them to buy.

### Identifying the Decoy in Stone AI
The current tier structure:
- FREE: $0, 4 agents
- STARTER: $19.99, 16 agents
- PLUS: $49.99, 30 agents
- SMART: $99.99, 39 agents (annual: $79.99)
- PRO: $200, 42 agents (annual: $170)

**STARTER functions partly as a decoy for PLUS.** Here's why:
- STARTER gives 16 agents for $19.99 ($1.25 per agent).
- PLUS gives 30 agents for $49.99 ($1.67 per agent).
- But the VALUE per dollar is higher at PLUS because the 14 additional agents include more powerful, specialized ones. The jump from 16 to 30 agents is huge — nearly doubling the capability for 2.5x the price.
- A user comparing STARTER and PLUS thinks: "For just $30 more, I get almost twice the agents." The $19.99 STARTER makes the $49.99 PLUS feel like a bargain.

**PRO functions as a decoy for SMART.**
- PRO gives 42 agents for $200 ($4.76 per agent).
- SMART gives 39 agents for $99.99 ($2.56 per agent).
- The gap: 3 extra agents for $100 more. Most users will rationally choose SMART.
- PRO exists for users who genuinely want everything, but its primary job is making SMART look like the sweet spot.

### Designing Effective Decoys
1. **The decoy should be clearly inferior on a per-unit basis** to the target tier. Users who do the math should arrive at the target tier.
2. **The decoy should still be a real product** people can buy. If nobody ever buys it, that's fine. But it must be a genuine offering, not a fake option.
3. **Never have three tiers where the middle one is obviously best.** The comparison should require a moment of thought — that thinking process is what drives the desired conclusion.
4. **Asymmetric dominance**: The target tier should be better than the decoy in every way that matters to the buyer. SMART beats PRO on price-per-agent while delivering 93% of the agent count.

### The Compromise Effect
When presented with three options, people tend to pick the middle one. This is the "compromise effect" or "Goldilocks principle."
- In our 5-tier structure, PLUS ($49.99) sits in the geometric middle.
- But SMART is the middle of the "serious" tiers (PLUS, SMART, PRO).
- Design the pricing page so the visual center of attention is on whatever tier you want to push at that moment.

---

## 3. Price Elasticity for AI Products

### The Principle
Price elasticity measures how sensitive demand is to price changes. In AI products, elasticity is unusual because perceived intelligence directly affects willingness to pay.

### AI-Specific Elasticity Factors

**Perceived Intelligence Premium**
- Users will pay significantly more for AI they perceive as "smarter." This is why SMART tier ($99.99) with Claude Sonnet (cloud) commands a premium over PLUS ($49.99) with local Qwen.
- The name "SMART" itself signals intelligence. The tier name is doing pricing work.
- When users experience a qualitatively better response (more nuanced, more accurate, more creative), their willingness to pay increases non-linearly. A 20% quality improvement can support a 50-100% price increase.

**Elasticity by Tier**
- FREE → STARTER: Highly elastic. Price-sensitive users. The jump from $0 to $19.99 is infinite in percentage terms. The value proposition must be overwhelming.
- STARTER → PLUS: Moderately elastic. Users have already committed to paying. The question is whether more agents justify more money. $30 incremental = 1.5x the cost for 1.875x the agents.
- PLUS → SMART: Less elastic. Users at this level value capability over cost. They're buying better AI models (Claude Sonnet), not just more agents. This is a quality-driven upgrade, not a quantity-driven one.
- SMART → PRO: Inelastic. PRO buyers are either power users who need every agent or professionals who expense it. Price sensitivity is low. They're buying completeness and status.

**AI Product Elasticity vs Traditional SaaS**
- Traditional SaaS (CRMs, project management): elasticity is moderate. Users comparison-shop heavily because the products feel similar.
- AI products: elasticity is lower because the products feel different from each other. Each AI has its own "personality" and capability profile. Once a user develops workflows around Stone AI's agents, switching costs are high even if a competitor is cheaper.
- The exception: commodity AI tasks (basic Q&A, simple writing). For these, elasticity is high because ChatGPT's free tier handles them. Stone AI must differentiate on specialist agent depth, not commodity tasks.

### Pricing Implications
1. **Don't compete on price for commodity features.** If someone just wants to chat with an AI, they'll use the free tier of whatever's available. Compete on specialist depth.
2. **Price the SMART tier based on perceived intelligence, not cost.** The compute cost difference between local Qwen and cloud Claude is real, but the pricing should reflect the perceived value gap, which is larger than the cost gap.
3. **Test price sensitivity carefully.** A/B test pricing pages showing different annual discount percentages. Small changes (15% vs 20% annual discount) can significantly affect conversion without materially changing revenue.
4. **Price increases are possible** if accompanied by visible quality improvements. "We upgraded SMART tier to Claude 3.5 Sonnet" justifies a price adjustment because the perceived intelligence increased.

---

## 4. Annual vs Monthly Discount Psychology

### Current Structure
- SMART: $99.99/month or $79.99/month billed annually (20% discount)
- PRO: $200/month or $170/month billed annually (15% discount)

### Industry Benchmarks
- **Optimal annual discount range: 16-20%.** This range maximizes annual plan adoption without leaving too much revenue on the table.
- Below 15%: not enough incentive; most users stick to monthly.
- Above 25%: too aggressive; you're giving away revenue and training users to expect deep discounts.
- **Sweet spot for most SaaS: 17-20%.**

### Analysis of Stone AI's Discounts
- **SMART at 20%**: Right in the sweet spot. $79.99 vs $99.99 is a clear, easy-to-calculate savings ($20/month, $240/year). This is strong.
- **PRO at 15%**: Slightly below the optimal range. Consider testing 17-18%. The difference: at 15%, annual PRO is $170/month ($2,040/year). At 17%, it would be $166/month ($1,992/year). At 20%, $160/month ($1,920/year). The question is whether the extra 2-5% conversion to annual plans is worth the per-user revenue reduction.

### Why Annual Plans Matter

**Cash Flow**
- Annual plans provide upfront cash. A SMART annual subscriber pays ~$960 upfront vs ~$100/month. That's 9.6 months of cash today.
- This cash funds development, marketing, and operations. For a solo founder, cash flow predictability is survival.

**Retention**
- Annual subscribers churn at roughly 50% the rate of monthly subscribers. Once someone pays for a year, they're committed.
- The sunk cost fallacy works in your favor: "I already paid for the year, I should use it."
- Annual plans also remove 11 decision points per year. A monthly subscriber asks "should I keep paying?" every month. An annual subscriber asks once.

**Revenue Predictability**
- Monthly MRR is volatile. Annual plans create a revenue floor. If you have 100 annual SMART subscribers, that's ~$96,000 in guaranteed annual revenue regardless of what happens with monthly subscribers.

### Annual Discount Psychology

**The Savings Frame**
- Always express annual savings as monthly: "Save $20/month with annual billing" (not "save $240/year"). Monthly framing makes the savings feel relevant to their monthly budget decisions.
- But ALSO show the total annual savings in a secondary callout: "That's $240 back in your pocket every year."

**The Commitment Frame**
- For commitment-averse users, offer the annual plan as a trial: "Try annual for one year. If it's not for you, switch back to monthly."
- Offer a money-back guarantee on annual plans (30 days). This removes the risk while keeping the commitment.

**The Value Frame**
- "SMART Annual is just $2.67/day" — daily price framing makes even $80/month feel trivial.
- "Less than a coffee a day for 39 AI agents."
- Compare to alternatives: "One freelance designer costs $50-100/hour. One SMART agent handles design tasks for $2.67/day."

### Implementation Tactics
1. **Default to annual billing** on the pricing page. Show annual prices prominently, with a toggle to see monthly. Most users won't toggle.
2. **Show the monthly price crossed out** next to the annual monthly-equivalent: "~~$99.99~~ $79.99/month, billed annually."
3. **Add a "BEST VALUE" badge** to the annual option. Social proof signals that the annual plan is the smart choice.
4. **At the monthly billing confirmation**, show what they'd save annually: "You're about to pay $99.99/month. Switch to annual and save $240/year." One last chance to convert.
5. **Offer annual as an upgrade** to existing monthly subscribers. After 2-3 months of monthly billing, prompt: "You've been with us for 3 months — that's $300. Annual would have been $240 less. Want to switch?"

---

## 5. Free-to-Paid Conversion

### The Free Tier Challenge
Stone AI offers 4 FREE agents. The challenge: these 4 agents must be good enough to demonstrate value but limited enough to drive upgrades. This is the hardest balance in freemium SaaS.

### The Value Demonstration Problem
- If FREE agents are too weak, users conclude "this product sucks" and leave. They never see the value of paid tiers.
- If FREE agents are too strong, users think "this is all I need" and never upgrade. You've given away the product.
- The sweet spot: FREE agents solve real problems but leave visible, desirable gaps.

### Designing the FREE-to-Paid Bridge

**The Taste-Test Approach**
- FREE agents should give users a taste of what specialist agents can do. If FREE includes a general-purpose chat agent, that agent should occasionally reference that "our Writing Specialist agent could do this better" or "for deeper analysis, our Research agent would be ideal."
- In-product education: when a FREE user asks a question that a paid agent handles better, show a soft upsell: "This answer is from [FREE agent]. For expert-level analysis, try [PAID agent] — available on STARTER."

**The Ceiling Hit**
- The most effective upgrade trigger is when users hit the ceiling of what FREE can do. With 4 agents, the ceiling is agent variety.
- Track when FREE users ask questions outside the scope of their 4 agents. These are upgrade signals.
- When a user asks for something a paid agent handles: "Great question! Our [Agent Name] specializes in exactly this. It's available on [TIER]."

**Conversion Benchmarks**
- Healthy free-to-paid conversion for AI SaaS: 2-5% of free users convert to paid within 30 days.
- Top-performing products: 5-10%.
- If conversion is below 2%, either the free tier is too generous or the paid tier value isn't clear.
- If conversion is above 10%, the free tier might be too restrictive (users who convert immediately might have converted at a less restrictive free tier, meaning you're losing potential users who bounce at the gate).

### The Conversion Funnel
1. **Signup** (100%): User creates account. Must be frictionless — no credit card required, minimal form fields.
2. **Activation** (target: 60-70%): User completes first meaningful action (sends first chat, tries an agent). See activation-funnels.md for depth.
3. **Engagement** (target: 40-50% of signups): User returns for second session within 7 days.
4. **Value Realization** (target: 20-30%): User has their "aha moment" — the product solved a real problem for them.
5. **Upgrade Intent** (target: 10-15%): User hits a ceiling or sees a paid feature they want.
6. **Conversion** (target: 3-7%): User enters payment information and subscribes.

### Conversion Tactics for Stone AI

**Feature Gating**
- Show paid agents in the UI but mark them as locked. Users can see what they're missing. A grayed-out agent with a description of what it does is a constant, passive upsell.
- Let FREE users preview paid agent responses (first 2-3 messages in a conversation, then gate). This is powerful — they've already started getting value and don't want to stop.

**Usage Limits**
- Consider message limits on FREE tier (e.g., 50 messages/day). Generous enough for evaluation, tight enough for daily use to bump the ceiling.
- When a user hits the limit: "You've used all your free messages today. Upgrade to STARTER for unlimited messages — just $19.99/month."

**Social Proof at Upgrade Points**
- At every upgrade prompt, include: "Join X users who upgraded this week" or "95% of STARTER users say the extra agents were worth it."
- Testimonials from users who upgraded, specifically about the value they found after upgrading.

**Time-Limited Trials**
- Offer a 7-day free trial of STARTER to engaged FREE users (those who've used the product for 3+ days).
- After the trial, they've experienced the fuller product. Going back to FREE feels like a downgrade. Loss aversion drives conversion.

---

## 6. Tier Upgrade Triggers

### What Makes Users Upgrade Between Tiers

**FREE → STARTER ($0 → $19.99)**
- **Trigger**: Agent ceiling. User wants agents not in the FREE set.
- **Trigger**: Quality perception. User realizes STARTER agents might give better answers (even if the underlying model is the same, the specialist prompts improve output).
- **Trigger**: Social proof. "Most users upgrade within their first week."
- **Blocker**: Price sensitivity. $0 to $19.99 is the hardest jump. Mitigate with $9.99 first month promo.

**STARTER → PLUS ($19.99 → $49.99)**
- **Trigger**: Agent ceiling again. 16 agents isn't enough; they want specific PLUS-tier agents.
- **Trigger**: Usage volume. Heavy users who chat daily feel they're getting strong ROI at $19.99 and can justify $49.99.
- **Trigger**: Bestie quality. If Bestie features improve at PLUS tier, emotional attachment drives upgrades.
- **Blocker**: 2.5x price increase. Must clearly articulate what the extra $30/month buys. "14 more specialist agents" must feel like a meaningful capability jump.

**PLUS → SMART ($49.99 → $99.99)**
- **Trigger**: AI quality. This is the model upgrade tier — Cloud Claude Sonnet vs local Qwen. Users who hit the quality ceiling of local models want better.
- **Trigger**: Professional use. Users deploying Stone AI for work need the best outputs. $100/month is cheap compared to hiring.
- **Trigger**: 9 more agents, including the most specialized ones.
- **Blocker**: Doubling the price. The value must be framed as qualitative (smarter), not just quantitative (more agents).

**SMART → PRO ($99.99 → $200)**
- **Trigger**: Completeness. Users who want every single agent. Collectors, completionists, power users.
- **Trigger**: Professional/business expense. $200/month is trivial as a business expense for a tool used daily.
- **Trigger**: Priority access, premium support, any PRO-exclusive features.
- **Blocker**: Only 3 more agents for $100 more. The per-agent value is poor. PRO must be sold on exclusivity and completeness, not per-agent economics.

### Engineering Upgrade Triggers

**The Ceiling Notification**
- When a user performs an action that would be better served by a higher tier, notify them. Not aggressively — helpfully.
- "You asked about financial modeling. Our Financial Analyst agent (available on PLUS) specializes in this. Want to see what it would say?"

**The Comparison Preview**
- Show the user what a higher-tier agent would produce for the same query. Side-by-side comparison is powerful.
- "Here's what our FREE agent says. Here's what our SMART agent would say." Let the quality difference sell itself.

**The Milestone Upgrade**
- After a user hits usage milestones (100 messages, 7 consecutive days, 10 different agent interactions), present an upgrade offer.
- "You've sent 100 messages! You're clearly getting value from Stone AI. Ready to unlock more?"

**The Social Upgrade**
- "Users like you typically upgrade to PLUS within their first month." Behavioral similarity drives action.
- "87% of users who use 3+ agents daily upgrade within 30 days."

---

## 7. Price Anchoring with Promotions

### The Reference Price Problem
When you offer a $9.99 first month promo on STARTER ($19.99), you create a reference price problem. The user's brain anchors to $9.99, not $19.99. When the second month bill hits at $19.99, it feels like a price increase, even though it was always the plan.

### The Damage
- Higher churn at month 2 than month 1 for promo cohorts. The "sticker shock" of the real price.
- Users who signed up at $9.99 may have lower willingness to pay than users who signed up at $19.99. You're selecting for price-sensitive customers.
- The promo might attract users who were never going to be long-term customers — they wanted a deal, not a product.

### Mitigation Strategies

**Transparent Communication**
- At signup, show both prices: "$9.99 for your first month, then $19.99/month." Make the real price unavoidable.
- Send an email at day 20: "Your first month is almost over! Starting next month, your plan renews at $19.99/month — the standard STARTER price." No surprises.
- Frame the promo as a discount, not a price: "You're saving $10 this month." This anchors to $19.99 with a $10 discount, not to $9.99 as the base.

**Promo-to-Annual Bridge**
- At the end of the promo month, offer annual billing: "Instead of $19.99/month, lock in $16.99/month with annual billing — that's even less than your promo price." This converts the promo into a longer commitment at a rate that feels like a continuation of the deal.

**Value Escalation During Promo Month**
- Use the promo month to deliver overwhelming value. If the user gets $100 worth of value from their $9.99 month, $19.99 feels cheap.
- Curate the first-month experience: onboarding, guided tours of agents, personalized recommendations. Make them fall in love before the real price kicks in.
- Track engagement during the promo month. Low-engagement promo users will churn. High-engagement users won't.

**Promo Structure Alternatives**
- Instead of $9.99 first month, consider: "First month free, then $19.99/month." This avoids creating a non-zero reference price. $0 → $19.99 is different psychologically than $9.99 → $19.99 because $0 is understood as "free trial" while $9.99 is understood as "cheap product."
- Or: "$14.99 for first 3 months, then $19.99/month." This extends the anchor period but makes the final price bump smaller ($5 vs $10).
- Or: Annual-only promo. "$9.99 first month applies only to annual plans." This locks in the customer for a year, eliminating the month-2 churn risk entirely.

### Promo Analytics
Track these metrics for every promo cohort:
- **Month 2 retention**: What % survive the price change?
- **LTV comparison**: Promo cohort LTV vs full-price cohort LTV. If promo LTV is lower, the promo is attracting the wrong users.
- **Upgrade rate**: Do promo users upgrade to higher tiers at the same rate as full-price users?
- **Time to churn**: How long do promo users stay vs full-price users?

If promo cohorts consistently underperform on LTV, reconsider the promo or restructure it.

---

## 8. Subscription Fatigue Mitigation

### The Problem
The average consumer has 4-6 active subscriptions. Every new subscription competes with existing ones for budget and attention. "Subscription fatigue" is real — users cancel subscriptions they forget about, don't use enough, or can't justify anymore.

### How Annual Plans Mitigate Fatigue

**Decision Reduction**
- Monthly billing creates 12 decision points per year. Each bill is a chance to cancel.
- Annual billing creates 1 decision point per year. The other 11 months, the subscription is invisible.
- Annual subscribers are 2-3x less likely to churn because they simply don't think about it.

**Sunk Cost Lock-in**
- After paying $960 for annual SMART, the user's psychology shifts to: "I need to use this enough to justify what I paid."
- Monthly at $99.99: "Is this worth $100 this month?" — evaluated each month.
- Annual at $960: "I already paid, I should get my money's worth" — drives usage, which drives retention.

### Other Fatigue Mitigation Strategies

**Visibility of Value**
- Send monthly "value reports": "This month, you chatted with 8 agents, sent 340 messages, and your Bestie had 45 conversations. Here's the value you got from Stone AI."
- Quantify the value: "If you hired a human for these tasks, it would cost approximately $X."
- This combats the "do I use this enough?" cancellation trigger.

**Integration Into Daily Workflow**
- The deeper Stone AI integrates into a user's daily routine, the harder it is to cancel.
- Bestie creates emotional integration — it's not just a tool, it's a companion.
- Forum creates social integration — you're part of a community, not just using software.
- Agents create workflow integration — your productivity depends on them.

**Bundle Positioning**
- Position Stone AI as replacing multiple subscriptions: "Stone AI replaces your writing tool ($15/month), your research tool ($20/month), your coding assistant ($10/month), and your personal assistant ($25/month). All for $49.99/month with PLUS."
- This reframes Stone AI as a subscription reducer, not a subscription adder.

**Cancellation Flow Design**
- When a user initiates cancellation, show their usage stats and value received.
- Offer a downgrade instead of cancel: "Instead of canceling, switch to STARTER for just $19.99 and keep access to 16 agents."
- Offer a pause: "Take a break for 1-2 months. We'll hold your settings and Bestie configuration."
- Offer a discount: "We'd hate to lose you. Here's 30% off your next 3 months." (Only offer this to high-value users.)

---

## 9. Psychological Pricing

### The Left-Digit Effect
- $19.99 feels significantly cheaper than $20.00 because the left digit is "1" instead of "2."
- This effect is real and measurable. Studies show 15-25% higher purchase rates for .99 pricing vs round numbers.
- Stone AI uses this correctly: $19.99, $49.99, $99.99.

### When Round Numbers Work Better
- **Premium positioning**: $200 for PRO (not $199.99). Round numbers signal premium, luxury, confidence. "$200" says "we're worth it." "$199.99" says "we're trying to look cheaper."
- The current PRO price of $200 is correct for this reason. PRO is the premium tier — it should feel premium.
- Rule of thumb: use .99 pricing for tiers where you want volume (STARTER, PLUS, SMART). Use round numbers for tiers where you want exclusivity (PRO).

### Price-Quality Inference
- Higher prices signal higher quality. This is especially true for AI products where quality is hard to evaluate before purchase.
- If SMART were priced at $49.99 (same as PLUS), users would assume it's the same quality. At $99.99, users assume it must be significantly better.
- Don't underprice. A $30 AI product can seem less capable than a $100 AI product even if the underlying technology is identical.

### Charm Pricing Details
- The .99 ending works best for prices under $100. Above $100, the psychological impact diminishes.
- $99.99 is the maximum effective charm price. This is why SMART is positioned here — it's the highest tier where .99 pricing provides maximum psychological benefit.
- For prices above $100, consider .95 or round numbers. $170 (annual PRO) is clean and appropriate.

### Price Presentation Formats
- **Monthly price**: Always show the monthly price for comparison purposes. Users budget monthly.
- **Per-day price**: Use for justification. "$3.33/day for SMART" sounds trivial.
- **Per-agent price**: Use when quantity is the differentiator. "Just $1.25 per agent at STARTER."
- **Savings framing**: "Save $240/year with annual billing" — always show what they save, not what they pay.
- **Never show the total annual price upfront** for expensive tiers. $960/year for SMART is scary. $79.99/month billed annually is palatable.

---

## 10. Value Metric Alignment

### The Question
Are we charging for the right thing? The "value metric" is the unit that determines what users pay for. Common value metrics in SaaS:
- Per seat (Slack, Zoom)
- Per usage (AWS, Twilio)
- Per feature/tier (most SaaS)
- Per outcome (rare, but growing)

### Stone AI's Current Value Metric
Stone AI charges per tier, where tiers are defined primarily by **agent access** (number of agents available) and secondarily by **AI model quality** (local vs cloud).

### Is This the Right Metric?

**Arguments For (Agent Access as Value Metric)**
- It's simple. Users understand "more agents = more capability."
- It creates natural upgrade pressure. When you want an agent you don't have, you need a higher tier.
- It's easy to market: "4 agents, 16 agents, 30 agents, 39 agents, 42 agents."
- It doesn't penalize heavy users. Once you're on a tier, you can use your agents as much as you want.

**Arguments Against**
- It doesn't scale with usage. A user who sends 10 messages/day and one who sends 500 messages/day pay the same. The heavy user costs more to serve (compute) but pays the same.
- The value isn't in agent COUNT — it's in agent QUALITY. Having 42 mediocre agents is worth less than 10 excellent ones. The metric should capture quality, not just quantity.
- Some agents may be used heavily and others barely. Users are paying for agents they don't use.

**Hybrid Approach (Consider for Future)**
- Keep tier-based access as the primary metric (users understand it).
- Add a usage component for heavy users: "SMART includes 1,000 messages/month. Additional messages at $0.01 each." This captures more value from power users without raising the base price.
- Or: keep unlimited usage but add premium features within tiers (priority response speed, longer context windows, file analysis) as the upsell.

### Value Metric Best Practices
1. **The value metric should grow with the customer's success.** If the customer gets more value, they should naturally pay more. With agent access, this works: as users need more agents, they upgrade.
2. **The metric should be predictable.** Users hate surprise bills. Tier-based pricing is predictable. Usage-based pricing creates anxiety. Stone AI's current model is good here.
3. **The metric should be easy to understand.** "You get X agents" is crystal clear. "You get X compute units" is confusing. Current model wins.
4. **The metric should align cost to serve with revenue.** This is where tier-based pricing can misalign. Consider monitoring compute costs per tier and per user to ensure heavy users aren't eroding margins.

### Revenue Per User Optimization
- Track ARPU (Average Revenue Per User) by tier and overall.
- Track ARPU trends over time. Rising ARPU = users are upgrading. Falling ARPU = users are downgrading or new users are starting lower.
- Target: ARPU should be between your second and third tier price points. For Stone AI, healthy ARPU would be $40-80/month (between PLUS and SMART).
- If ARPU is below $30, too many users are on FREE/STARTER. If above $100, you might be underserving the middle market.

---

## 11. Competitive Pricing Analysis

### How to Position Against Competitors

**vs ChatGPT (OpenAI)**
- ChatGPT Free: unlimited basic chat. Stone AI FREE: 4 specialized agents.
- ChatGPT Plus: $20/month for GPT-4. Stone AI STARTER: $19.99/month for 16 specialized agents.
- Frame: "ChatGPT is one brain. Stone AI is 16+ specialists." Quality of specialization vs quality of base model.
- Don't compete on base model quality — compete on specialist depth.

**vs Claude (Anthropic)**
- Claude Free: limited usage. Claude Pro: $20/month.
- Stone AI uses Claude as a backend model, so competing against Claude directly is complex.
- Frame: "Claude powers some of our agents, but Stone AI adds the specialization layer, the Bestie companion, and the multi-agent system."

**vs Specialized AI Tools**
- Jasper (writing): $49-125/month. Stone AI's writing agents are included in any paid tier.
- Copy.ai: $36-49/month. Same argument.
- Frame: "Instead of paying for 5 specialized AI tools, get them all in Stone AI."

**Pricing Parity Points**
- STARTER at $19.99 is at parity with ChatGPT Plus and Claude Pro. This is intentional — it's the "I'm going to try a paid AI tool" price point. Users comfortable paying $20/month for AI are your target market.
- SMART at $99.99 competes with enterprise/pro tiers of other tools. At this price, the user is a committed AI user who demands quality.

### Pricing Page Competitive Framing
- Include a "Compare to alternatives" section on the pricing page.
- Show the cost of subscribing to multiple AI tools vs Stone AI's all-in-one.
- Don't name competitors directly (it legitimizes them). Say "typical AI writing tool: $40/month" rather than "Jasper: $49/month."

---

## 12. Pricing Experiments to Run

### A/B Tests Worth Running

**Test 1: Annual Discount Percentage**
- Control: PRO at 15% annual discount ($170/month).
- Variant A: 17% ($166/month).
- Variant B: 20% ($160/month).
- Metric: Annual plan adoption rate and 12-month revenue per cohort.

**Test 2: Free Trial vs Freemium**
- Control: Current freemium (4 agents forever).
- Variant: 14-day free trial of STARTER, then pay or downgrade.
- Metric: 30-day paid conversion rate.

**Test 3: Promo Structure**
- Control: $9.99 first month.
- Variant A: First month free.
- Variant B: $14.99 for first 3 months.
- Metric: Month-4 retention rate and LTV at 12 months.

**Test 4: Pricing Page Layout**
- Control: All 5 tiers shown.
- Variant: Show 3 tiers (STARTER, PLUS, SMART) with a "see all plans" link for FREE and PRO.
- Metric: Conversion rate and average selected tier.

**Test 5: Price Point**
- Control: PLUS at $49.99.
- Variant: PLUS at $44.99.
- Metric: Conversion rate × price (revenue optimization, not conversion optimization).

### Experiment Principles
- Run one pricing experiment at a time. Pricing changes are Type 1 decisions (hard to reverse) because users anchor to whatever price they first see.
- Sample size matters. Need statistical significance (usually 1,000+ users per variant minimum).
- Measure LTV, not just conversion. A higher conversion rate at a lower price isn't necessarily better. Revenue per user is what matters.
- Grandfather existing users. Never change pricing for current subscribers without advance notice and a clear explanation.

---

## 13. Pricing Psychology Red Flags

### Mistakes to Avoid

**The Race to the Bottom**
- Competing on price in AI is suicide. Compute costs are real. If you price too low, margins evaporate.
- If a competitor prices lower, don't match them. Instead, articulate why you're worth more.

**Too Many Tiers**
- 5 tiers (FREE through PRO) is at the upper limit. More than 5 creates decision paralysis.
- If adding new features, fold them into existing tiers rather than creating new ones.
- The "paradox of choice" — more options = less satisfaction and lower conversion.

**Inconsistent Price Gaps**
- FREE → STARTER: $19.99 gap.
- STARTER → PLUS: $30.00 gap.
- PLUS → SMART: $50.00 gap.
- SMART → PRO: $100.01 gap.
- The increasing gaps are correct — they should increase because each tier jump represents more value. But the increases should feel proportional. A sudden jump (like $50 to $200) would feel wrong.

**Hidden Costs**
- Never add fees after the user has seen a price. No "processing fees," no "platform fees," no surprises.
- The price on the pricing page is the price they pay. Period.

**Discounting Too Frequently**
- If you run promos constantly, users learn to wait for the next promo. You train them to be price-sensitive.
- Promos should be rare, time-limited, and tied to specific events (launch, Black Friday, anniversary).

---

## 14. Pricing Communication Templates

### For Upgrade Prompts (In-App)
```
You're on STARTER with 16 agents.
PLUS gives you 30 agents — including [specific agent relevant to their recent query].
Just $30 more per month. That's $1/day for 14 additional specialists.
[Upgrade to PLUS →]
```

### For Annual Plan Nudge
```
You've been on SMART monthly for 3 months — that's $299.97 so far.
Annual billing would have saved you $60 already.
Switch to annual and save $240 this year.
[Switch to Annual →]
```

### For Win-Back (Cancelled Users)
```
We miss you at Stone AI.
Since you left, we've added [new feature/agent].
Come back with 50% off your first month.
[Resubscribe →]
```

### For Pricing Page Headline
```
44 AI Agents. One Subscription.
Stop juggling AI tools. Get specialists for everything — writing, coding, research, strategy, and more.
Plans start at $0. Seriously.
```

### For Objection Handling: "ChatGPT is free"
```
ChatGPT is one brain that tries to do everything.
Stone AI is 44 specialists, each trained for a specific job.
Would you rather have one generalist doctor or a team of specialists?
FREE tier: try 4 agents, no credit card needed.
```

---

## 15. Quick Reference: Stone AI Pricing Architecture

| Tier | Monthly | Annual/mo | Agents | Model | Annual Discount | Per-Agent Cost |
|------|---------|-----------|--------|-------|-----------------|----------------|
| FREE | $0 | — | 4 | Local Qwen | — | $0 |
| STARTER | $19.99 | — | 16 | Local Qwen | — | $1.25 |
| PLUS | $49.99 | — | 30 | Local Qwen | — | $1.67 |
| SMART | $99.99 | $79.99 | 39 | Cloud Claude Sonnet | 20% | $2.56 (mo) / $2.05 (ann) |
| PRO | $200 | $170 | 42 | Cloud Claude Sonnet | 15% | $4.76 (mo) / $4.05 (ann) |

**Note**: 42 agents are public-facing. Agent #43 (Stone internal) and Agent #44 (Chaos, founder-exclusive) are not part of the tier structure.

### Key Pricing Principles Summary
1. PRO anchors the page — makes SMART feel reasonable.
2. STARTER is a decoy that pushes users toward PLUS.
3. SMART is the true target tier for serious users.
4. Annual discounts should be 17-20% — consider adjusting PRO from 15% to 17-18%.
5. $9.99 first month creates reference price risk — mitigate with transparent communication.
6. Always show monthly prices. Always frame savings positively.
7. Never compete on price. Compete on specialist depth and agent quality.
8. Monitor ARPU, LTV, and cohort retention by tier to validate pricing decisions.
