# Decision Frameworks (Deep) — Complete Knowledge Seed

## Purpose
This document contains operationalized decision frameworks for business problems. Not textbook theory — practical application to running Stone AI. Every framework includes the "how," not just the "what."

---

## 1. OODA Loop — Operationalized

### What OODA Actually Is
OODA = Observe, Orient, Decide, Act. Developed by military strategist John Boyd. The principle: the entity that cycles through OODA fastest wins.

### OODA for Business Decisions

**Observe: Gather Raw Data**
Not "look at dashboards" — actively hunt for signals.
- What are users doing? (Usage analytics, session data, feature adoption.)
- What are users saying? (Support tickets, Forum posts, exit surveys.)
- What are competitors doing? (Feature launches, pricing changes, marketing campaigns.)
- What's changing in the environment? (AI model improvements, market shifts, regulation.)

**Operationalized Observe for Stone AI:**
- Daily: Check engagement scores, new signups, churn events.
- Weekly: Review support tickets for patterns. Check competitor websites.
- Monthly: Aggregate exit survey data. Review cohort retention curves.
- The mistake: Observing only what confirms your existing beliefs. Force yourself to look at disconfirming data.

**Orient: Make Sense of the Data**
This is the critical step — where most people fail. Raw data means nothing without interpretation.
- What does this data mean in context?
- What are the second-order effects?
- What assumptions am I making?
- How does this connect to other data points?

**Operationalized Orient for Stone AI:**
- "Churn increased 2% this month." Orient: Is this one bad cohort or a systemic issue? Did we ship something broken? Did a competitor launch something? Is it seasonal?
- "A user asked for feature X." Orient: Is this one person or a pattern? Does it align with our strategy? Would building it serve our OMTM?
- Framework for orienting: "This happened. What are 3 possible explanations? Which explanation is most supported by other data?"

**Decide: Choose a Course of Action**
Make the decision explicitly. Write it down. Include the reasoning.
- What are we going to do?
- Why this option over alternatives?
- What would change this decision?
- When will we evaluate whether it worked?

**Operationalized Decide for Stone AI:**
- Decision format: "[Date] — Decision: [X]. Reasoning: [Y]. Alternatives considered: [Z]. Revisit date: [date]."
- Don't decide by committee. The founder decides. Agents inform.
- Speed > perfection for Type 2 (reversible) decisions. Deliberation for Type 1 (irreversible).

**Act: Execute**
Do the thing. Don't half-act. Don't plan to act. Act.
- Deploy the change.
- Run the experiment.
- Send the email.
- Ship the feature.

**Operationalized Act for Stone AI:**
- Action has a deadline. "Ship by Friday" not "ship soon."
- Action has an owner. "Agent X builds this" not "someone should handle this."
- Action has a success metric. "Activation rate increases from 40% to 50%" not "onboarding gets better."

### OODA Speed
The competitive advantage isn't making better decisions — it's making decisions faster and correcting course sooner.
- A founder who cycles OODA weekly beats a corporation cycling monthly.
- A solo founder can OODA daily on small decisions.
- Speed of the loop matters more than perfection at any single stage.

### OODA Failures
- **Observation paralysis**: Gathering data forever, never moving to Orient.
- **Orientation bias**: Interpreting all data to confirm existing beliefs.
- **Decision avoidance**: Identifying the options but not choosing.
- **Action delay**: Deciding but not executing.
- **No loop**: Acting but never looping back to Observe to see if it worked.

---

## 2. First Principles Thinking

### The Method
1. Identify the problem or question.
2. Strip away all assumptions, conventions, and "how it's usually done."
3. Identify the fundamental truths — things you know for certain.
4. Rebuild the solution from those truths.

### First Principles Applied to Stone AI Pricing

**Conventional Thinking**: "SaaS products have 3-5 tiers. We should have 3-5 tiers."

**First Principles Analysis**:
- Fundamental truth 1: Users have different willingness to pay.
- Fundamental truth 2: More agents cost more to serve (compute, maintenance).
- Fundamental truth 3: Users value specialist quality more than agent count.
- Fundamental truth 4: Users hate feeling restricted.
- Fundamental truth 5: Revenue needs to exceed costs with margin.

**Rebuilt from fundamentals**: We need enough tiers to capture different willingness-to-pay levels, priced to cover increasing costs, with the tier structure emphasizing quality progression (not just quantity), while making each tier feel generous rather than restrictive.

Result: Current 5-tier model (FREE through PRO) — but the reasoning is grounded in fundamentals, not convention.

### First Principles Applied to Agent Strategy

**Conventional Thinking**: "More agents = better product."

**First Principles Analysis**:
- Truth 1: Users hire agents to solve problems.
- Truth 2: An agent that solves the problem well is valuable regardless of how many other agents exist.
- Truth 3: Agent quality is determined by system prompt quality, not model alone.
- Truth 4: Maintaining more agents costs more (prompt updates, testing, quality assurance).
- Truth 5: Users can only use one agent at a time.

**Rebuilt**: The right number of agents is the number where each one distinctly solves a real problem that others don't, and the cost of maintaining them doesn't outweigh their marginal value. 40 agents is only right if all 44 serve distinct, real jobs. If 10 agents cover 90% of user needs, the other 34 must justify their existence through tier differentiation, not just headcount.

### When to Use First Principles
- When you're stuck (conventional approaches aren't working).
- When making foundational decisions (pricing, architecture, product direction).
- When questioning whether to do something at all (not just how to do it).
- When facing a new problem with no clear precedent.

### When NOT to Use First Principles
- For routine operational decisions (just use process/heuristics).
- When conventional wisdom is clearly correct and proven.
- When speed matters more than optimality.
- First principles is slow. Reserve it for decisions worth the time.

---

## 3. Type 1 vs Type 2 Decisions (Bezos Framework)

### Type 1: One-Way Door
Irreversible or very costly to reverse. Must be made carefully, with full analysis.

**Stone AI Type 1 Decisions:**
- Pricing model (hard to lower prices without upsetting existing users).
- Tech stack choice (migrating databases or frameworks is expensive).
- Public commitments (promises to users about features or pricing).
- Brand positioning (once users know you as X, becoming Y is hard).
- Hiring (bringing on a co-founder or employee is expensive to undo).

**How to handle**: Gather data, consider alternatives, pre-mortem analysis, sleep on it, get external perspective.

### Type 2: Two-Way Door
Reversible. Can be undone without major cost. Should be made fast.

**Stone AI Type 2 Decisions:**
- A/B test variants (just run it, measure, revert if bad).
- Email copy (send a new version next time).
- UI tweaks (ship it, watch metrics, revert if needed).
- New agent addition (add it, remove it if nobody uses it).
- Promo offer (run it, don't run it again if it doesn't work).
- Blog post topic (write it, learn, write a better one next time).

**How to handle**: Decide fast. Act. Observe results. Correct course if needed. Don't spend Type 1 deliberation time on Type 2 decisions.

### The Solo Founder Advantage
Big companies treat every decision as Type 1 (multiple approvals, committee review, risk analysis). Solo founders can correctly identify most decisions as Type 2 and move faster. This is a structural speed advantage. Protect it.

### The Common Mistake
Treating Type 2 decisions as Type 1. This causes:
- Decision paralysis ("What if we pick the wrong CTA button color?").
- Slow execution ("Let's research this UI change for two more weeks").
- Wasted energy ("We need a formal analysis of whether to add dark mode").

If it's reversible, just do it. Ship. Measure. Adjust.

---

## 4. Pre-Mortem Analysis

### The Method
Before starting a project, imagine it has already failed. Ask: "Why did it fail?"

This inverts the usual optimism bias. Instead of imagining success, you identify failure modes in advance and prevent them.

### Pre-Mortem Process
1. State the project/decision clearly.
2. "It's 6 months from now. This project failed completely. Why?"
3. List every possible failure reason (brainstorm freely, no filtering).
4. For each reason, assess: How likely? How severe? Can we prevent it?
5. Mitigate the most likely and most severe failure modes before starting.

### Pre-Mortem Example: Launching Stone AI Tools (tools.stone-ai.net)

**Imagine**: It's 6 months post-launch. Stone AI Tools failed. Why?

Possible failure reasons:
1. **Split focus**: Tools took attention away from core Stone AI product, which degraded.
2. **No demand**: Built tools nobody wanted.
3. **No traffic**: Had great tools but nobody found them.
4. **Cannibalization**: Tools replaced features that should drive Stone AI subscriptions.
5. **Quality**: Rushed tools that were buggy and reflected poorly on the brand.
6. **Revenue**: Couldn't monetize the tools effectively.
7. **Maintenance burden**: 100 tools each needed ongoing updates, overwhelming the solo founder.

Mitigation:
1. Time-box Tools work. Core Stone AI gets 70% of dev time minimum.
2. Validate demand before building. Keyword research, competitor analysis.
3. SEO strategy from day one. Each tool targets a specific search query.
4. Clear boundary: Tools are standalone. They don't replace Stone AI features — they complement.
5. Quality gates: Don't launch until each tool works flawlessly.
6. Revenue model: Ads, affiliate links, or premium versions that funnel into Stone AI.
7. Build simple, maintainable tools. No complex tools that need constant updates.

### When to Pre-Mortem
- Before any project longer than 2 weeks.
- Before any Type 1 decision.
- Before any significant investment of time or money.
- Before launching a new product or major feature.

---

## 5. Sunk Cost Discipline

### The Principle
Sunk costs are money/time/effort already spent. They're gone. They should have ZERO influence on future decisions.

### The Trap
"We've already spent 3 months building this feature — we can't abandon it now."

This is wrong. If the feature isn't going to deliver value, the 3 months are gone regardless. The question is: "From this point forward, is continuing the best use of our time?"

### Sunk Cost Test
When evaluating whether to continue a project:
1. **Ignore everything already invested** (time, money, code, effort).
2. Ask: "If I were starting fresh today, with what I now know, would I start this project?"
3. If yes: continue.
4. If no: stop. The sunk cost is irrelevant.

### Stone AI Sunk Cost Examples

**Scenario**: You've spent 2 weeks building a feature. It's 70% done. But user feedback reveals nobody wants it.
- Sunk cost urge: "We're 70% done! Let's just finish it."
- Correct analysis: "Would we start this today knowing nobody wants it? No. Stop."

**Scenario**: You're invested in a marketing channel that isn't working. You've spent $1,000 and got 5 users.
- Sunk cost urge: "We've already invested $1,000. Let's give it one more month."
- Correct analysis: "The data says $200/user CAC on this channel. Our target is $70. Kill it."

**Scenario**: An agent has poor system prompts. It would take 3 days to rewrite from scratch or 5 days to patch the existing ones.
- Sunk cost urge: "We already wrote these prompts. Let's patch them."
- Correct analysis: "Rewriting from scratch takes 3 days and produces better results. The existing prompts are sunk — their existence doesn't obligate us to keep them."

### Building Sunk Cost Discipline
- Record decisions and their rationale when you make them.
- Review projects quarterly: "If I were starting this today, would I?"
- Set kill criteria in advance: "If this feature doesn't improve metric X by Y% in 30 days, we stop."
- Celebrate kills. Stopping bad projects is a win, not a failure.

---

## 6. Opportunity Cost Quantification

### The Principle
Every choice has an opportunity cost — the value of the best alternative you didn't choose. "What are we NOT doing by doing this?"

### Quantifying Opportunity Cost

**Step 1**: List the top 3-5 things you could do right now.
**Step 2**: Estimate the value each would produce (revenue, retention, capability).
**Step 3**: Choose the highest-value option.
**Step 4**: The value of the second-best option is the opportunity cost of your choice.

### Stone AI Example

**Options this week:**
A. Improve onboarding flow (estimated: +10% activation = ~$500 MRR/month).
B. Build conversation export (estimated: nice-to-have, no direct revenue impact).
C. Fix response speed issue (estimated: +5% retention = ~$300 MRR/month).
D. Write marketing content (estimated: +20 signups/month = ~$200 MRR/month).

**Best option**: A (onboarding, $500/month).
**Opportunity cost of A**: C (response speed, $300/month — the best alternative foregone).
**This means**: Doing A costs us $300/month that we'd get from C. But A still nets us $200/month more than C, so it's the right choice.

### Opportunity Cost of Time
For a solo founder, the scarcest resource is time. Every hour spent on one task is an hour not spent on another.
- If you spend 2 hours on a low-impact admin task, the opportunity cost is 2 hours of high-impact product work.
- Calculate: "What's my highest-value activity per hour? Am I doing that, or something lower-value?"
- The founder should spend 80%+ of time on the highest-leverage activities: product quality, acquisition strategy, and retention.

### Opportunity Cost of Delayed Decisions
Delaying a decision has a cost: the value you'd have created if you decided sooner.
- A pricing change that takes 3 weeks to decide instead of 1 week means 2 weeks of suboptimal pricing.
- A feature fix delayed by 2 weeks of analysis means 2 weeks of users affected by the bug.
- Speed of decision-making is itself a competitive advantage.

---

## 7. Decision Journal

### The Method
Record every significant decision as it's made. Review periodically to learn from patterns.

### Decision Journal Format
```
Date: [Date]
Decision: [What was decided]
Context: [What situation prompted this decision]
Options Considered: [List alternatives]
Chosen Option: [What we're doing]
Reasoning: [Why this option]
Expected Outcome: [What we think will happen]
Type: [Type 1 or Type 2]
Reversibility: [Easy / Moderate / Difficult]
Review Date: [When to evaluate the outcome]
```

### Post-Decision Review Format
```
Original Decision: [Reference]
Actual Outcome: [What happened]
Was the reasoning sound? [Yes / No / Partially]
What did we learn? [Key insight]
Would we make the same decision again? [Yes / No / Modified]
Pattern: [Any recurring pattern this reveals]
```

### Why Decision Journals Work
1. **Reduce hindsight bias.** You recorded your reasoning when you made the decision. You can't retroactively claim you "knew" it wouldn't work.
2. **Identify patterns.** After 20+ entries, patterns emerge: "I consistently underestimate effort." "My pricing instincts are usually right." "I overvalue new features vs optimization."
3. **Improve calibration.** Track how often your expected outcomes match actual outcomes. If you're right 60% of the time, that's your calibration. Work to improve it.
4. **Speed future decisions.** When facing a similar decision, reference past journal entries instead of starting from scratch.

### Decision Review Cadence
- Type 2 decisions: Review after 2-4 weeks.
- Type 1 decisions: Review after 3-6 months.
- Monthly: Scan recent entries for patterns.
- Quarterly: Deep review of all entries from the quarter.

---

## 8. Theory of Constraints Applied to Business

### The Principle
Every system has one constraint (bottleneck) that limits the entire system's output. Improving anything other than the constraint is wasted effort.

### Finding the Constraint in Stone AI

At any point, ONE of these is the bottleneck:
1. **Acquisition**: Not enough people signing up.
2. **Activation**: Signups aren't becoming active users.
3. **Retention**: Active users aren't staying.
4. **Revenue**: Active users aren't paying (or paying enough).
5. **Referral**: Users aren't spreading the word.

### How to Identify the Current Constraint
- If signups are low but conversion is high → Acquisition is the constraint.
- If signups are high but activation is low → Activation is the constraint.
- If activation is high but Day 30 retention is low → Retention is the constraint.
- If retention is high but revenue per user is low → Revenue is the constraint.
- If everything works but growth is slow → Referral is the constraint.

### The Five Focusing Steps
1. **Identify** the constraint.
2. **Exploit** the constraint (maximize its output with existing resources).
3. **Subordinate** everything else to the constraint (other activities support the bottleneck).
4. **Elevate** the constraint (invest to increase its capacity).
5. **Repeat** (once this constraint is broken, a new one appears).

### Example: Activation Is the Constraint
1. **Identify**: 60% of signups never send a message. Activation is the constraint.
2. **Exploit**: Improve the first-screen experience without building new features. Better copy, conversation starters, faster loading.
3. **Subordinate**: Stop all non-activation work. Marketing? Keep it going but don't increase spend (more signups into a broken activation funnel wastes money). New features? Only if they directly improve activation.
4. **Elevate**: Invest in a redesigned onboarding flow, personalized first experience, A/B testing framework.
5. **Repeat**: Activation hits 70%. Now retention is the constraint. Shift focus.

---

## 9. Inversion

### The Method
Instead of asking "How do I succeed?" ask "How would I guarantee failure?" Then avoid those things.

### Inversion Applied to Stone AI

**Question**: "How do we make Stone AI succeed?"

**Inverted**: "How would we guarantee Stone AI fails?"
1. Ship buggy, unreliable agents that give bad answers.
2. Make onboarding confusing and slow.
3. Ignore user feedback.
4. Compete on price instead of quality.
5. Build features nobody asked for while ignoring ones they need.
6. Let churn run unchecked.
7. Spread focus across too many projects simultaneously.
8. Neglect security until a breach happens.
9. Copy competitors instead of differentiating.
10. Burn out the solo founder by working on everything without prioritization.

**Prevention**: Do the opposite of each failure mode.
1. Agent quality is priority #1. Always.
2. Onboarding optimization is continuous.
3. User feedback loops into product decisions.
4. Compete on specialist depth and agent quality.
5. Feature prioritization frameworks (RICE, ICE, Kano).
6. Dunning, engagement scoring, churn prediction.
7. OMTM focus. Sequential, not simultaneous.
8. Security is non-negotiable (Zod strict, AES-256, CSP, audit logs).
9. Build the unique — Bestie, 40 agents, ecosystem.
10. Founder energy management is a business-critical asset.

### When to Use Inversion
- When brainstorming strategy (what NOT to do is as useful as what to do).
- When evaluating risks (invert success criteria to find failure modes).
- When stuck (if you can't figure out how to succeed, figure out how to not fail).
- During pre-mortems (inversion is a pre-mortem tool).

---

## 10. Decision Framework Selection Guide

### Which Framework for Which Situation?

| Situation | Framework | Why |
|-----------|-----------|-----|
| Competitive response | OODA Loop | Speed matters most |
| Foundational strategy | First Principles | Strip assumptions |
| Quick operational choice | Type 1/Type 2 Classification | Avoid over-analyzing |
| New project kick-off | Pre-Mortem | Prevent failure modes |
| Feature vs feature | Evaluate with kill criteria | Sunk cost discipline |
| Resource allocation | Opportunity Cost | Compare alternatives |
| Learning from past | Decision Journal | Pattern recognition |
| Finding the bottleneck | Theory of Constraints | Focus on what matters |
| Risk assessment | Inversion | Find failure modes |
| Recurring decision fatigue | Decision Rules (pre-made) | Reduce cognitive load |

### The Meta-Decision
If you're not sure which framework to use, default to:
1. Classify as Type 1 or Type 2.
2. If Type 2: decide in 5 minutes, act, observe.
3. If Type 1: use First Principles + Pre-Mortem. Record in Decision Journal.

---

## 11. Decision Fatigue Management

### The Problem
The average founder makes 30-50 meaningful decisions per day. After ~30, quality degrades. This is decision fatigue — the deterioration of decision quality after a long session of decision-making.

### Mitigation Strategies

**Reduce Decisions**
- Create rules that eliminate recurring decisions. "All A/B tests run for 2 weeks minimum" = no more deciding how long to run each test.
- Automate what can be automated. Dunning retries, email sequences, engagement scoring — set it up once, stop deciding.
- Have defaults for everything. "If in doubt, the answer is [X]."

**Batch Similar Decisions**
- Group similar decisions together. All pricing decisions on Monday. All feature decisions on Wednesday. All marketing decisions on Friday.
- Context-switching between different types of decisions is expensive. Batching reduces the switching cost.

**Delegate Low-Stakes Decisions**
- Agents handle implementation decisions. The founder handles strategic decisions.
- If a decision doesn't affect strategy, revenue, or user experience materially → delegate.
- The Three-Headed Monster structure exists for this: Stone handles strategy, Cardinal handles intelligence, Chaos handles infrastructure. The founder decides direction; the heads execute.

**Protect Peak Decision Hours**
- Most people make the best decisions in the morning (first 4 hours after waking).
- Schedule important decisions early. Save routine work for afternoon.
- Never make Type 1 decisions when tired, hungry, or stressed.

**Decision Rules (Pre-Made)**
Create if/then rules that eliminate in-the-moment decision-making:
- "If churn exceeds 7% for 2 months → stop growth spending, fix retention."
- "If a bug affects paying users → fix within 24 hours, no exceptions."
- "If LTV:CAC drops below 3:1 → reduce acquisition spending by 50%."
- "If an agent receives 3+ negative feedback reports → rewrite system prompt within 1 week."

These rules convert recurring decisions into automatic responses.
