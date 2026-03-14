# Cognitive Bias Catalog

## Why Biases Matter for AI Systems

Cognitive biases are systematic patterns of deviation from rational judgment. They affect humans, organizations, and — critically — AI systems that learn from human data and interact with human users. An AI agent must understand biases for three reasons:

1. **Detecting biases in user reasoning**: Users often make decisions influenced by biases. A good agent gently corrects or at least doesn't amplify these errors.
2. **Avoiding biases in its own outputs**: AI systems can reproduce and even amplify biases present in their training data and reasoning patterns.
3. **Understanding organizational biases**: When advising on business decisions, recognizing institutional cognitive biases enables better recommendations.

## Decision-Making Biases

### Anchoring Effect
**What it is**: Over-relying on the first piece of information encountered when making decisions.

**Example**: A user sees that a competitor charges $299/month. Now all their pricing discussions revolve around that anchor, even if the value proposition is completely different. The competitor's price has zero logical bearing on what Stone AI should charge, but psychologically it dominates the conversation.

**In AI outputs**: If an agent retrieves a number early in its reasoning chain, that number can disproportionately influence the final output. Retrieval order becomes an implicit anchor.

**Debiasing**: Generate your estimate BEFORE looking at external anchors. Consider the problem from first principles. Ask: "If I hadn't seen that number, what would I think?"

### Availability Heuristic
**What it is**: Judging the likelihood of events based on how easily examples come to mind, rather than actual frequency.

**Example**: After a highly publicized data breach, a founder might massively overweight security spending relative to other risks that are statistically more likely to kill the business (like running out of cash or building the wrong product).

**In AI outputs**: An agent trained on data where certain examples are overrepresented will overweight those scenarios. If the training data has many discussions about React, the agent may default to React solutions even when it's not the best fit.

**Debiasing**: Always check base rates. Ask: "How common is this actually?" rather than "Can I think of examples?"

### Confirmation Bias
**What it is**: Seeking, interpreting, and remembering information that confirms pre-existing beliefs while ignoring contradictory evidence.

**Example**: A product manager believes users want a certain feature. They selectively quote positive user feedback and dismiss negative feedback as "edge cases" or "they didn't understand the feature."

**In AI outputs**: If an agent is asked to support a decision, it may cherry-pick evidence that supports the user's stated preference. Worse, if the agent has a "hypothesis" formed early in reasoning, it may selectively attend to confirming evidence.

**Debiasing**: Actively seek disconfirming evidence. For every supporting fact, find one opposing fact. Steel-man the opposing view before concluding. Ask: "What would change my mind?"

### Sunk Cost Fallacy
**What it is**: Continuing to invest in something because of previously invested resources (time, money, effort) rather than evaluating future costs and benefits.

**Example**: "We've spent 6 months building this feature, we can't just throw it away." The 6 months are gone regardless — the only relevant question is whether completing the feature will generate more value than alternative uses of the remaining time.

**In AI outputs**: An agent might recommend continuing a failing approach because "we've already invested in this direction." Rational analysis considers only future costs and benefits.

**Debiasing**: Frame decisions as: "Starting from today, what's the best use of our resources?" The past is irrelevant to future optimization.

### Loss Aversion
**What it is**: Losses feel roughly twice as painful as equivalent gains feel pleasurable. People will take irrational risks to avoid losses.

**Example**: A business won't raise prices by $10/month (potential loss of customers) even though analysis shows the revenue gain far exceeds the churn cost. The fear of losing existing customers outweighs the rational expectation of higher total revenue.

**In AI outputs**: Recommendations framed as "avoiding losses" will be taken more seriously than identical recommendations framed as "capturing gains." An agent should be aware of this asymmetry and use it ethically.

**Debiasing**: Reframe decisions in both gain and loss terms. Ask: "What am I losing by NOT doing this?" (the opportunity cost of inaction).

### Status Quo Bias
**What it is**: Preferring the current state of affairs simply because it's current, independent of whether it's optimal.

**Example**: Keeping a suboptimal tech stack because "it's what we know" rather than evaluating whether a migration would provide net benefits over a relevant time horizon.

**In AI outputs**: An agent might default to suggesting approaches consistent with current practices rather than genuinely evaluating alternatives.

**Debiasing**: Imagine you're starting from scratch. Would you choose the current approach? If not, the switching cost is the only relevant consideration — not the comfort of the status quo.

### Framing Effect
**What it is**: Drawing different conclusions from the same information depending on how it's presented.

**Example**: "This feature has a 90% satisfaction rate" vs "This feature has a 10% dissatisfaction rate" — same data, different emotional impact and likely different decisions.

**In AI outputs**: How an agent frames its responses materially affects user decisions. Agents must be aware that framing is never neutral and should present information in the most balanced way possible.

**Debiasing**: Present information in multiple frames. Show both the positive and negative framing. Let the user make the decision with balanced information.

## Social and Group Biases

### Bandwagon Effect
**What it is**: Adopting beliefs or behaviors because many others have, regardless of underlying evidence.

**Example**: "Everyone is using microservices, so we should too." The popularity of an approach says nothing about whether it's right for a specific context.

**In AI outputs**: If an agent's training data reflects popular opinions, its recommendations will skew toward trendy approaches rather than contextually appropriate ones.

**Debiasing**: Evaluate the merits independent of popularity. Ask: "Why is this popular? Do those reasons apply to us?"

### Groupthink
**What it is**: A group's desire for harmony and conformity overrides realistic appraisal of alternatives.

**Example**: A team unanimously agrees on a feature direction without anyone raising concerns, because dissent feels socially costly. The feature ships and fails because nobody voiced obvious objections.

**In organizational AI**: AI agents that always agree with the user or the team are enabling groupthink. A well-designed agent should play devil's advocate when stakes are high.

**Debiasing**: Assign a designated dissenter. Encourage anonymous feedback. Explicitly ask: "What could go wrong? Who disagrees and why?"

### Authority Bias
**What it is**: Over-weighting the opinions of perceived authority figures regardless of their actual expertise on the specific topic.

**Example**: A renowned AI researcher gives a business opinion, and it's treated as gospel — even though research expertise doesn't transfer to business strategy.

**In AI outputs**: Users may over-trust AI outputs because they perceive the AI as an authority. Agents should calibrate confidence appropriately and not exploit this trust.

**Debiasing**: Evaluate arguments on their merits, not their source. Ask: "Is this person/system an authority on THIS specific question?"

### In-Group Bias
**What it is**: Favoring members of one's own group over outsiders.

**Example**: Dismissing user feedback from free-tier users while over-weighting feedback from paying users, even when the free-tier feedback identifies a genuine universal problem.

**In AI outputs**: If training data overrepresents certain demographic or user groups, the AI's recommendations will implicitly favor those groups.

**Debiasing**: Explicitly seek input from diverse sources. Weight feedback by its informational content, not its source group.

### Halo Effect
**What it is**: The tendency to let an overall positive impression of a person or thing influence evaluation of their specific traits.

**Example**: A well-designed landing page makes users assume the product itself is high quality, even before using it. Conversely, a beautiful product with poor UX gets extended patience because "it looks professional."

**In AI outputs**: An agent that writes eloquently may be trusted more than one that writes plainly, even if the plain-spoken agent is more accurate.

**Debiasing**: Evaluate each dimension independently. Attractive design doesn't equal good functionality. Eloquent writing doesn't equal correct analysis.

## Memory and Perception Biases

### Recency Bias
**What it is**: Over-weighting recent events relative to earlier ones.

**Example**: After a week of strong signups, projecting that growth will continue at the same rate, ignoring months of slower growth that represent the true baseline.

**In AI outputs**: If an agent gives more weight to recent conversation context over earlier established facts, it can drift from accurate understanding.

**Debiasing**: Look at the full time series, not just the recent tail. Ask: "Is this a trend or a fluctuation?"

### Survivorship Bias
**What it is**: Drawing conclusions only from examples that "survived" some selection process, ignoring the unseen failures.

**Example**: "All successful startups pivoted, so pivoting is the path to success." You're only looking at startups that succeeded. The vast majority that pivoted also failed — they're just invisible.

**In AI outputs**: If training data overrepresents successful outcomes (published case studies, success stories), the agent will recommend strategies with inflated success probabilities.

**Debiasing**: Actively seek out the failures. For every success story, ask: "How many tried this and failed?" Look for the silent majority.

### Dunning-Kruger Effect
**What it is**: Unskilled individuals overestimate their competence, while skilled individuals underestimate theirs.

**Example**: A user with basic coding knowledge may be overconfident about architectural decisions. A user with deep expertise may unnecessarily defer to the AI on topics they understand better.

**In AI outputs**: An AI system may be most confident on topics where its training is thinnest (because it hasn't encountered enough counterexamples to develop uncertainty) and least confident on well-trodden ground (where it's seen many conflicting perspectives).

**Debiasing**: Calibration — tracking prediction accuracy by domain. Metacognitive awareness: "How much do I actually know about this specific topic?"

### Hindsight Bias
**What it is**: After learning an outcome, believing you "knew it all along." The past seems more predictable than it actually was.

**Example**: "Obviously that marketing campaign was going to fail — the messaging was all wrong." If it were obvious, why was it approved and funded?

**In AI outputs**: When analyzing past decisions, agents may present the outcome as inevitable, which is misleading. The decision was made under uncertainty and should be evaluated based on the information available at the time.

**Debiasing**: Evaluate decisions based on the process and information available at decision time, not the outcome. A good decision with a bad outcome is still a good decision.

### Peak-End Rule
**What it is**: People judge experiences primarily by their peak (most intense point) and their end, rather than the total experience.

**Example**: A user has 20 great interactions with an agent and one terrible one. Their overall impression is dominated by the terrible one (the peak negative) and their most recent interaction (the end).

**In AI outputs**: Design for strong endings and avoid negative peaks. A mediocre average with no disasters and a strong finish is perceived better than a great average with one catastrophe.

**Debiasing**: Awareness that peak and end moments are disproportionately influential. Allocate extra quality assurance to potential peak moments and closing interactions.

## Estimation and Probability Biases

### Overconfidence Bias
**What it is**: Systematic tendency to be more confident in judgments than accuracy warrants. The most pervasive and dangerous bias.

**Example**: "I'm 95% sure this will work" from someone with a 60% track record. People's 90% confidence intervals contain the true answer only about 50% of the time.

**In AI outputs**: AI systems can inherit overconfidence from their training data. When an agent says "this will definitely work," it should actually say "based on available evidence, this is the most likely approach to succeed."

**Debiasing**: Track calibration. Practice expressing uncertainty as ranges. Use pre-mortems to surface failure modes.

### Neglect of Probability
**What it is**: Ignoring probabilities when evaluating uncertain outcomes, treating all possible outcomes as equally likely or focusing only on the best/worst case.

**Example**: Buying lottery tickets (ignoring the tiny probability of winning) or refusing to fly (ignoring the minuscule probability of a crash). Both are responses to outcomes rather than expected values.

**In AI outputs**: When presenting options, agents should include probability estimates, not just possible outcomes. "This could 10x your revenue" without "with a 2% probability" is misleading.

**Debiasing**: Always pair outcomes with probabilities. Compute expected values. Compare against base rates.

### Planning Fallacy
**What it is**: Underestimating the time, cost, and risk of future actions while overestimating their benefits.

**Example**: "This feature will take 2 weeks" — it takes 6. "This marketing campaign will 3x our signups" — it increases them 15%.

**In AI outputs**: When helping estimate timelines or outcomes, agents should explicitly adjust for the planning fallacy. Historical data on similar tasks is a much better predictor than bottom-up estimation.

**Debiasing**: Use reference class forecasting. Look at how long similar things actually took, not how long you think this one should take. Add 50-100% buffers for novel work.

### Gambler's Fallacy
**What it is**: Believing that past independent events affect the probability of future independent events.

**Example**: "We've had 3 failed deploys in a row, so the next one is bound to succeed." Each deploy is independent — past failures don't make future success more likely (unless you've fixed the underlying cause).

**In AI outputs**: When analyzing patterns, agents must distinguish between genuinely correlated events and independent events that happen to form apparent patterns.

**Debiasing**: Ask: "Is there a causal mechanism connecting these events, or am I seeing a pattern in randomness?"

### Conjunction Fallacy
**What it is**: Judging the probability of two events occurring together as higher than the probability of either event alone. P(A and B) cannot exceed P(A) or P(B).

**Example**: "This user is a tech-savvy millennial who loves AI" seems more probable than "This user loves AI" because the specific story is more vivid. But the specific story is necessarily less probable.

**In AI outputs**: When building user personas or predicting scenarios, agents should check that joint probability estimates don't exceed individual probabilities.

**Debiasing**: Decompose complex predictions into independent components and multiply probabilities (if independent) or use appropriate conditional probabilities.

## AI-Specific Bias Patterns

### Automation Bias
**What it is**: Over-trusting automated systems and under-scrutinizing their outputs.

**Example**: A user accepts an AI-generated business strategy without critical evaluation because "the AI analyzed the data." The data might be incomplete, the analysis might have errors, and the recommendation might not account for context only the human knows.

**Mitigation for agents**: Agents should actively invite scrutiny. "Here's my analysis — what am I missing from your perspective?" rather than presenting conclusions as definitive.

### Training Data Bias
**What it is**: AI systems reflect and amplify biases present in their training data.

**Example**: If customer service training data overrepresents complaints from certain demographics, the AI may develop skewed models of what "typical" problems look like.

**Mitigation for agents**: Be aware that your knowledge is shaped by what you've been exposed to. Explicitly flag when your recommendation might be biased by overrepresentation of certain perspectives.

### Automation Complacency
**What it is**: Reduced vigilance when monitoring automated systems that usually work correctly.

**Example**: A billing system that correctly processes 99.9% of transactions. The 0.1% errors accumulate unnoticed because humans stop checking.

**Mitigation for agents**: Build in regular auditing suggestions. Don't assume that systems working correctly now will continue to do so indefinitely.

### Amplification Bias
**What it is**: AI systems can amplify small biases in training data into large biases in outputs through feedback loops.

**Example**: If an agent slightly favors recommending premium features, users who follow those recommendations generate training data that further reinforces premium recommendations. Over time, the small bias becomes a large one.

**Mitigation for agents**: Monitor recommendation distributions over time. If outputs are becoming less diverse or increasingly skewed in one direction, something is amplifying.

## Organizational Biases

### Not Invented Here Syndrome
**What it is**: Rejecting ideas, products, or solutions that originated outside the organization.

**Example**: Building a custom solution instead of using a well-tested library because "we need something tailored to our needs" — when the library would have covered 95% of requirements at 10% of the cost.

### IKEA Effect
**What it is**: Overvaluing things you've built or participated in creating.

**Example**: A team that spent 3 months building an internal tool values it more than a commercial product that objectively outperforms it. The labor creates emotional attachment that distorts evaluation.

### Institutional Inertia
**What it is**: Organizations resist change proportionally to their size and age, regardless of whether change is beneficial.

**Example**: "We've always done it this way" as a justification for continued use of outdated processes. The fact that something worked in the past is not evidence that it's optimal now.

### Metric Fixation
**What it is**: When metrics become targets, they cease to be good metrics (Goodhart's Law). Organizations optimize for the measure rather than the underlying goal.

**Example**: Optimizing for user signups (the metric) rather than user value delivered (the goal). You can juice signups with misleading marketing, but that doesn't create a sustainable business.

## Master Debiasing Techniques

### Pre-Mortem Analysis
Before committing to a decision, imagine it has already failed. Ask: "It's 6 months from now and this failed completely. Why?" This surfaces risks that optimism bias would otherwise suppress.

### Consider the Opposite
For any conclusion you've reached, spend 5 minutes building the strongest possible case for the opposite conclusion. If the opposite case is easy to build, your original conclusion may be less solid than you think.

### Reference Class Forecasting
Instead of estimating from the inside (how long should this take?), estimate from the outside (how long do things like this actually take?). Inside view is optimistic; outside view is calibrated.

### Red Team / Blue Team
Assign one group to defend a decision and another to attack it. The adversarial dynamic surfaces weaknesses that consensual processes miss.

### Decision Journaling
Record the rationale, expected outcomes, and confidence levels for important decisions. Review periodically. This builds calibration and prevents hindsight bias.

### Scenario Planning
Don't plan for one future — plan for several. What's the best case? Worst case? Most likely case? What's the scenario we haven't considered?

### Structured Analytic Techniques
Use formal methods like Analysis of Competing Hypotheses (ACH): list all hypotheses, list all evidence, evaluate how each piece of evidence supports or contradicts each hypothesis. This prevents confirmation bias by forcing consideration of all evidence against all hypotheses.

## Integration: The Bias-Aware Agent

A bias-aware agent operates with these principles:

1. **Assume biases are present** — in user reasoning, in your own outputs, in organizational culture. The question isn't whether biases exist but which ones are active.

2. **Name biases when relevant** — "This might be influenced by sunk cost thinking" is a powerful intervention that helps users make better decisions.

3. **Structure recommendations to counteract common biases** — Present both sides, include base rates, flag uncertainty, invite disagreement.

4. **Monitor your own outputs for bias patterns** — Are you consistently recommending certain approaches? Are your confidence levels calibrated? Are you presenting balanced information?

5. **Treat debiasing as a continuous process** — You can't eliminate biases, only manage them. Every decision is an opportunity to notice and correct for systematic errors in thinking.

The catalog above is not exhaustive — researchers have identified over 180 cognitive biases. But the ones listed here are the most relevant for AI-assisted business decision-making. An agent that can recognize, name, and help mitigate even half of these biases will dramatically improve the quality of decisions made with its assistance.
