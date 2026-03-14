# Quantitative Decision Making
# Seed: REASON-2 | Category: Critical Thinking | Topic: Quantitative Analysis
# RAG Tags: expected-value, monte-carlo, sensitivity-analysis, decision-trees, bayesian, risk-adjusted, quantitative

---

## Purpose
Mathematical frameworks for making decisions under uncertainty. Expected value calculations,
Monte Carlo simulation, sensitivity analysis, decision trees, risk-adjusted returns, and
Bayesian updating. Includes Python examples for every technique.

---

## 1. Expected Value (EV) — The Foundation

### Core Concept
```
Expected Value = Sum of (Probability × Outcome) for all possible outcomes

EV = Σ (Pi × Vi)

Where:
  Pi = probability of outcome i
  Vi = value of outcome i

The EV tells you what the AVERAGE outcome would be if you made this decision many times.
Use EV to compare options. Choose the highest EV (adjusted for risk).
```

### Applied Example: Feature Prioritization
```python
# Stone AI: Should we build Bestie Voice Feature or Referral Rewards V2?

# Option A: Bestie Voice Feature
bestie_voice = {
    "success_high":    {"prob": 0.20, "monthly_revenue": 8000},   # Viral adoption
    "success_medium":  {"prob": 0.40, "monthly_revenue": 3000},   # Steady adoption
    "success_low":     {"prob": 0.30, "monthly_revenue": 800},    # Minimal adoption
    "failure":         {"prob": 0.10, "monthly_revenue": -2000},  # Wasted dev time
}

ev_bestie_voice = sum(
    scenario["prob"] * scenario["monthly_revenue"]
    for scenario in bestie_voice.values()
)
# EV = 0.20×8000 + 0.40×3000 + 0.30×800 + 0.10×(-2000)
# EV = 1600 + 1200 + 240 - 200 = $2,840/month

# Option B: Referral Rewards V2
referral_v2 = {
    "success_high":    {"prob": 0.30, "monthly_revenue": 5000},
    "success_medium":  {"prob": 0.45, "monthly_revenue": 2500},
    "success_low":     {"prob": 0.20, "monthly_revenue": 500},
    "failure":         {"prob": 0.05, "monthly_revenue": -500},
}

ev_referral_v2 = sum(
    scenario["prob"] * scenario["monthly_revenue"]
    for scenario in referral_v2.values()
)
# EV = 0.30×5000 + 0.45×2500 + 0.20×500 + 0.05×(-500)
# EV = 1500 + 1125 + 100 - 25 = $2,700/month

# Decision: Bestie Voice has higher EV ($2,840 vs $2,700)
# BUT Referral V2 has lower variance (more predictable) — factor in risk tolerance
```

### Risk-Adjusted Expected Value
```python
import numpy as np

def risk_adjusted_ev(scenarios: dict, risk_aversion: float = 0.5) -> float:
    """
    Risk-adjusted EV using utility function.
    risk_aversion: 0 = risk-neutral, 1 = highly risk-averse
    """
    outcomes = []
    probabilities = []

    for scenario in scenarios.values():
        outcomes.append(scenario["monthly_revenue"])
        probabilities.append(scenario["prob"])

    ev = sum(p * v for p, v in zip(probabilities, outcomes))
    variance = sum(p * (v - ev)**2 for p, v in zip(probabilities, outcomes))
    std_dev = variance ** 0.5

    # Risk-adjusted EV = EV - (risk_aversion × std_dev)
    risk_adjusted = ev - (risk_aversion * std_dev)

    return risk_adjusted

# Risk-neutral: Bestie Voice wins (higher EV)
# Risk-averse: Referral V2 may win (lower variance)
print(f"Bestie Voice (risk-adjusted): ${risk_adjusted_ev(bestie_voice):.0f}")
print(f"Referral V2 (risk-adjusted):  ${risk_adjusted_ev(referral_v2):.0f}")
```

---

## 2. Monte Carlo Simulation

### When to Use
```
Use Monte Carlo when:
  - You have multiple uncertain variables
  - Variables interact in complex ways
  - You need a DISTRIBUTION of outcomes, not just an average
  - Analytical solution is too complex

Process:
  1. Define input variables and their distributions
  2. Run thousands of random simulations
  3. Aggregate results into probability distribution
  4. Analyze: mean, median, P10/P90, probability of specific outcomes
```

### Revenue Projection Simulation
```python
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def simulate_revenue(n_simulations: int = 10000, months: int = 12) -> np.ndarray:
    """
    Simulate Stone AI revenue for next 12 months.
    Accounts for uncertainty in user growth, conversion, churn, and ARPU.
    """
    np.random.seed(42)
    results = np.zeros((n_simulations, months))

    for sim in range(n_simulations):
        users = 100  # Starting users (example)
        monthly_revenue = []

        for month in range(months):
            # Monthly user growth rate: 5-15% (uncertain)
            growth_rate = np.random.triangular(0.03, 0.08, 0.15)

            # Conversion rate (free → paid): 2-8%
            conversion_rate = np.random.triangular(0.02, 0.04, 0.08)

            # Monthly churn rate: 3-10%
            churn_rate = np.random.triangular(0.03, 0.05, 0.10)

            # Average Revenue Per User (paid users): $20-$120
            arpu = np.random.triangular(20, 45, 120)

            # Simulate
            new_users = int(users * growth_rate)
            churned_users = int(users * churn_rate)
            users = users + new_users - churned_users
            users = max(users, 1)  # Can't go below 1

            paid_users = int(users * conversion_rate)
            revenue = paid_users * arpu
            monthly_revenue.append(revenue)

        results[sim] = monthly_revenue

    return results

# Run simulation
results = simulate_revenue()

# Analyze Month 12 (end of year)
month_12 = results[:, 11]

print(f"Month 12 Revenue Distribution:")
print(f"  Mean:   ${np.mean(month_12):,.0f}")
print(f"  Median: ${np.median(month_12):,.0f}")
print(f"  P10:    ${np.percentile(month_12, 10):,.0f}  (pessimistic)")
print(f"  P90:    ${np.percentile(month_12, 90):,.0f}  (optimistic)")
print(f"  P(>$5K): {np.mean(month_12 > 5000):.1%}")
print(f"  P(>$10K): {np.mean(month_12 > 10000):.1%}")

# Visualize
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Histogram of Month 12 outcomes
ax1.hist(month_12, bins=50, edgecolor='black', alpha=0.7)
ax1.axvline(np.mean(month_12), color='red', linestyle='--', label=f'Mean: ${np.mean(month_12):,.0f}')
ax1.axvline(np.percentile(month_12, 10), color='orange', linestyle=':', label=f'P10: ${np.percentile(month_12, 10):,.0f}')
ax1.axvline(np.percentile(month_12, 90), color='green', linestyle=':', label=f'P90: ${np.percentile(month_12, 90):,.0f}')
ax1.set_xlabel('Monthly Revenue ($)')
ax1.set_ylabel('Frequency')
ax1.set_title('Month 12 Revenue Distribution')
ax1.legend()

# Revenue trajectory (percentile bands)
percentiles = [10, 25, 50, 75, 90]
for p in percentiles:
    ax2.plot(range(1, 13), np.percentile(results, p, axis=0), label=f'P{p}')
ax2.fill_between(range(1, 13), np.percentile(results, 10, axis=0),
                  np.percentile(results, 90, axis=0), alpha=0.2)
ax2.set_xlabel('Month')
ax2.set_ylabel('Revenue ($)')
ax2.set_title('Revenue Trajectory (with uncertainty bands)')
ax2.legend()

plt.tight_layout()
plt.savefig('revenue_simulation.png', dpi=150)
```

---

## 3. Sensitivity Analysis

### One-at-a-Time (OAT) Sensitivity
```python
def sensitivity_analysis():
    """
    Which input variable has the most impact on revenue?
    Vary each input ±20% while holding others at baseline.
    """
    baseline = {
        'growth_rate': 0.08,
        'conversion_rate': 0.04,
        'churn_rate': 0.05,
        'arpu': 45,
        'initial_users': 100,
    }

    def calculate_month12_revenue(params, months=12):
        users = params['initial_users']
        for _ in range(months):
            new = int(users * params['growth_rate'])
            churned = int(users * params['churn_rate'])
            users = max(users + new - churned, 1)
        paid = int(users * params['conversion_rate'])
        return paid * params['arpu']

    baseline_revenue = calculate_month12_revenue(baseline)
    print(f"Baseline Month 12 Revenue: ${baseline_revenue:,.0f}")
    print(f"\nSensitivity (±20% change in each variable):")
    print(f"{'Variable':<20} {'Low (-20%)':<15} {'High (+20%)':<15} {'Swing':<15}")
    print("-" * 65)

    sensitivities = []
    for var in baseline:
        low_params = baseline.copy()
        high_params = baseline.copy()

        if var == 'churn_rate':  # Lower churn = better
            low_params[var] *= 1.2   # Worse
            high_params[var] *= 0.8  # Better
        else:
            low_params[var] *= 0.8
            high_params[var] *= 1.2

        low_rev = calculate_month12_revenue(low_params)
        high_rev = calculate_month12_revenue(high_params)
        swing = high_rev - low_rev

        sensitivities.append((var, low_rev, high_rev, swing))
        print(f"{var:<20} ${low_rev:<14,.0f} ${high_rev:<14,.0f} ${swing:<14,.0f}")

    # Sort by swing (tornado chart order)
    sensitivities.sort(key=lambda x: abs(x[3]), reverse=True)
    print(f"\nMost sensitive variable: {sensitivities[0][0]}")
    print(f"Focus optimization efforts there first.")

sensitivity_analysis()
```

### Tornado Chart Interpretation
```
A tornado chart shows which variables matter most:

Revenue Impact of ±20% Change:
  |----- growth_rate ------|=====================| $3,200 swing
  |---- churn_rate --------|==================|   $2,800 swing
  |--- conversion_rate ----|==============|       $1,900 swing
  |------ arpu ------------|===========|          $1,400 swing
  |-- initial_users -------|========|             $900 swing

Insight: Growth rate and churn rate dominate.
Action: Focus on user acquisition and retention, not just ARPU.
The 80/20 rule: Top 2 variables drive 60%+ of outcome variance.
```

---

## 4. Decision Trees Under Uncertainty

### Decision Tree Framework
```
Decision Node (□): You choose
Chance Node (○): Uncertainty resolves
Terminal Node (△): Outcome

Structure:
  □ Decision → ○ Uncertain outcome 1 (p1) → △ Value 1
                ○ Uncertain outcome 2 (p2) → △ Value 2

Solve by BACKWARDS INDUCTION:
  Start at terminal nodes, calculate EV at each chance node,
  then choose the option with highest EV at each decision node.
```

### Example: Build vs. Buy Decision
```python
def build_vs_buy_decision_tree():
    """
    Stone AI: Should we build our own auth system or keep using Clerk?

    Decision tree:
    □ Build custom auth
      ├── ○ Build succeeds (60%)
      │   ├── ○ Saves cost long-term (70%)  → $5,000/yr savings
      │   └── ○ Higher maintenance (30%)     → -$2,000/yr net cost
      └── ○ Build fails/delayed (40%)
          └── △ -$15,000 dev cost + back to Clerk

    □ Keep Clerk
      ├── ○ Clerk scales well (80%)          → -$1,200/yr (Clerk cost, production)
      └── ○ Clerk pricing increases (20%)    → -$3,000/yr
    """

    # Build custom auth
    build_success_saves = 0.60 * (0.70 * 5000 + 0.30 * (-2000))
    build_failure = 0.40 * (-15000)
    ev_build = build_success_saves + build_failure

    # Keep Clerk
    ev_clerk = 0.80 * (-1200) + 0.20 * (-3000)

    print("Decision Tree Analysis: Build vs Buy Auth")
    print(f"  EV(Build Custom): ${ev_build:,.0f}/year")
    print(f"  EV(Keep Clerk):   ${ev_clerk:,.0f}/year")
    print(f"  Decision: {'Build' if ev_build > ev_clerk else 'Keep Clerk'}")
    print(f"  Reason: {'Build has higher EV' if ev_build > ev_clerk else 'Clerk has higher EV (less risk)'}")

    # Factor in opportunity cost
    dev_time_weeks = 8  # Estimated build time
    opportunity_cost_per_week = 2000  # Revenue from building features instead
    total_opportunity_cost = dev_time_weeks * opportunity_cost_per_week

    ev_build_adjusted = ev_build - total_opportunity_cost
    print(f"\n  Adjusted for opportunity cost ({dev_time_weeks} weeks × ${opportunity_cost_per_week:,}/week):")
    print(f"  EV(Build, adjusted): ${ev_build_adjusted:,.0f}")
    print(f"  Decision with opportunity cost: {'Build' if ev_build_adjusted > ev_clerk else 'Keep Clerk'}")

build_vs_buy_decision_tree()
```

---

## 5. Bayesian Updating

### Core Concept
```
Bayesian updating: Revise probabilities as new evidence arrives.

P(H|E) = P(E|H) × P(H) / P(E)

Where:
  P(H|E) = Posterior: Updated probability of hypothesis given evidence
  P(E|H) = Likelihood: Probability of evidence if hypothesis is true
  P(H)   = Prior: Initial probability of hypothesis
  P(E)   = Evidence: Total probability of observing this evidence

In plain English:
  "Given what we just observed, how should we update our beliefs?"
```

### Applied Example: Is Our Churn Rate Improving?
```python
import numpy as np
from scipy import stats

def bayesian_churn_analysis():
    """
    We changed our onboarding flow last month.
    Prior belief: Churn rate is ~8% (Beta distribution).
    New data: 3 out of 50 users churned this month (6%).
    Question: Has churn actually improved, or is this just noise?
    """
    # Prior: Beta(8, 92) represents ~8% churn belief
    # (8 churned out of 100 in our mental model)
    prior_alpha = 8    # Prior "successes" (churns)
    prior_beta = 92    # Prior "failures" (retained)

    # New evidence: 3 churned out of 50
    observed_churns = 3
    observed_retained = 47

    # Posterior: Beta(prior_alpha + observed, prior_beta + retained)
    posterior_alpha = prior_alpha + observed_churns
    posterior_beta = prior_beta + observed_retained

    prior_dist = stats.beta(prior_alpha, prior_beta)
    posterior_dist = stats.beta(posterior_alpha, posterior_beta)

    print("Bayesian Churn Analysis")
    print(f"  Prior belief:     {prior_dist.mean():.1%} churn rate")
    print(f"  Observed:         {observed_churns}/{observed_churns + observed_retained} = {observed_churns/(observed_churns + observed_retained):.1%}")
    print(f"  Posterior belief: {posterior_dist.mean():.1%} churn rate")
    print(f"  95% credible interval: [{posterior_dist.ppf(0.025):.1%}, {posterior_dist.ppf(0.975):.1%}]")

    # Probability that churn actually decreased (below prior mean)
    prob_improved = posterior_dist.cdf(prior_dist.mean())
    print(f"  P(churn improved): {prob_improved:.1%}")

    if prob_improved > 0.80:
        print(f"  Conclusion: Strong evidence churn improved. Continue new onboarding.")
    elif prob_improved > 0.60:
        print(f"  Conclusion: Some evidence of improvement. Gather more data.")
    else:
        print(f"  Conclusion: Insufficient evidence. Don't conclude improvement yet.")

bayesian_churn_analysis()
```

### Sequential Bayesian Updating
```python
def sequential_bayesian_update():
    """
    Update beliefs as data arrives week by week.
    """
    # Prior
    alpha, beta_param = 8, 92

    weekly_data = [
        {"week": 1, "churned": 1, "total": 12},
        {"week": 2, "churned": 0, "total": 15},
        {"week": 3, "churned": 2, "total": 13},
        {"week": 4, "churned": 0, "total": 10},
    ]

    print("Week-by-Week Bayesian Update:")
    print(f"{'Week':<6} {'Data':<12} {'Posterior Mean':<16} {'95% CI':<20}")

    for week in weekly_data:
        alpha += week["churned"]
        beta_param += week["total"] - week["churned"]

        dist = stats.beta(alpha, beta_param)
        ci_low = dist.ppf(0.025)
        ci_high = dist.ppf(0.975)

        print(f"{week['week']:<6} {week['churned']}/{week['total']:<10} "
              f"{dist.mean():<16.1%} [{ci_low:.1%}, {ci_high:.1%}]")

    print(f"\nFinal belief: {stats.beta(alpha, beta_param).mean():.1%} churn rate")
    print(f"Started at 8.0%, now at {stats.beta(alpha, beta_param).mean():.1%}")
    print(f"Confidence interval is narrowing as we collect more data.")

sequential_bayesian_update()
```

---

## 6. Multi-Criteria Decision Analysis (MCDA)

### Weighted Scoring Model
```python
def weighted_scoring():
    """
    Compare multiple options across multiple criteria with weights.
    Useful for: vendor selection, feature prioritization, hire decisions.
    """
    criteria = {
        'revenue_impact':    {'weight': 0.30, 'description': 'Expected revenue impact'},
        'dev_effort':        {'weight': 0.20, 'description': 'Development effort (inverse)'},
        'user_demand':       {'weight': 0.20, 'description': 'User-requested feature'},
        'strategic_value':   {'weight': 0.15, 'description': 'Long-term strategic value'},
        'risk':              {'weight': 0.15, 'description': 'Risk level (inverse)'},
    }

    # Score each option 1-10 on each criterion
    options = {
        'Bestie Voice': {
            'revenue_impact': 7, 'dev_effort': 4, 'user_demand': 8,
            'strategic_value': 9, 'risk': 5,
        },
        'Referral V2': {
            'revenue_impact': 6, 'dev_effort': 7, 'user_demand': 6,
            'strategic_value': 7, 'risk': 8,
        },
        'Mobile App': {
            'revenue_impact': 9, 'dev_effort': 2, 'user_demand': 9,
            'strategic_value': 10, 'risk': 3,
        },
        'Enterprise Tier': {
            'revenue_impact': 8, 'dev_effort': 5, 'user_demand': 4,
            'strategic_value': 8, 'risk': 6,
        },
    }

    print("Weighted Scoring Analysis")
    print(f"{'Option':<20} {'Weighted Score':<16} {'Rank'}")
    print("-" * 50)

    scores = {}
    for option, ratings in options.items():
        weighted_score = sum(
            ratings[criterion] * criteria[criterion]['weight']
            for criterion in criteria
        )
        scores[option] = weighted_score

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    for rank, (option, score) in enumerate(ranked, 1):
        print(f"{option:<20} {score:<16.2f} #{rank}")

weighted_scoring()
```

---

## 7. Decision Framework Summary

```
WHICH TOOL TO USE:

Simple binary decision with known probabilities?
  → Expected Value calculation

Multiple uncertain variables that interact?
  → Monte Carlo Simulation

Which input variable matters most?
  → Sensitivity Analysis (tornado chart)

Sequential decisions with uncertain outcomes?
  → Decision Tree

Updating beliefs as new data arrives?
  → Bayesian Updating

Comparing options across multiple criteria?
  → Weighted Scoring Model (MCDA)

RULES FOR GOOD QUANTITATIVE DECISIONS:
  1. Garbage in, garbage out — validate your probability estimates
  2. Include opportunity cost — what else could you do with those resources?
  3. Consider asymmetric outcomes — a small chance of catastrophe matters
  4. Update your model as you learn — Bayesian thinking
  5. Don't optimize for precision — directionally correct beats precisely wrong
  6. Make the decision reversible when possible — reduce downside risk
  7. Document your reasoning — future you will want to know why
```

---

*This seed is maintained by the Strategy team. Last validated: 2026-03.*
