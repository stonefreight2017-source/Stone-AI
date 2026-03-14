# Probability & Statistics Foundations

## Purpose
Every data-driven decision in Stone AI relies on probability and statistics — A/B testing, model evaluation, anomaly detection, user behavior analysis, and confidence calibration. This seed covers distributions, hypothesis testing, confidence intervals, A/B test math, Bayes theorem, and applied statistical reasoning.

---

## Core Probability Concepts

### Probability Basics
- **P(A)**: Probability of event A occurring. Range: [0, 1].
- **P(A|B)**: Conditional probability — probability of A given B has occurred.
- **P(A and B)**: Joint probability — both A and B occur.
- **P(A or B)**: Either A or B (or both) occur.

### Rules

```python
# Addition rule (for any events)
# P(A or B) = P(A) + P(B) - P(A and B)

# For mutually exclusive events: P(A and B) = 0
# P(A or B) = P(A) + P(B)

# Multiplication rule
# P(A and B) = P(A) * P(B|A)

# For independent events: P(B|A) = P(B)
# P(A and B) = P(A) * P(B)
```

### Real Example: User Conversion

```python
# 10% of visitors sign up (conversion rate)
p_signup = 0.10

# 30% of sign-ups become paying users
p_pay_given_signup = 0.30

# What fraction of visitors become paying users?
p_pay = p_signup * p_pay_given_signup  # 0.03 = 3%

# If we have 10,000 visitors per month:
expected_paying = 10000 * p_pay  # 300 paying users
```

---

## Distributions

### Normal (Gaussian) Distribution
The bell curve. Central to statistics because of the Central Limit Theorem: the average of many independent random variables tends toward normal.

```python
import numpy as np
from scipy import stats

# Parameters: mean (mu) and standard deviation (sigma)
mu = 100    # average response time in ms
sigma = 15  # standard deviation

# What fraction of responses are under 130ms?
prob_under_130 = stats.norm.cdf(130, loc=mu, scale=sigma)
print(f"P(X < 130) = {prob_under_130:.4f}")  # ~0.9772

# 95th percentile (P95 latency)
p95 = stats.norm.ppf(0.95, loc=mu, scale=sigma)
print(f"P95 latency: {p95:.1f}ms")  # ~124.7ms

# The 68-95-99.7 rule:
# 68% of data within 1 sigma of mean
# 95% within 2 sigma
# 99.7% within 3 sigma
```

### Bernoulli and Binomial
For yes/no outcomes (user clicked, user converted, test passed).

```python
# Binomial: n trials, each with probability p of success
n = 100  # 100 users
p = 0.05  # 5% conversion rate

# Expected number of conversions
expected = n * p  # 5

# Probability of exactly 3 conversions
prob_exactly_3 = stats.binom.pmf(3, n, p)
print(f"P(X = 3) = {prob_exactly_3:.4f}")

# Probability of 10 or more conversions (unusual — maybe a bug or a win?)
prob_10_plus = 1 - stats.binom.cdf(9, n, p)
print(f"P(X >= 10) = {prob_10_plus:.4f}")
```

### Poisson Distribution
For counting rare events in a fixed interval (errors per hour, signups per day).

```python
# Lambda = average rate (events per time period)
lambda_rate = 3.5  # average 3.5 errors per hour

# Probability of exactly 0 errors in the next hour
prob_zero = stats.poisson.pmf(0, lambda_rate)
print(f"P(0 errors) = {prob_zero:.4f}")  # ~0.0302

# Probability of more than 7 errors (alert threshold?)
prob_7_plus = 1 - stats.poisson.cdf(7, lambda_rate)
print(f"P(>7 errors) = {prob_7_plus:.4f}")
```

---

## Bayes' Theorem

### The Formula
```
P(A|B) = P(B|A) * P(A) / P(B)
```

- **P(A|B)**: Posterior — what we want to know
- **P(B|A)**: Likelihood — how likely is the evidence given our hypothesis
- **P(A)**: Prior — our belief before seeing evidence
- **P(B)**: Marginal likelihood — total probability of the evidence

### Applied Example: Anomaly Detection

```python
# Is this user a bot?
# P(bot) = 0.02 (2% of traffic is bots — our prior)
# P(fast_clicks | bot) = 0.90 (bots click fast 90% of the time)
# P(fast_clicks | human) = 0.05 (humans click fast 5% of the time)

p_bot = 0.02
p_fast_given_bot = 0.90
p_fast_given_human = 0.05
p_human = 1 - p_bot

# P(fast_clicks) = P(fast|bot)*P(bot) + P(fast|human)*P(human)
p_fast = p_fast_given_bot * p_bot + p_fast_given_human * p_human
# = 0.90 * 0.02 + 0.05 * 0.98 = 0.018 + 0.049 = 0.067

# P(bot | fast_clicks) = P(fast|bot) * P(bot) / P(fast)
p_bot_given_fast = p_fast_given_bot * p_bot / p_fast
print(f"P(bot | fast clicks) = {p_bot_given_fast:.4f}")  # ~0.269

# Even with fast clicks, only 27% chance of being a bot
# Need more signals to be confident
```

### Bayesian Updating (Sequential Evidence)

```python
def bayesian_update(prior, likelihood_if_true, likelihood_if_false):
    """Update belief with new evidence."""
    evidence = likelihood_if_true * prior + likelihood_if_false * (1 - prior)
    posterior = likelihood_if_true * prior / evidence
    return posterior

# Start with P(bot) = 0.02
belief = 0.02

# Evidence 1: Fast clicks
belief = bayesian_update(belief, 0.90, 0.05)
print(f"After fast clicks: P(bot) = {belief:.4f}")  # ~0.269

# Evidence 2: No mouse movement
belief = bayesian_update(belief, 0.95, 0.10)
print(f"After no mouse: P(bot) = {belief:.4f}")  # ~0.778

# Evidence 3: Consistent timing between actions
belief = bayesian_update(belief, 0.80, 0.02)
print(f"After timing: P(bot) = {belief:.4f}")  # ~0.993

# Three pieces of evidence took us from 2% to 99.3% confident
```

---

## Hypothesis Testing

### The Framework
1. **Null hypothesis (H0)**: There is no effect / no difference
2. **Alternative hypothesis (H1)**: There IS an effect / a difference
3. **Test statistic**: Calculated from data
4. **p-value**: Probability of seeing this result (or more extreme) if H0 is true
5. **Decision**: If p-value < alpha (usually 0.05), reject H0

### Z-Test for Proportions (A/B Testing)

```python
def ab_test_proportions(
    visitors_a: int, conversions_a: int,
    visitors_b: int, conversions_b: int,
    alpha: float = 0.05
):
    """Two-proportion z-test for A/B testing."""
    p_a = conversions_a / visitors_a
    p_b = conversions_b / visitors_b

    # Pooled proportion under H0
    p_pool = (conversions_a + conversions_b) / (visitors_a + visitors_b)

    # Standard error
    se = np.sqrt(p_pool * (1 - p_pool) * (1/visitors_a + 1/visitors_b))

    # Z-statistic
    z = (p_b - p_a) / se

    # Two-tailed p-value
    p_value = 2 * (1 - stats.norm.cdf(abs(z)))

    # Confidence interval for the difference
    se_diff = np.sqrt(p_a * (1 - p_a) / visitors_a + p_b * (1 - p_b) / visitors_b)
    z_crit = stats.norm.ppf(1 - alpha/2)
    ci_lower = (p_b - p_a) - z_crit * se_diff
    ci_upper = (p_b - p_a) + z_crit * se_diff

    return {
        'control_rate': p_a,
        'treatment_rate': p_b,
        'absolute_lift': p_b - p_a,
        'relative_lift': (p_b - p_a) / p_a if p_a > 0 else float('inf'),
        'z_statistic': z,
        'p_value': p_value,
        'significant': p_value < alpha,
        'ci_95': (ci_lower, ci_upper),
    }

# Example: Testing a new onboarding flow
result = ab_test_proportions(
    visitors_a=5000, conversions_a=250,   # Control: 5% conversion
    visitors_b=5000, conversions_b=310,   # Treatment: 6.2% conversion
)
print(f"Control: {result['control_rate']:.2%}")
print(f"Treatment: {result['treatment_rate']:.2%}")
print(f"Relative lift: {result['relative_lift']:.2%}")
print(f"p-value: {result['p_value']:.4f}")
print(f"Significant: {result['significant']}")
print(f"95% CI for difference: ({result['ci_95'][0]:.4f}, {result['ci_95'][1]:.4f})")
```

### Sample Size Calculation

```python
def required_sample_size(
    baseline_rate: float,
    minimum_detectable_effect: float,  # relative lift
    alpha: float = 0.05,
    power: float = 0.80
):
    """Calculate required sample size per group for A/B test."""
    p1 = baseline_rate
    p2 = baseline_rate * (1 + minimum_detectable_effect)

    z_alpha = stats.norm.ppf(1 - alpha/2)
    z_beta = stats.norm.ppf(power)

    p_avg = (p1 + p2) / 2

    n = (z_alpha * np.sqrt(2 * p_avg * (1 - p_avg)) +
         z_beta * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2)))**2 / (p2 - p1)**2

    return int(np.ceil(n))

# How many users per group to detect a 20% lift on 5% baseline?
n = required_sample_size(
    baseline_rate=0.05,
    minimum_detectable_effect=0.20,  # 5% → 6% conversion
)
print(f"Required sample size per group: {n}")  # ~3,623
print(f"Total sample needed: {n * 2}")
```

---

## Effect Sizes

### Why p-values Aren't Enough
A p-value tells you IF there's a difference, not HOW BIG the difference is. With large enough samples, even trivial differences become "statistically significant."

```python
def cohens_h(p1, p2):
    """Cohen's h for comparing two proportions.
    Small: 0.2, Medium: 0.5, Large: 0.8
    """
    import math
    return 2 * (math.asin(math.sqrt(p2)) - math.asin(math.sqrt(p1)))

# Example: Is this a meaningful improvement?
h = cohens_h(0.05, 0.052)  # 5% → 5.2%
print(f"Cohen's h = {h:.4f}")  # Very small — probably not worth shipping

h = cohens_h(0.05, 0.07)  # 5% → 7%
print(f"Cohen's h = {h:.4f}")  # More meaningful
```

---

## Confidence Intervals

### What They Mean
A 95% confidence interval means: if you repeated this experiment 100 times, ~95 of the intervals would contain the true value.

```python
def confidence_interval_proportion(
    successes: int,
    total: int,
    confidence: float = 0.95
):
    """Wilson score interval for proportions (better than normal approximation)."""
    p_hat = successes / total
    z = stats.norm.ppf(1 - (1 - confidence) / 2)

    denominator = 1 + z**2 / total
    center = (p_hat + z**2 / (2 * total)) / denominator
    margin = z * np.sqrt((p_hat * (1 - p_hat) + z**2 / (4 * total)) / total) / denominator

    return (center - margin, center + margin)

# 45 out of 1000 users converted
ci = confidence_interval_proportion(45, 1000)
print(f"Conversion rate: {45/1000:.1%}")
print(f"95% CI: ({ci[0]:.4f}, {ci[1]:.4f})")
# "We're 95% confident the true conversion rate is between 3.4% and 5.9%"
```

---

## Multiple Testing Correction

### The Problem
If you run 20 A/B tests with alpha=0.05, you expect 1 false positive even with NO real effects.

```python
def bonferroni_correction(p_values, alpha=0.05):
    """Most conservative correction — divide alpha by number of tests."""
    adjusted_alpha = alpha / len(p_values)
    return [
        {'p_value': p, 'significant': p < adjusted_alpha}
        for p in p_values
    ]

def benjamini_hochberg(p_values, alpha=0.05):
    """False Discovery Rate control — less conservative than Bonferroni."""
    n = len(p_values)
    sorted_indices = np.argsort(p_values)
    sorted_p = np.array(p_values)[sorted_indices]

    # Find the largest k where p_(k) <= k/n * alpha
    thresholds = [(i + 1) / n * alpha for i in range(n)]
    significant = [False] * n

    last_significant = -1
    for i in range(n):
        if sorted_p[i] <= thresholds[i]:
            last_significant = i

    # Everything up to last_significant is significant
    for i in range(last_significant + 1):
        significant[sorted_indices[i]] = True

    return significant

# Example: 10 metrics tested, some will be false positives
p_values = [0.001, 0.015, 0.03, 0.04, 0.048, 0.12, 0.23, 0.45, 0.67, 0.89]
bh_results = benjamini_hochberg(p_values)
print(f"Significant after correction: {sum(bh_results)} out of {len(p_values)}")
```

---

## Conditional Probability in Practice

### User Behavior Chains

```python
# Funnel analysis using conditional probabilities
funnel = {
    'visit': 10000,
    'signup': 1200,     # P(signup | visit) = 12%
    'onboard': 800,     # P(onboard | signup) = 67%
    'first_chat': 400,  # P(chat | onboard) = 50%
    'subscribe': 120,   # P(subscribe | chat) = 30%
}

print("Funnel Analysis:")
stages = list(funnel.keys())
for i in range(1, len(stages)):
    prev = stages[i-1]
    curr = stages[i]
    rate = funnel[curr] / funnel[prev]
    cumulative = funnel[curr] / funnel[stages[0]]
    print(f"  {prev} → {curr}: {rate:.1%} (cumulative: {cumulative:.2%})")

# Output:
# visit → signup: 12.0% (cumulative: 12.00%)
# signup → onboard: 66.7% (cumulative: 8.00%)
# onboard → first_chat: 50.0% (cumulative: 4.00%)
# first_chat → subscribe: 30.0% (cumulative: 1.20%)
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Fix |
|---|---|---|
| Peeking at A/B test results early | Inflates false positive rate | Pre-set sample size, don't peek |
| Using p < 0.05 as a binary gate | Misses effect size and practical significance | Report CI and effect size |
| Running 20 tests, reporting only "wins" | Cherry-picking, multiple testing problem | Bonferroni/BH correction |
| Treating correlation as causation | Confounders exist | Randomized experiments or causal inference |
| Small sample generalizations | High variance in small samples | Calculate and respect required sample sizes |
| Ignoring base rates (Bayes neglect) | Leads to overreacting to rare events | Always compute P(hypothesis|evidence) using Bayes |

---

## Key Takeaways

- Bayes' theorem is the foundation of updating beliefs with evidence. Use it for anomaly detection, spam filtering, and bot detection.
- A/B testing requires proper sample size calculations BEFORE running. Underpowered tests waste time.
- p-values tell you IF a difference exists; effect sizes tell you if it MATTERS.
- Confidence intervals are more informative than binary significant/not-significant decisions.
- Multiple testing correction is mandatory when checking many metrics simultaneously.
- Conditional probability chains model user funnels and help identify the biggest drop-off points.
