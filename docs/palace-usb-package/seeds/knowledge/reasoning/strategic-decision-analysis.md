# Strategic Decision Analysis

> Cardinal Seed — Intelligence Architecture
> Classification: Decision Science / Strategic Analysis
> Operates independently on OMEN without cloud dependencies

---

## Purpose

Every strategic decision carries uncertainty. The founder faces choices where the right answer depends on unknowable futures, incomplete information, and complex tradeoffs. Cardinal's job is not to make decisions — that is the founder's prerogative — but to structure decisions so the founder can see ALL options, ALL risks, and ALL second-order effects before committing.

This seed provides the complete toolkit for rigorous decision analysis.

---

## 1. Decision Matrices

### Simple Weighted Decision Matrix

When choosing between multiple options on multiple criteria:

**Step 1: Define Options**
List all viable options (typically 3-7). Include "do nothing" as an option.

**Step 2: Define Criteria**
List the factors that matter for this decision. Common strategic criteria:
- Revenue impact (short-term and long-term)
- Cost (upfront and ongoing)
- Time to implement
- Risk level
- Strategic alignment
- Competitive advantage
- Reversibility
- Team capability match

**Step 3: Weight Criteria**
Not all criteria matter equally. Assign weights that sum to 100%:

| Criteria | Weight |
|----------|--------|
| Revenue impact | 25% |
| Strategic alignment | 20% |
| Competitive advantage | 20% |
| Cost | 15% |
| Time to implement | 10% |
| Risk level | 10% |
| **Total** | **100%** |

**Step 4: Score Each Option**
Rate each option on each criterion (1-10 scale):

| Criteria (Weight) | Option A | Option B | Option C | Do Nothing |
|-------------------|----------|----------|----------|------------|
| Revenue (25%) | 8 | 6 | 9 | 3 |
| Strategy (20%) | 7 | 9 | 5 | 4 |
| Competitive (20%) | 6 | 8 | 7 | 2 |
| Cost (15%) | 4 | 7 | 3 | 10 |
| Time (10%) | 5 | 8 | 3 | 10 |
| Risk (10%) | 6 | 7 | 4 | 8 |
| **Weighted Score** | **6.35** | **7.45** | **5.80** | **5.05** |

**Step 5: Sensitivity Test**
- What if revenue weight was 35% instead of 25%? Does the ranking change?
- What if our cost estimate for Option C is wrong by 50%?
- What if we're overrating Option B's strategic alignment?

If small changes in weights or scores flip the ranking, the decision is CLOSE and requires deeper analysis.

### Pairwise Comparison Matrix

When criteria are hard to weight directly, compare them in pairs:

"Is revenue impact more or less important than strategic alignment for THIS decision?"

| vs | Revenue | Strategy | Competitive | Cost | Time | Risk |
|----|---------|----------|-------------|------|------|------|
| Revenue | — | Revenue | Revenue | Revenue | Revenue | Revenue |
| Strategy | | — | Strategy | Strategy | Strategy | Strategy |
| Competitive | | | — | Competitive | Competitive | Competitive |
| Cost | | | | — | Cost | Cost |
| Time | | | | | — | Time |
| Risk | | | | | | — |

Count wins: Revenue=5, Strategy=4, Competitive=3, Cost=2, Time=1, Risk=0
Normalize to weights: Revenue=33%, Strategy=27%, Competitive=20%, Cost=13%, Time=7%, Risk=0%

This forces you to confront tradeoffs directly rather than assigning weights in the abstract.

---

## 2. Expected Value Calculations

### Basic Expected Value

Expected Value (EV) = Sum of (Probability × Outcome) for each possible result.

**Example**: Should we invest $50K in a new feature?

| Outcome | Probability | Revenue Impact | Net Value |
|---------|-------------|---------------|-----------|
| Big success | 20% | +$300K | +$250K |
| Moderate success | 40% | +$100K | +$50K |
| Break even | 25% | +$50K | $0 |
| Failure | 15% | +$0 | -$50K |

**EV** = (0.20 × $250K) + (0.40 × $50K) + (0.25 × $0) + (0.15 × -$50K)
**EV** = $50K + $20K + $0 + (-$7.5K) = **+$62.5K**

Positive EV = the bet is favorable on average. But EV alone is insufficient for strategic decisions because it ignores:
- **Variance**: How much could the actual outcome deviate?
- **Ruin risk**: Could the downside outcome kill the company?
- **Opportunity cost**: What else could we do with $50K?
- **Asymmetry**: Is the upside/downside symmetric?

### Expected Value with Asymmetric Outcomes

Some decisions have asymmetric payoff profiles:

**Type 1: Capped downside, uncapped upside** (convex bets)
- Example: Investing in a new market. You can lose at most your investment, but upside is theoretically unlimited.
- Strategy: Make MANY of these bets. Even if most fail, the winners more than compensate.

**Type 2: Uncapped downside, capped upside** (concave bets)
- Example: Cutting corners on security to ship faster. Best case saves a few weeks. Worst case is a data breach.
- Strategy: AVOID these bets. The math is against you.

**Type 3: Binary outcomes** (all or nothing)
- Example: Regulatory approval — you either get it or you don't.
- Strategy: Focus on maximizing probability of the good outcome.

### Kelly Criterion (Simplified)

For sizing bets (how much to invest), the Kelly Criterion provides a mathematical optimum:

**Kelly % = (bp - q) / b**

Where:
- b = odds received (payoff ratio: what you win / what you risk)
- p = probability of winning
- q = probability of losing (1 - p)

**Example**: Investment with 60% chance of 3x return, 40% chance of total loss.
- b = 3 (win 3x what you risk)
- p = 0.6
- q = 0.4

Kelly % = (3 × 0.6 - 0.4) / 3 = 1.4/3 = **46.7%**

**In practice**: Use HALF Kelly (23.3%) for safety. The full Kelly is optimal only with perfect probability estimates — which we never have.

**What Kelly tells the founder**: Don't bet the farm on any single opportunity, no matter how good the odds look. Size bets proportional to your edge and your bankroll.

---

## 3. Real Options Analysis

### Concept

Real options applies financial options theory to strategic decisions. A "real option" is the right — but not the obligation — to take a future action.

### Types of Real Options

**Option to Defer**
- Value: Wait for more information before committing
- Cost: Potential first-mover disadvantage
- Example: Don't build enterprise features yet. Wait 6 months to see if enterprise demand materializes.
- When valuable: High uncertainty, high irreversibility, information is arriving

**Option to Stage**
- Value: Break a big investment into phases with go/no-go gates
- Cost: Slightly higher total cost than doing it all at once
- Example: Phase 1: Build MVP for $20K. If metrics hit targets, Phase 2: Scale for $80K.
- When valuable: Large investments with uncertain outcomes

**Option to Expand**
- Value: Make a small initial investment that creates the right to scale up
- Cost: Initial investment may be suboptimal for the small scale
- Example: Build the architecture to support 10x users even though you only have 1x. If growth comes, you're ready.
- When valuable: Growth potential is high but uncertain

**Option to Abandon**
- Value: Being able to cut losses when a bet isn't working
- Cost: Need to design exit paths in advance
- Example: Monthly cloud contract instead of annual. If the product fails, cancel without penalty.
- When valuable: High downside risk, alternatives exist

**Option to Switch**
- Value: Ability to change between alternatives as conditions change
- Cost: Flexibility costs more than commitment (higher per-unit cost)
- Example: Model-agnostic architecture that can switch between AI providers.
- When valuable: Technology is changing rapidly, no clear winner

### Valuing Real Options (Simplified)

A real option's value depends on:
1. **Underlying asset value**: How valuable is the thing you're optioning?
2. **Uncertainty**: Higher uncertainty = MORE valuable option (more scenarios where you benefit from having the choice)
3. **Time to expiration**: More time = more valuable (more opportunity for conditions to change)
4. **Cost to exercise**: Lower exercise cost = more valuable
5. **Cost of the option itself**: What do you pay for the flexibility?

**Key insight**: In uncertain environments, FLEXIBILITY IS VALUABLE. It's often worth paying a premium for the ability to change course.

**Practical application for the founder**:
- Build modular, not monolithic (creates switching options)
- Use monthly contracts, not annual (creates abandonment options)
- Launch MVPs before full products (creates staging options)
- Invest in learning before investing in building (creates deferral options)

---

## 4. Irreversibility Assessment

### Why Irreversibility Matters

Reversible decisions should be made quickly — if you're wrong, you can undo it. Irreversible decisions demand deep analysis — if you're wrong, you're stuck.

### Reversibility Spectrum

| Level | Description | Examples | Decision Speed |
|-------|-------------|----------|----------------|
| 1 - Trivial | Undo in minutes | UI color change, copy update | Instant |
| 2 - Easy | Undo in hours/days | Feature flag toggle, pricing experiment | Fast |
| 3 - Moderate | Undo in weeks, some cost | New feature launch (can deprecate), marketing campaign | Standard |
| 4 - Difficult | Undo in months, significant cost | Architecture change, major hire, new market entry | Deliberate |
| 5 - Irreversible | Cannot undo | Public commitment, legal agreement, brand pivot, data deletion | Very careful |

### Jeff Bezos' Type 1 / Type 2 Framework

**Type 1 decisions** (one-way doors): Irreversible or nearly so. These require deep analysis, multiple perspectives, and careful deliberation. Invest the time.

**Type 2 decisions** (two-way doors): Reversible. These should be made quickly by individuals or small teams. Don't over-analyze. If wrong, walk back through the door.

**The common mistake**: Treating Type 2 decisions like Type 1. This creates bureaucracy and slowness. Most decisions are Type 2.

**Cardinal's role**: For every decision, Cardinal first classifies it as Type 1 or Type 2. Type 2 decisions get a quick recommendation. Type 1 decisions get full analysis.

### Irreversibility Checklist

Before committing to a decision, ask:

- [ ] Can we undo this if we're wrong? How easily? At what cost?
- [ ] What commitments does this create? (contracts, public promises, technical dependencies)
- [ ] What options does this close off? (opportunity costs of commitment)
- [ ] Can we stage this to test before fully committing?
- [ ] What would we need to see to reverse this decision?
- [ ] Who else is affected if we reverse it? (customers, partners, team)

---

## 5. Decision Journals

### Purpose

Decision journals create accountability and learning. By documenting decisions and their rationale AT THE TIME THEY'RE MADE, you can later evaluate the quality of your decision process separately from the outcome.

A good decision can have a bad outcome (bad luck). A bad decision can have a good outcome (good luck). The journal helps you distinguish the two.

### Decision Journal Template

```
DECISION JOURNAL ENTRY — [Date]

DECISION: [What was decided]

CONTEXT:
- What prompted this decision?
- What information was available at the time?
- What was the time pressure?
- What was at stake?

OPTIONS CONSIDERED:
1. [Option A]: [Brief description]
2. [Option B]: [Brief description]
3. [Option C]: [Brief description]
4. Do nothing: [What happens if we don't act]

ANALYSIS:
- Decision matrix results: [If used]
- Expected value: [If calculated]
- Key tradeoffs identified: [What was traded off]
- Irreversibility level: [1-5]

CHOSEN OPTION: [Which option and why]

KEY ASSUMPTIONS:
1. [Assumption 1 — what we believe to be true]
2. [Assumption 2]
3. [Assumption 3]

WHAT WOULD CHANGE MY MIND:
- [If X happens, I would reconsider]
- [If Y turns out to be wrong, the decision is wrong]

EXPECTED OUTCOMES:
- Best case: [Description] — Probability: [%]
- Base case: [Description] — Probability: [%]
- Worst case: [Description] — Probability: [%]

REVIEW DATE: [When to evaluate this decision]

---
[Added after review date]

ACTUAL OUTCOME: [What actually happened]

PROCESS GRADE: [A-F, based on decision quality, not outcome]
- Did we consider the right options?
- Did we have the right information?
- Did we weight criteria appropriately?
- Were our probability estimates reasonable?

LESSONS:
- [What we learned about our decision process]
```

### Decision Journal Patterns to Watch

**Overconfidence pattern**: Repeatedly assigning >80% probability to outcomes that don't materialize 80% of the time.

**Analysis paralysis pattern**: Average time-to-decision keeps increasing without improved outcomes.

**Recency bias pattern**: Recent decisions heavily influenced by the last outcome, regardless of base rates.

**Groupthink pattern**: All decisions skew toward the same approach, no genuine alternatives considered.

**Sunk cost pattern**: Continuing with bad decisions because of prior investment, even when the journal clearly shows the original assumptions were wrong.

---

## 6. Advanced Decision Frameworks

### Pre-Mortem Analysis

Before making a decision, imagine it has FAILED spectacularly. Then work backwards:

1. "It's 12 months from now. We chose Option B and it was a disaster. What went wrong?"
2. Each team member (or Cardinal, analyzing from multiple angles) writes down why it failed
3. Collect all failure modes
4. Assess: Are any of these failure modes likely? Can we prevent them?

**Why this works**: It overcomes optimism bias by making failure vivid and specific BEFORE commitment.

### Minimax Regret

Instead of maximizing expected value, minimize your maximum REGRET.

For each option, calculate: "If scenario X happens, how much would I regret choosing this option vs the best option for that scenario?"

| Decision | Scenario 1 | Scenario 2 | Scenario 3 | Max Regret |
|----------|-----------|-----------|-----------|------------|
| Option A | $100K (best) | $50K | $20K | $50K (S3) |
| Option B | $60K | $80K (best) | $40K | $40K (S1) |
| Option C | $30K | $70K | $70K (best) | $70K (S1) |

Regret for Option A in Scenario 3 = $70K (best) - $20K (Option A) = $50K
Regret for Option B in Scenario 1 = $100K (best) - $60K (Option B) = $40K
Regret for Option C in Scenario 1 = $100K (best) - $30K (Option C) = $70K

**Minimax Regret choice**: Option B (maximum regret is only $40K)

**When to use minimax regret**: When you can't assign probabilities to scenarios, or when avoiding catastrophic outcomes matters more than maximizing expected value.

### Decision Trees

For sequential decisions (where later choices depend on earlier outcomes):

```
                              ┌─ Success (60%) → $200K
Decision 1: Invest $50K? ────┤
  │                           └─ Failure (40%) → -$50K
  │
  └─ Don't Invest → $0
      │
      └─ Decision 2: Partner instead?
           ├─ Partner accepts (30%) → $80K
           └─ Partner declines (70%) → $0
```

**EV of Invest** = (0.6 × $200K) + (0.4 × -$50K) = $120K - $20K = **$100K**
**EV of Don't Invest + Partner** = (0.3 × $80K) + (0.7 × $0) = **$24K**

The tree makes sequential logic explicit and prevents "one thing at a time" thinking.

### Conviction-Consequence Matrix

Plot decisions on two axes:

```
                    High Conviction
                         |
    "Just Do It"         |      "Bet Big"
    (High conviction,    |      (High conviction,
     low consequence)    |       high consequence)
                         |
  Low ───────────────────+──────────────── High
  Consequence            |              Consequence
                         |
    "Who Cares"          |      "Danger Zone"
    (Low conviction,     |      (Low conviction,
     low consequence)    |       high consequence)
                         |
                    Low Conviction
```

- **Just Do It**: Move fast, don't overthink. Small decisions where you have a clear view.
- **Bet Big**: Full analysis, but then commit decisively. You know what to do and it matters.
- **Who Cares**: Delegate or flip a coin. Low stakes, unclear answer. Don't waste time.
- **Danger Zone**: MAXIMUM caution. High stakes and you don't know enough. Get more information, stage the decision, buy options.

---

## 7. Cognitive Biases in Decision Making

### Biases That Distort Analysis

**Anchoring**: First number heard dominates subsequent estimates
- Antidote: Generate your own estimate BEFORE looking at others

**Availability**: Over-weighting vivid, recent, or emotionally charged information
- Antidote: Check base rates and historical data

**Confirmation bias**: Seeking information that confirms preferred option
- Antidote: Assign someone to argue for the OPPOSITE option

**Sunk cost fallacy**: Continuing because of past investment rather than future value
- Antidote: Ask "If I were starting fresh today, would I choose this?"

**Status quo bias**: Preferring the current state because change is uncomfortable
- Antidote: Evaluate "do nothing" as rigorously as active options

**Overconfidence**: Believing your estimates are more accurate than they are
- Antidote: Widen confidence intervals. Use reference class forecasting.

**Framing effect**: Decision changes based on how options are presented
- Antidote: Reframe the same decision as gain vs loss and see if your preference changes

**Planning fallacy**: Underestimating time, cost, and complexity
- Antidote: Use reference class forecasting. What did similar projects ACTUALLY cost?

### Cardinal's Bias Check Protocol

Before presenting a recommendation to the founder:

1. **State the frame**: How is this decision being framed? Would a different frame change the analysis?
2. **Check the anchor**: What was the first number or reference point? Is it biasing the analysis?
3. **Seek disconfirmation**: What's the strongest argument AGAINST the recommendation?
4. **Check base rates**: What typically happens in situations like this?
5. **Pre-mortem**: If this recommendation fails, why would it fail?
6. **Confidence calibration**: How sure am I? Would I bet money at these odds?

---

## 8. Decision Making Under Uncertainty

### Levels of Uncertainty

**Level 1: Clear enough future**
- A single forecast is good enough
- Standard analysis tools work
- Example: Next month's server costs

**Level 2: Alternate futures**
- A few discrete scenarios are possible
- Scenario planning and decision trees apply
- Example: Will a specific competitor enter our market?

**Level 3: Range of futures**
- A range of outcomes is possible but not discrete scenarios
- Probability distributions and Monte Carlo apply
- Example: How many users will we have in 12 months?

**Level 4: True ambiguity**
- Cannot even define the range of outcomes
- Analogies, experiments, and flexible strategies apply
- Example: What will the AI market look like in 5 years?

### Matching Tools to Uncertainty Level

| Uncertainty Level | Primary Tools | Decision Approach |
|-------------------|---------------|-------------------|
| Level 1 | Discounted cash flow, ROI, standard planning | Optimize |
| Level 2 | Scenario planning, decision trees, game theory | Hedge and position |
| Level 3 | Monte Carlo, real options, range forecasting | Build flexibility |
| Level 4 | Analogies, experiments, low-cost probes | Learn and adapt |

### The Explore-Exploit Tradeoff

When facing uncertainty, you must balance:
- **Exploration**: Gathering information (experiments, research, pilots)
- **Exploitation**: Acting on current knowledge (scaling what works)

**Rules of thumb**:
- Early stage / high uncertainty → explore more
- Late stage / low uncertainty → exploit more
- If time is limited → exploit (no time to learn)
- If options are closing → explore now before they're gone
- If the cost of exploration is low → explore generously
- If the cost of being wrong is high → explore before committing

---

## 9. Decision Communication

### Presenting Decisions to the Founder

Cardinal presents decisions in a structured format:

```
DECISION BRIEF — [Topic]

THE QUESTION: [Clear statement of what needs to be decided]

TIME SENSITIVITY: [Why now? What happens if we wait?]

OPTIONS:
A. [Option]: [One-line summary]
   - Pro: [Key advantage]
   - Con: [Key risk]
   - EV: [Expected value if calculated]

B. [Option]: [One-line summary]
   - Pro: [Key advantage]
   - Con: [Key risk]
   - EV: [Expected value if calculated]

C. Do nothing
   - Pro: [Preserve optionality / save resources]
   - Con: [Risk of inaction]

CARDINAL'S ANALYSIS:
- Type 1 or Type 2 decision: [Classification and why]
- Irreversibility: [Level 1-5]
- Key uncertainty: [What we don't know that matters most]
- Bias check: [Any biases Cardinal identified in the analysis]

CARDINAL'S RECOMMENDATION: [Option X]
- Confidence: [Low/Medium/High]
- Rationale: [2-3 sentences on WHY]
- What would change this recommendation: [Key assumptions]

FOUNDER DECIDES.
```

---

## 10. Integration with Other Cardinal Seeds

- **Scenario Planning Methodology**: Scenario-informed decision matrices
- **Risk Quantification Models**: Probability estimates for expected value calculations
- **Systems Modeling Frameworks**: Understanding decision impact on system dynamics
- **Strategic Forecasting Methods**: Forecasting inputs for decision analysis
- **Competitive Intelligence Operations**: Competitor intelligence informs strategic options
- **First Principles**: Breaking decisions down to fundamental truths
- **Inversion Thinking**: Analyzing decisions by considering what would make them fail

---

## Summary

Strategic decision analysis ensures the founder makes well-structured decisions with full awareness of options, risks, and tradeoffs. Cardinal's decision support toolkit:

1. **Decision matrices**: Compare options across weighted criteria
2. **Expected value**: Quantify probabilistic outcomes
3. **Real options**: Value flexibility and stage commitments
4. **Irreversibility assessment**: Match analysis depth to decision permanence
5. **Decision journals**: Learn from past decisions and improve process
6. **Advanced frameworks**: Pre-mortems, minimax regret, decision trees
7. **Bias checks**: Systematic debiasing before presenting recommendations
8. **Uncertainty matching**: Right tools for the right uncertainty level

Cardinal structures. The founder decides.
