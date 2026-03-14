# Risk Quantification Models

> Cardinal Seed — Intelligence Architecture
> Classification: Risk Management / Quantitative Analysis
> Operates independently on OMEN without cloud dependencies

---

## Purpose

Risk is inherent in every strategic decision. The question is never "Is there risk?" but "How much risk? What kind? And is the expected reward worth it?" Cardinal quantifies risks so the founder can make decisions based on probabilities and expected outcomes rather than gut feeling or fear.

---

## 1. Monte Carlo Simulation Concepts

### What is Monte Carlo Simulation?

Monte Carlo simulation is a technique for understanding the range of possible outcomes when there are multiple uncertain variables. Instead of calculating one answer, you run thousands of simulations with random inputs drawn from probability distributions, and observe the distribution of outcomes.

### Core Concept (No Code Required)

**Traditional approach**: "We'll have 10,000 users in 12 months."
**Monte Carlo approach**: "There's a 50% chance we'll have 8,000-15,000 users, a 25% chance of more, and a 25% chance of fewer."

### How It Works Conceptually

1. **Identify uncertain variables**: User growth rate, churn rate, conversion rate, ARPU
2. **Define ranges for each**: Growth could be 5-20% monthly; churn could be 3-8% monthly
3. **Run many scenarios**: In each scenario, randomly pick values within those ranges
4. **Observe the outcomes**: After 1,000 scenarios, what does the distribution of outcomes look like?

### Mental Monte Carlo (Without a Computer)

You can approximate Monte Carlo thinking by considering three scenarios for each variable and combining them:

**Variable 1: Monthly growth rate**
- Pessimistic: 5% (weight: 25%)
- Base case: 12% (weight: 50%)
- Optimistic: 20% (weight: 25%)

**Variable 2: Monthly churn rate**
- Pessimistic: 8% (weight: 25%)
- Base case: 5% (weight: 50%)
- Optimistic: 3% (weight: 25%)

**Combine**: 3 × 3 = 9 scenarios, each with a probability weight:

| Scenario | Growth | Churn | Net Growth | Probability | 12-Month Users (from 1,000) |
|----------|--------|-------|------------|-------------|---------------------------|
| Best | 20% | 3% | 17% | 6.25% | ~6,580 |
| Good-1 | 20% | 5% | 15% | 12.5% | ~5,350 |
| Good-2 | 12% | 3% | 9% | 12.5% | ~2,813 |
| Base | 12% | 5% | 7% | 25% | ~2,252 |
| Mixed-1 | 20% | 8% | 12% | 6.25% | ~3,896 |
| Mixed-2 | 5% | 3% | 2% | 12.5% | ~1,268 |
| Mixed-3 | 12% | 8% | 4% | 12.5% | ~1,601 |
| Poor-1 | 5% | 5% | 0% | 6.25% | ~1,000 |
| Worst | 5% | 8% | -3% | 6.25% | ~694 |

**Weighted average**: ~2,600 users (this is the expected value)
**Range**: 694 to 6,580 (this is the uncertainty range)
**Median**: ~2,250 (50% chance of more, 50% chance of less)

### When to Use Monte Carlo Thinking

- Revenue forecasting (multiple uncertain inputs)
- Runway calculation (uncertain burn rate and revenue)
- Market sizing (uncertain adoption and penetration rates)
- Project timelines (uncertain task durations)
- Investment decisions (uncertain returns)

### Key Monte Carlo Insights

1. **The average hides the range**: An "expected" outcome of $1M revenue could mean 80% chance of $500K-1.5M with 20% chance of $0 or $3M
2. **Tail risks matter**: The 5% worst-case scenario might be bankruptcy. That matters even if the average looks great.
3. **Correlated risks compound**: If growth AND churn both go wrong simultaneously, the outcome is much worse than if they're independent.
4. **Confidence intervals are more useful than point estimates**: "70% chance of 2,000-4,000 users" is more useful than "we'll have 3,000 users."

---

## 2. Risk Matrices

### The Standard Risk Matrix

Plot risks on two dimensions:
- **Likelihood** (probability of occurrence): Rare → Unlikely → Possible → Likely → Almost Certain
- **Impact** (severity if it occurs): Negligible → Minor → Moderate → Major → Catastrophic

```
Impact →        Negligible  Minor   Moderate  Major   Catastrophic

Almost Certain     Med      Med      High     Crit      Crit
Likely             Low      Med      High     High      Crit
Possible           Low      Med      Med      High      High
Unlikely           Low      Low      Med      Med       High
Rare               Low      Low      Low      Med       Med
```

### Quantified Risk Matrix

Assign numerical values for more precision:

**Likelihood Scale**:
| Level | Label | Probability Range |
|-------|-------|-------------------|
| 1 | Rare | <5% |
| 2 | Unlikely | 5-20% |
| 3 | Possible | 20-50% |
| 4 | Likely | 50-80% |
| 5 | Almost Certain | >80% |

**Impact Scale**:
| Level | Label | Financial Impact | Operational Impact |
|-------|-------|-----------------|-------------------|
| 1 | Negligible | <$1K | Minor inconvenience |
| 2 | Minor | $1K-$10K | Workaround available |
| 3 | Moderate | $10K-$50K | Significant disruption |
| 4 | Major | $50K-$500K | Major disruption, recovery weeks |
| 5 | Catastrophic | >$500K | Existential threat |

**Risk Score** = Likelihood × Impact (1-25 scale)

| Score | Priority | Action |
|-------|----------|--------|
| 1-4 | Low | Accept, monitor periodically |
| 5-9 | Medium | Mitigate, monitor regularly |
| 10-15 | High | Active mitigation required |
| 16-25 | Critical | Immediate action, escalate to founder |

### Stone AI Risk Register

| Risk | L | I | Score | Priority | Mitigation |
|------|---|---|-------|----------|------------|
| Vercel platform outage | 2 | 4 | 8 | Medium | Status monitoring, failover plan |
| Neon DB data loss | 1 | 5 | 5 | Medium | Automated backups, recovery testing |
| API key leak | 2 | 4 | 8 | Medium | Env var management, rotation capability |
| DDoS attack | 3 | 3 | 9 | Medium | Cloudflare protection, rate limiting |
| Competitor launches clone | 4 | 3 | 12 | High | Differentiation strategy, speed |
| Clerk auth service outage | 2 | 4 | 8 | Medium | Graceful degradation, cache tokens |
| AI model produces harmful content | 3 | 4 | 12 | High | Safety guardrails, moderation |
| User data breach | 1 | 5 | 5 | Medium | Encryption, access controls, audit |
| Stripe payment disruption | 1 | 4 | 4 | Low | Alternative payment processor ready |
| Federal AI regulation | 3 | 4 | 12 | High | Compliance readiness, legal counsel |

---

## 3. Expected Loss Calculation

### Single Event Expected Loss

**Expected Loss = Probability × Impact**

Example: Risk of a data breach
- Probability: 5% per year (based on industry rates for companies our size)
- Impact if it occurs: $200K (breach costs, legal, reputation damage)
- Expected Loss: 0.05 × $200K = **$10K per year**

This means investing up to $10K/year in breach prevention is mathematically justified.

### Annual Loss Expectancy (ALE)

For recurring risks:
**ALE = Single Loss Expectancy (SLE) × Annual Rate of Occurrence (ARO)**

Example: DDoS attacks
- SLE: $5K per incident (lost revenue, response effort)
- ARO: 3 incidents per year (based on industry data)
- ALE: $5K × 3 = **$15K per year**

### Risk-Adjusted Return

When evaluating an investment or project:

**Risk-Adjusted Return = Expected Revenue - Expected Costs - Expected Losses**

Example: Launching enterprise tier
- Expected Revenue: $200K/year (probability-weighted)
- Expected Costs: $80K/year (development, support, compliance)
- Expected Losses: $30K/year (longer sales cycles, enterprise churn, support escalations)
- Risk-Adjusted Return: $200K - $80K - $30K = **$90K/year**

### Portfolio Risk

When making multiple bets (features, markets, products):

**Total Portfolio Risk ≠ Sum of Individual Risks** (due to correlation)

If risks are independent:
- Total risk < sum of individual risks (diversification benefit)

If risks are correlated:
- Total risk could be worse than sum (systemic risk)

**Example**: If you invest in 5 features:
- Each has 60% chance of success, 40% chance of failure
- If independent: Probability ALL fail = 0.4^5 = 1% (very unlikely)
- If correlated (all depend on same market assumption): Much higher collective failure risk

**Lesson**: Diversify bets across independent risk factors. Don't make all bets contingent on the same assumption.

---

## 4. Risk Appetite Frameworks

### What is Risk Appetite?

Risk appetite is the amount of risk the organization is willing to accept in pursuit of its objectives. It answers: "How much uncertainty can we tolerate?"

### Risk Appetite Levels

**Risk Averse** (conservative):
- Accept only low-risk opportunities
- Preserve capital and stability above growth
- Appropriate for: Post-launch stability, handling customer data, security decisions

**Risk Neutral** (balanced):
- Accept risks where expected value is positive
- Balance growth and stability
- Appropriate for: Feature development, marketing experiments, pricing tests

**Risk Seeking** (aggressive):
- Accept high-risk/high-reward opportunities
- Prioritize growth and market capture
- Appropriate for: Pre-launch product bets, market entry, competitive moves

### Stone AI Risk Appetite by Domain

| Domain | Risk Appetite | Rationale |
|--------|--------------|-----------|
| User data security | Risk Averse | Breach is existential for trust |
| Product features | Risk Neutral | Ship fast, iterate, some features will fail |
| AI model selection | Risk Neutral | Try new models, but maintain fallbacks |
| Pricing experiments | Risk Neutral | Test and learn, reversible decisions |
| Market expansion | Risk Seeking | First-mover advantage matters |
| Infrastructure bets | Risk Neutral | Balance innovation with stability |
| Financial management | Risk Averse | Preserve runway, don't bet the company |
| Brand/reputation | Risk Averse | Reputation damage is slow to repair |

### Setting Risk Thresholds

Define quantitative thresholds:

- **Maximum acceptable loss from a single event**: $X (e.g., no single bet should risk more than 2 months of runway)
- **Maximum aggregate risk exposure**: $Y (e.g., total expected losses should not exceed 20% of annual revenue)
- **Minimum survival probability**: Z% (e.g., 95% probability of having 6+ months of runway at all times)

---

## 5. Risk Mitigation Strategies

### The Four T's of Risk Response

**Tolerate** (Accept):
- The risk is within acceptable appetite
- The cost of mitigation exceeds the expected loss
- Action: Monitor, document, accept the potential outcome

**Treat** (Mitigate):
- Reduce the probability or impact of the risk
- The most common response for medium-priority risks
- Action: Implement controls, redundancy, process changes

**Transfer** (Shift):
- Move the risk to another party
- Common methods: Insurance, contractual terms, outsourcing
- Action: Buy insurance, use SLAs with penalties, use managed services

**Terminate** (Avoid):
- Eliminate the risk by not doing the activity
- Appropriate when risk is unacceptable and cannot be adequately mitigated
- Action: Cancel the project, exit the market, choose a different approach

### Mitigation Effectiveness Assessment

For each mitigation action:

| Mitigation | Cost | Risk Reduction | ROI |
|------------|------|---------------|-----|
| Add rate limiting | 2 days dev | DDoS risk: 9→5 | High |
| Implement backups | 1 day dev | Data loss risk: 5→2 | High |
| Add monitoring | 3 days dev | Outage impact: 8→5 | Medium |
| Legal review of ToS | $5K | Liability risk: 8→4 | Medium |
| Security audit | $10K | Breach risk: 5→2 | Medium |

**Prioritize mitigations by ROI**: Highest risk reduction per dollar/hour invested.

### Residual Risk

After mitigation, some risk remains. This is "residual risk" and must be within the organization's risk appetite.

**Gross Risk** (before mitigation) → **Mitigation** → **Residual Risk** (after mitigation)

If residual risk is still too high after treatment:
1. Add more mitigation layers
2. Transfer the remaining risk (insurance)
3. Reconsider whether to proceed at all (terminate)

---

## 6. Risk Monitoring and Reporting

### Key Risk Indicators (KRIs)

KRIs are metrics that signal when risk levels are changing:

| Risk | KRI | Yellow Threshold | Red Threshold |
|------|-----|-----------------|---------------|
| Churn risk | Monthly churn rate | >6% | >10% |
| Financial risk | Runway (months) | <8 months | <4 months |
| Technical risk | Error rate (5xx) | >1% | >5% |
| Security risk | Failed auth attempts/day | >1,000 | >10,000 |
| Reputation risk | Negative review ratio | >20% | >40% |
| Dependency risk | Provider uptime | <99.5% | <99% |

### Risk Dashboard Template

```
RISK DASHBOARD — [Month]

OVERALL RISK LEVEL: [Green / Yellow / Red]

CRITICAL RISKS (Score ≥16):
- [None / List with current status]

HIGH RISKS (Score 10-15):
- [Risk]: Score [X] — Trend: [↑/→/↓] — Mitigation: [Status]
- ...

KRI ALERTS:
- [KRI]: Current [value] — Status: [Green/Yellow/Red]
- ...

NEW RISKS IDENTIFIED:
- [Risk]: L=[X] I=[X] Score=[X] — Owner: [Who]
- ...

RISKS CLOSED:
- [Risk]: [Why closed — mitigated, accepted, or terminated]
- ...

RISK BUDGET UTILIZATION:
- Expected losses this month: $[X]
- Actual losses this month: $[X]
- Cumulative expected losses YTD: $[X]
```

### Reporting Cadence

| Report | Audience | Frequency | Content Depth |
|--------|----------|-----------|--------------|
| Risk dashboard | Founder | Monthly | Full detail |
| KRI alerts | Founder + relevant head | Real-time | Alert only |
| Risk register update | Cardinal (internal) | Weekly | Full register |
| Scenario risk assessment | Founder | Quarterly | Deep analysis |

---

## 7. Special Risk Topics

### Concentration Risk

Risk from being too dependent on a single source:

- **Revenue concentration**: >50% of revenue from one customer or tier = dangerous
- **Technology concentration**: Entire stack dependent on one provider = dangerous
- **Market concentration**: 100% of users in one geography = risky
- **Talent concentration**: Critical knowledge in one person = dangerous

**Mitigation**: Diversify. Set maximum concentration thresholds and actively work toward them.

### Tail Risk

Low-probability, extreme-impact events that standard risk models underestimate:

- Financial models often assume normal distributions, but real distributions have "fat tails"
- A "1 in 100 year" event in your risk model might actually happen 1 in 20 years
- The impact of tail events is often 10-100x the "expected" worst case

**Cardinal's rule**: For any risk rated "Catastrophic" on impact, assume the probability is HIGHER than you think. Err on the side of caution for existential risks.

### Cascading Risk

When one risk event triggers another:

```
Primary: Database outage
    → Secondary: User data temporarily inaccessible
        → Tertiary: Users contact support (support overload)
            → Quaternary: Social media complaints (reputation damage)
                → Quinary: Press picks up the story (amplified damage)
```

**Mitigation**: Map cascade chains for each critical risk. Interrupt the chain at the earliest possible point.

### Black Swan Preparedness

You cannot predict black swans, but you can be resilient:

1. **Financial resilience**: Maintain runway buffer beyond planned needs
2. **Technical resilience**: Redundancy, backups, graceful degradation
3. **Organizational resilience**: Knowledge distribution, succession planning
4. **Strategic resilience**: Diversified revenue, multiple growth paths
5. **Informational resilience**: Fast detection and response capability

---

## 8. Integration with Other Cardinal Seeds

- **Scenario Planning Methodology**: Risk under different scenarios
- **Strategic Decision Analysis**: Risk-adjusted decision making
- **Systems Modeling Frameworks**: Understanding risk dynamics and cascades
- **Weak Signal Detection**: Early detection of emerging risks
- **Geopolitical Risk Analysis**: Political and regulatory risk quantification
- **Strategic Forecasting Methods**: Probability estimation for risk assessment
- **Counter-Intelligence Basics**: Security risk assessment

---

## Summary

Risk quantification transforms vague concerns into actionable intelligence. Cardinal's risk framework:

1. **Monte Carlo thinking**: Understand the RANGE of outcomes, not just the average
2. **Risk matrices**: Systematically prioritize risks by likelihood and impact
3. **Expected loss calculation**: Put a dollar value on risks to justify mitigation spending
4. **Risk appetite**: Know how much risk is acceptable in each domain
5. **Mitigation strategies**: Tolerate, Treat, Transfer, or Terminate each risk
6. **Monitoring**: Track Key Risk Indicators and report changes promptly
7. **Special risks**: Account for concentration, tail, cascading, and black swan risks

The founder should never be making a decision without understanding the risk profile. Cardinal provides that understanding with quantitative rigor.
