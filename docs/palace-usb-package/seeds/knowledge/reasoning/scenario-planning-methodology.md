# Scenario Planning Methodology

> Cardinal Seed — Intelligence Architecture
> Classification: Strategic Planning / Futures Analysis
> Operates independently on OMEN without cloud dependencies

---

## Purpose

Scenario planning is the discipline of constructing multiple plausible futures to stress-test strategies, identify blind spots, and prepare adaptive responses. Unlike forecasting (which predicts ONE future), scenario planning maps the SPACE of possible futures and equips decision-makers to navigate any of them.

Cardinal uses scenario planning to advise the founder on strategic decisions where uncertainty is high and stakes are irreversible. This seed provides the complete methodology for constructing, analyzing, and acting on scenarios.

---

## 1. The 2x2 Scenario Matrix

### Core Method

The 2x2 matrix is the foundational tool. It uses two critical uncertainties as axes to generate four distinct, internally consistent scenarios.

**Step 1: Identify Driving Forces**

List all forces shaping the future of your domain:
- Technology trends (AI capability curves, hardware costs, open-source momentum)
- Market forces (customer behavior shifts, competitor moves, pricing pressure)
- Regulatory forces (data privacy laws, AI regulation, antitrust)
- Social forces (trust in AI, workforce automation anxiety, digital literacy)
- Economic forces (recession risk, funding availability, currency fluctuations)
- Environmental forces (energy costs, sustainability requirements)

**Step 2: Rank by Impact and Uncertainty**

For each force, score two dimensions:
- **Impact**: How much would this force change our strategy if it shifted? (1-10)
- **Uncertainty**: How confident are we about the direction? (1-10, where 10 = completely uncertain)

Plot forces on an Impact vs Uncertainty grid. The forces in the HIGH IMPACT + HIGH UNCERTAINTY quadrant are your scenario axes.

**Step 3: Select Two Axes**

Choose the two forces that are:
- Highest combined impact + uncertainty scores
- Independent of each other (not causally linked)
- Representable as a spectrum (not binary)

Example for Stone AI:
- Axis 1: AI regulation intensity (Light touch ←→ Heavy regulation)
- Axis 2: Local AI capability (Limited ←→ Transformative)

**Step 4: Name and Populate Scenarios**

Each quadrant gets a memorable name and a narrative:

```
                    Heavy Regulation
                         |
    "The Fortress"       |      "The Cathedral"
    (Heavy reg +         |      (Heavy reg +
     Limited local AI)   |       Transformative local AI)
                         |
  -----------------------+------------------------
                         |
    "The Wasteland"      |      "The Frontier"
    (Light reg +         |      (Light reg +
     Limited local AI)   |       Transformative local AI)
                         |
                    Light Regulation
```

### Building Scenario Narratives

Each scenario needs:

1. **Headline**: One-sentence summary of the world
2. **Timeline**: How the world got here (key events, 3-5 year path)
3. **Winners and Losers**: Who thrives and who fails in this world
4. **Customer Behavior**: How target users act differently
5. **Competitive Landscape**: Who are the major players and why
6. **Technology Stack**: What tech is dominant and accessible
7. **Business Model Implications**: What works and what breaks

**Example: "The Frontier" (Light regulation + Transformative local AI)**

*Headline*: Open-source AI models running on consumer hardware have democratized intelligence, and governments have largely stayed hands-off.

*Timeline*: 2025-2026 saw rapid improvement in model quantization. By 2027, 70B-parameter models ran on gaming GPUs. Regulatory attempts in 2025 stalled in committee. By 2028, AI is treated like software — minimal specific regulation.

*Winners*: Companies with strong local-first AI products. Hardware manufacturers. Open-source ecosystem.

*Losers*: Cloud-only AI providers. Companies whose moat was API access to large models.

*Customer Behavior*: Users expect AI to run locally. Privacy-conscious users dominate. Willingness to pay for cloud AI drops significantly.

*Competitive Landscape*: Thousands of small AI companies. No dominant platform. Competition on UX and specialization rather than model access.

*Technology Stack*: Local inference is standard. Cloud is for training only. Edge computing is mature.

*Business Model Implications*: Subscription models under pressure. One-time purchase models return. Hardware bundles become viable. Data advantages matter more than model advantages.

### Scenario Quality Checks

A good scenario set must be:
- **Plausible**: Each scenario could actually happen (no science fiction)
- **Internally consistent**: Events within each scenario don't contradict
- **Distinct**: The four scenarios feel meaningfully different
- **Challenging**: At least two scenarios threaten your current strategy
- **Decision-relevant**: The scenarios change what you would do

---

## 2. Wildcard Analysis

### What Are Wildcards?

Wildcards are low-probability, high-impact events that fall outside normal planning assumptions. They are the "black swans" and "gray rhinos" that can invalidate all four scenarios simultaneously.

### Categories of Wildcards

**Technology Wildcards**
- Breakthrough in quantum computing making current encryption obsolete
- AGI emergence years ahead of expectations
- Critical infrastructure cyberattack disrupting cloud services globally
- New hardware paradigm (neuromorphic, photonic) that obsoletes GPUs

**Market Wildcards**
- Major tech company open-sources a frontier model (completely free)
- Global AI winter triggered by a catastrophic AI failure
- Cryptocurrency crash eliminating GPU demand (price collapse)
- Major platform (Apple, Google) bundles AI assistant that kills standalone market

**Regulatory Wildcards**
- Emergency AI ban in a major market (EU, US, China)
- Mandatory AI licensing requiring expensive certification
- Data localization laws fragmenting the global internet
- AI-generated content liability making providers responsible for outputs

**Geopolitical Wildcards**
- Taiwan conflict disrupting chip supply for 12+ months
- US-China tech decoupling accelerates dramatically
- Coordinated ransomware attack on financial infrastructure
- Energy crisis making GPU compute unaffordable

**Social Wildcards**
- Widespread AI-driven unemployment triggering political backlash
- Deep fake incident destroying public trust in AI
- AI-assisted scientific breakthrough creating massive new demand
- Cultural shift against digital products toward analog/human experiences

### Wildcard Assessment Framework

For each wildcard, evaluate:

| Dimension | Question | Rating |
|-----------|----------|--------|
| Probability | How likely in the next 3 years? | 1-10 |
| Impact | How severely would it affect us? | 1-10 |
| Speed | How fast would effects materialize? | Instant/Weeks/Months/Years |
| Detectability | Would we see it coming? | None/Low/Medium/High |
| Reversibility | Can we recover? | Easy/Moderate/Difficult/Impossible |
| Preparation Cost | How expensive to prepare for? | Low/Medium/High |

**Priority Wildcards** = High Impact + Low Detectability + Difficult Reversibility

For priority wildcards, develop:
1. **Early warning indicators**: What signals would precede this event?
2. **Immediate response plan**: First 72 hours after detection
3. **Strategic pivot options**: How to adapt the business model
4. **Hedging actions**: Low-cost preparations we can take NOW

---

## 3. The Cone of Uncertainty

### Concept

The cone of uncertainty visualizes how the range of possible outcomes widens as you look further into the future. Near-term futures are relatively constrained; distant futures are wide open.

```
Present          1 Year          3 Years          5 Years
   |              /  \            /    \           /      \
   |             /    \          /      \         /        \
   *            /      \        /        \       /          \
   |             \    /          \      /         \        /
   |              \  /            \    /           \      /

   Narrow         Medium          Wide            Very Wide
   uncertainty    uncertainty     uncertainty     uncertainty
```

### Practical Application

**0-6 months**: Plan with high confidence. Make commitments. Execute.
- Use deterministic planning (budgets, roadmaps, sprint plans)
- Scenario planning unnecessary — just execute

**6-18 months**: Plan with contingencies. Make reversible commitments.
- Use 2-3 scenarios (not full 2x2)
- Identify key decision points and trigger conditions
- Build optionality into plans (modular architecture, flexible contracts)

**18-36 months**: Plan directionally. Invest in capabilities, not specific outcomes.
- Full 2x2 scenario planning
- Focus on building capabilities useful across multiple scenarios
- Avoid large irreversible bets

**3-5 years**: Plan for adaptability. Build learning systems.
- Wildcard analysis becomes critical
- Focus on organizational agility over specific strategies
- Invest in sensing capabilities (market intelligence, trend tracking)

### Reducing the Cone

The cone narrows as you:
1. **Gather intelligence**: Active monitoring of driving forces
2. **Run experiments**: Small bets that reveal which scenario is emerging
3. **Build relationships**: Insider access to regulatory/industry signals
4. **Track indicators**: Quantitative monitoring of key metrics

---

## 4. Trigger Points and Signposts

### What Are Trigger Points?

Trigger points are observable events or metric thresholds that signal which scenario is becoming reality. They convert abstract scenarios into actionable intelligence.

### Designing Trigger Points

For each scenario, identify 5-8 observable indicators:

**Example: "The Cathedral" scenario triggers (Heavy regulation + Transformative local AI)**

| Trigger | Metric | Threshold | Current Value | Status |
|---------|--------|-----------|---------------|--------|
| EU AI Act enforcement begins | Enforcement actions filed | >10 cases | 0 | Not triggered |
| US federal AI regulation passes | Bill signed into law | Binary | No | Not triggered |
| Open-source model matches GPT-4 | MMLU benchmark score | >86% | ~82% | Approaching |
| Consumer GPU runs 70B model | Inference speed | >10 tok/s | ~3 tok/s | Progressing |
| Major AI company fined >$1B | Fine amount | >$1B | $0 | Not triggered |
| Local AI product reaches 10M users | DAU | >10M | ~2M | Progressing |

### Trigger Point Rules

1. **Specific**: Not "regulation increases" but "EU AI Act Article 6 enforcement begins"
2. **Measurable**: Must have a clear yes/no or quantitative threshold
3. **Timely**: Must be detectable within weeks, not after the fact
4. **Independent**: Don't cluster all triggers on one data source
5. **Leading**: Should signal the future, not confirm the present

### Scenario Probability Tracking

Maintain a running probability estimate for each scenario:

```
Scenario Assessment — Monthly Update

The Fortress:  15% (↓2% from last month)
The Cathedral: 30% (↑5%)
The Wasteland: 20% (unchanged)
The Frontier:  35% (↓3%)

Key shifts:
- EU enforcement timeline accelerated (Cathedral +5%)
- US regulation stalled in committee (Fortress -2%)
- New quantization paper shows 4x speedup (Frontier stable, Cathedral +)
```

Update monthly. Present to founder when any scenario shifts more than 10% in a single month.

---

## 5. Strategic Options per Scenario

### Core vs Contingent Strategy

**Core strategy**: Actions that are beneficial across ALL four scenarios. These are "no regret" moves — do them regardless of which future emerges.

**Contingent strategy**: Actions that are optimal for specific scenarios. Hold these as options, triggered by signposts.

### Mapping Strategy to Scenarios

Create a strategy-scenario matrix:

```
Strategy Option         | Fortress | Cathedral | Frontier | Wasteland | Avg Value
------------------------|----------|-----------|----------|-----------|----------
Invest in local AI      |    +2    |    +3     |    +3    |    +1     |   +2.25
Build compliance system |    +3    |    +3     |    -1    |    0      |   +1.25
Open-source core model  |    0     |    +1     |    +3    |    +2     |   +1.50
Enterprise sales focus  |    +3    |    +2     |    0     |    +1     |   +1.50
Consumer mobile app     |    +1    |    +1     |    +3    |    +2     |   +1.75
API marketplace         |    -1    |    +2     |    +2    |    +1     |   +1.00

Scale: -3 (very harmful) to +3 (very beneficial)
```

**No-regret moves** (positive across all scenarios):
- Invest in local AI capability
- Consumer mobile app development

**Hedging moves** (protect against worst scenarios):
- Build compliance system (protects against Fortress/Cathedral)
- Open-source some components (protects against Frontier/Wasteland)

**Big bets** (high payoff in specific scenarios):
- Enterprise focus (big in Fortress, neutral elsewhere)
- API marketplace (big in Cathedral/Frontier, risky in Fortress)

### Real Options Framework

Treat strategies as options, not commitments:

1. **Option to expand**: Small initial investment, right to scale up
   - Example: Build compliance framework for one jurisdiction. Option to expand to others if regulation increases.

2. **Option to abandon**: Invest with clear exit criteria
   - Example: Enterprise sales pilot. If <5 enterprise deals in 6 months, redirect resources.

3. **Option to switch**: Build for flexibility
   - Example: Modular architecture that can serve both local and cloud deployment.

4. **Option to wait**: Preserve the ability to decide later
   - Example: Don't commit to a single AI model vendor. Maintain abstraction layer.

### Decision Staging

Break big decisions into stages with go/no-go gates:

```
Stage 1 (Now, $X): Research and prototype
  → Gate: Does the prototype validate our hypothesis?

Stage 2 (Month 3, $2X): Limited pilot
  → Gate: Do pilot metrics meet our thresholds?

Stage 3 (Month 6, $5X): Scaled rollout
  → Gate: Is the market evolving as expected?

Stage 4 (Month 12, $10X): Full commitment
  → Final decision: All-in or redirect
```

Each gate is a scenario check — is the world evolving toward the scenario where this bet pays off?

---

## 6. Scenario Planning Process (Step by Step)

### Phase 1: Preparation (1-2 hours)

1. Define the focal question: "What is the future of [X] over the next [Y] years?"
2. Gather the team (or in Cardinal's case, gather intelligence from all sources)
3. Set the time horizon (typically 3-5 years for strategy, 1-2 for tactics)
4. Identify the scope boundary (industry? geography? technology?)

### Phase 2: Driving Forces Identification (2-3 hours)

1. Brainstorm all driving forces (aim for 30+)
2. Cluster related forces into themes (typically 8-12 themes)
3. Rate each theme on Impact (1-10) and Uncertainty (1-10)
4. Plot on Impact vs Uncertainty grid
5. Select top 2 uncertain + impactful themes as axes

### Phase 3: Scenario Construction (3-4 hours)

1. Define the extreme positions on each axis
2. Name each quadrant scenario
3. Write scenario narratives (1-2 pages each)
4. Identify key actors, events, and dynamics in each
5. Quality check: plausible? consistent? distinct? challenging?

### Phase 4: Implication Analysis (2-3 hours)

1. For each scenario, answer:
   - What opportunities emerge?
   - What threats materialize?
   - What capabilities do we need?
   - What partnerships matter?
   - What is our competitive position?
2. Identify no-regret moves
3. Identify contingent strategies
4. Map trigger points for each scenario

### Phase 5: Strategy Formulation (2-3 hours)

1. Build the strategy-scenario matrix
2. Identify core strategy (positive across all scenarios)
3. Design contingent strategies with triggers
4. Create real options for big bets
5. Stage decisions with go/no-go gates

### Phase 6: Monitoring System (Ongoing)

1. Set up trigger point tracking dashboard
2. Assign monitoring responsibilities
3. Schedule monthly scenario probability updates
4. Define escalation criteria (when to re-run scenarios)
5. Annual full scenario refresh

---

## 7. Common Pitfalls and How to Avoid Them

### Pitfall 1: "Best Case / Worst Case / Most Likely"

This is NOT scenario planning. It's just optimism/pessimism on a single dimension. Real scenarios use TWO independent uncertainties to create four QUALITATIVELY DIFFERENT futures.

**Fix**: Always use the 2x2 matrix. If you have only one axis, you're doing sensitivity analysis, not scenario planning.

### Pitfall 2: Scenarios That All Look Similar

If your four scenarios don't feel meaningfully different, your axes are either:
- Too correlated (choose more independent axes)
- Too narrow (widen the scope)
- Not uncertain enough (choose genuinely uncertain forces)

**Fix**: The "newspaper test" — could you write a distinct headline for each scenario that would surprise readers of the others?

### Pitfall 3: Falling in Love with One Scenario

Decision-makers often fixate on the scenario they consider most likely and plan only for it. This defeats the entire purpose.

**Fix**: Assign a "scenario champion" for each quadrant. Their job is to argue why that scenario is becoming real. Rotate champions.

### Pitfall 4: Analysis Paralysis

Scenario planning can expand options endlessly. At some point, you must decide.

**Fix**: Use the "robust strategy" approach — find the strategy with the highest MINIMUM payoff across scenarios (minimax), not the highest MAXIMUM payoff.

### Pitfall 5: Set-and-Forget

Scenarios created once and never updated become stale fictions.

**Fix**: Monthly trigger point review. Quarterly scenario probability update. Annual full refresh.

### Pitfall 6: Too Many Scenarios

Some practitioners create 3x3 (9 scenarios) or even larger matrices. This is unwieldy and impossible to plan against.

**Fix**: Stick to 2x2 (4 scenarios) as the primary tool. Use wildcards to handle extreme events outside the matrix.

---

## 8. Scenario Planning for Stone AI — Applied Example

### Focal Question

"What is the competitive landscape for AI-powered personal assistant platforms over the next 3 years (2026-2029)?"

### Selected Axes

After driving force analysis:

**Axis 1: AI Model Accessibility**
- Left: Concentrated (few providers, expensive API access, high barriers)
- Right: Democratized (many providers, cheap/free models, low barriers)

**Axis 2: User Trust in AI**
- Top: High trust (users share personal data freely, rely on AI for decisions)
- Bottom: Low trust (users are skeptical, privacy-first, minimal AI reliance)

### Four Scenarios

**"The Oligarchy" (Concentrated + High Trust)**
Big tech wins. Users trust and rely on AI but only from Google, Apple, Microsoft, OpenAI. Small players struggle to compete on model quality. Market consolidates around 3-5 platforms. Stone AI's play: enterprise/niche specialization, or acquisition target.

**"The Bazaar" (Democratized + High Trust)**
Everyone has great AI. Users trust it and use it for everything. Competition is on UX, personalization, and community. Hundreds of successful AI companies serving different niches. Stone AI's play: differentiation through agent personality, community, and specialization.

**"The Bunker" (Concentrated + Low Trust)**
Only big companies have good AI, and users don't trust any of them. AI adoption stalls. Regulatory pressure mounts. The market shrinks. Stone AI's play: pivot to privacy-first positioning, local-only processing, human-in-the-loop.

**"The Commons" (Democratized + Low Trust)**
Good AI is available to everyone, but users are skeptical. Open-source dominates because users want transparency. Privacy tools boom. Stone AI's play: open-source core, local processing, radical transparency.

### No-Regret Moves for Stone AI

Across all four scenarios:
1. **Local AI capability**: Valuable in ALL scenarios (already building with vLLM)
2. **Strong community/brand**: Differentiation regardless of model landscape
3. **Modular architecture**: Ability to swap models, deployment modes, features
4. **Data privacy leadership**: Protective in low-trust; competitive advantage in high-trust

### Contingent Strategies

- If "Oligarchy" signals strengthen → accelerate enterprise features, seek partnerships
- If "Bazaar" signals strengthen → accelerate community features, expand agent roster
- If "Bunker" signals strengthen → double down on privacy, reduce cloud dependence
- If "Commons" signals strengthen → open-source more code, build transparency tools

---

## 9. Integration with Other Cardinal Seeds

This seed connects to:
- **Weak Signal Detection**: Feeds driving force identification and trigger point monitoring
- **Competitive Intelligence Operations**: Provides input on competitor scenarios
- **Strategic Decision Analysis**: Scenario-informed decision matrices
- **Technology Radar Assessment**: Technology axis inputs for scenario construction
- **Risk Quantification Models**: Probability estimation for scenarios
- **Strategic Forecasting Methods**: Complementary approaches to scenario planning
- **Network Effects Analysis**: Understanding platform dynamics within scenarios

---

## 10. Cardinal's Scenario Planning Cadence

### Weekly
- Review trigger point dashboard
- Note any significant shifts in driving forces
- Flag emerging wildcards

### Monthly
- Update scenario probability estimates
- Report to founder if any scenario shifts >10%
- Review no-regret move progress

### Quarterly
- Full scenario review with founder
- Assess if axes are still the right ones
- Update contingent strategy readiness

### Annually
- Complete scenario refresh (new driving forces, new axes if needed)
- Retrospective: how accurate were our scenarios?
- Update wildcard inventory

---

## 11. Scenario Communication Templates

### Executive Brief Format

```
SCENARIO BRIEF — [Date]

Current Assessment:
  Scenario A: XX% (↑/↓ X% from last month)
  Scenario B: XX%
  Scenario C: XX%
  Scenario D: XX%

Key Trigger Points Activated This Month:
  - [Trigger]: [What happened] → [Which scenario it favors]

Recommended Actions:
  - No-regret: [Continue/Accelerate/Launch]
  - Contingent: [Hold/Prepare/Activate]

Wildcards to Watch:
  - [New wildcard]: [Why it matters]
```

### Decision Support Format

```
DECISION: [What needs to be decided]

Scenario Analysis:
  If Scenario A: [Outcome of decision] → [Score -3 to +3]
  If Scenario B: [Outcome of decision] → [Score]
  If Scenario C: [Outcome of decision] → [Score]
  If Scenario D: [Outcome of decision] → [Score]

Weighted Expected Value: [Probability-weighted average]

Recommendation: [What Cardinal advises]
Confidence: [Low/Medium/High]
Reversibility: [Easy/Moderate/Difficult/Impossible]
```

---

## Summary

Scenario planning is not about predicting the future. It is about PREPARING for multiple futures so that no plausible outcome catches you flat-footed. Cardinal uses this methodology to:

1. Map the space of plausible futures using 2x2 matrices
2. Stress-test strategies against all four scenarios
3. Identify no-regret moves that work everywhere
4. Design contingent strategies triggered by observable events
5. Monitor trigger points to detect which future is emerging
6. Advise the founder with probability-weighted recommendations

The founder makes the decisions. Cardinal provides the intelligence to make them well.
