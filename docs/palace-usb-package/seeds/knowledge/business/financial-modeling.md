# Financial Modeling — Complete Knowledge Seed

## Purpose
This document contains everything a Palace agent needs to build, interpret, and act on financial models for Stone AI. MRR, ARR, LTV, CAC, unit economics, scenario modeling, and promo impact analysis — all applied to our specific tier structure.

---

## 1. MRR and ARR

### Monthly Recurring Revenue (MRR)
MRR is the total predictable revenue generated per month from active subscriptions.

```
MRR = Σ (Monthly price × Number of subscribers) for each tier
```

**Example Calculation:**
| Tier | Monthly Price | Subscribers | Tier MRR |
|------|-------------|-------------|----------|
| FREE | $0 | 500 | $0 |
| STARTER | $19.99 | 200 | $3,998 |
| PLUS | $49.99 | 100 | $4,999 |
| SMART (monthly) | $99.99 | 40 | $3,999.60 |
| SMART (annual) | $79.99 | 60 | $4,799.40 |
| PRO (monthly) | $200 | 10 | $2,000 |
| PRO (annual) | $170 | 15 | $2,550 |
| **Total** | | **425 paid** | **$22,346** |

### MRR Components
- **New MRR**: Revenue from brand-new subscribers this month.
- **Expansion MRR**: Revenue from upgrades (STARTER → PLUS, monthly → annual with higher commitment).
- **Contraction MRR**: Revenue lost from downgrades (SMART → PLUS).
- **Churned MRR**: Revenue lost from cancellations.

```
Net New MRR = New MRR + Expansion MRR - Contraction MRR - Churned MRR
```

If Net New MRR is positive, the business is growing. If negative, it's shrinking.

### Annual Recurring Revenue (ARR)
```
ARR = MRR × 12
```

At $22,346 MRR, ARR = $268,152.

**Important**: ARR is a projection, not guaranteed. It assumes current subscribers stay for 12 months. Churn will reduce actual annual revenue below ARR.

### MRR Growth Rate
```
MRR Growth Rate = (This Month's MRR - Last Month's MRR) / Last Month's MRR × 100
```

Benchmarks:
- Early stage (<$10K MRR): 15-25% month-over-month growth.
- Growth stage ($10K-$100K MRR): 10-20% month-over-month.
- Scale stage ($100K+ MRR): 5-10% month-over-month.
- 10% monthly growth = 3.1x annual growth (compounding).

---

## 2. Customer Lifetime Value (LTV)

### Simple LTV Calculation
```
LTV = ARPU / Monthly Churn Rate
```

Where ARPU = Average Revenue Per User (paying users only).

**Example:**
- Total MRR from paying users: $22,346.
- Paying users: 425.
- ARPU: $22,346 / 425 = $52.58/month.
- Monthly churn rate: 5%.
- LTV: $52.58 / 0.05 = $1,051.60.

### LTV by Tier
| Tier | Monthly Price | Est. Monthly Churn | LTV |
|------|-------------|-------------------|-----|
| STARTER | $19.99 | 7% | $285.57 |
| PLUS | $49.99 | 5% | $999.80 |
| SMART (monthly) | $99.99 | 4% | $2,499.75 |
| SMART (annual) | $79.99 | 2% | $3,999.50 |
| PRO (monthly) | $200 | 3% | $6,666.67 |
| PRO (annual) | $170 | 1.5% | $11,333.33 |

**Key insight**: Annual SMART subscribers have higher LTV ($3,999.50) than monthly SMART ($2,499.75) despite a lower monthly price. The retention benefit of annual billing is enormous.

### LTV with Gross Margin
The above LTV assumes 100% margin. In reality, each user costs money to serve (compute, infrastructure).

```
LTV (gross margin adjusted) = LTV × Gross Margin
```

If gross margin is 70% (30% of revenue goes to compute/infrastructure):
- STARTER adjusted LTV: $285.57 × 0.70 = $199.90.
- SMART annual adjusted LTV: $3,999.50 × 0.70 = $2,799.65.

Gross margin for AI SaaS typically ranges 60-80%, depending on model costs.

### LTV Improvement Levers
1. **Reduce churn** (biggest lever — it's in the denominator).
2. **Increase ARPU** (upgrades, annual conversion, price increases).
3. **Improve gross margin** (cheaper compute, caching, model optimization).

---

## 3. Customer Acquisition Cost (CAC)

### CAC Calculation
```
CAC = Total Acquisition Spend / New Customers Acquired
```

Acquisition spend includes: advertising, content marketing, referral rewards, SEO tools, marketing team costs, promotion discounts.

**Example:**
- Monthly ad spend: $2,000.
- Content/SEO costs: $500.
- Referral rewards: $300.
- Total: $2,800.
- New paying customers: 40.
- CAC: $2,800 / 40 = $70.

### CAC by Channel
Different acquisition channels have different CACs. Track separately:

| Channel | Monthly Spend | New Customers | CAC |
|---------|-------------|---------------|-----|
| Google Ads | $1,500 | 15 | $100 |
| Social Ads | $500 | 8 | $62.50 |
| Organic/SEO | $500 | 10 | $50 |
| Referrals | $300 | 7 | $42.86 |
| **Total** | **$2,800** | **40** | **$70** |

### CAC Insights
- Referrals have the lowest CAC. Invest in referral program.
- Organic/SEO has the second-lowest CAC. Invest in content.
- Google Ads have the highest CAC. Evaluate: is the LTV of Google Ad customers high enough to justify $100 CAC?
- Shift budget toward lower-CAC channels while maintaining total acquisition volume.

---

## 4. LTV:CAC Ratio

### The Benchmark
```
LTV:CAC Ratio = LTV / CAC
```

- **3:1 minimum** for healthy SaaS. For every $1 spent acquiring, get $3 back in lifetime revenue.
- **5:1** is great. You're efficient.
- **1:1 or below**: You're losing money on every customer. Unsustainable.
- **10:1+**: You're under-investing in growth. Spend more to acquire faster.

### LTV:CAC by Tier (at $70 CAC)
| Tier | LTV | LTV:CAC | Healthy? |
|------|-----|---------|----------|
| STARTER | $286 | 4.1:1 | Yes |
| PLUS | $1,000 | 14.3:1 | Under-investing in PLUS acquisition |
| SMART (monthly) | $2,500 | 35.7:1 | Massively under-investing |
| SMART (annual) | $4,000 | 57.1:1 | Massively under-investing |
| PRO | $6,667 | 95.2:1 | Massively under-investing |

**Key insight**: If you can specifically acquire SMART and PRO customers, you can afford to spend much more per acquisition ($200-500 and still be profitable). The challenge is targeting them.

### Blended LTV:CAC
Using blended ARPU of $52.58 and 5% churn:
- Blended LTV: $1,052.
- Blended CAC: $70.
- Blended LTV:CAC: 15:1.

This indicates significant room to increase acquisition spending. You could double or triple the marketing budget and still maintain a healthy ratio.

---

## 5. Payback Period

### Definition
How many months until a customer's revenue covers their acquisition cost.

```
Payback Period = CAC / (ARPU × Gross Margin)
```

### Stone AI Payback
- CAC: $70.
- ARPU: $52.58.
- Gross Margin: 70%.
- Monthly contribution: $52.58 × 0.70 = $36.81.
- Payback Period: $70 / $36.81 = 1.9 months.

### Payback by Tier
| Tier | Monthly Revenue | Gross Contribution | Payback (months) |
|------|----------------|-------------------|------------------|
| STARTER | $19.99 | $13.99 | 5.0 |
| PLUS | $49.99 | $35.00 | 2.0 |
| SMART (monthly) | $99.99 | $70.00 | 1.0 |
| SMART (annual) | $79.99 | $56.00 | 1.3 |
| PRO | $200 | $140.00 | 0.5 |

### Payback Benchmarks
- **Excellent**: <6 months.
- **Good**: 6-12 months.
- **Acceptable**: 12-18 months.
- **Concerning**: >18 months.

Stone AI's blended payback of 1.9 months is excellent. Even STARTER at 5 months is good.

### Why Payback Matters
- Short payback = faster cash recycling. The money from customer #1 funds acquiring customer #2.
- Long payback = cash trapped. You need external capital to grow while waiting for payback.
- For a solo founder bootstrapping, short payback is critical. You can't wait 18 months for CAC recovery.

---

## 6. Cohort-Based Revenue Forecasting

### How Cohort Forecasting Works
Instead of projecting revenue as one number, project by signup cohort. Each cohort has its own retention curve.

### Example Cohort Revenue Model

**Month 1 Cohort (100 paying users, $52.58 ARPU)**
| Month | Retention | Active Users | Revenue |
|-------|-----------|-------------|---------|
| 1 | 100% | 100 | $5,258 |
| 2 | 75% | 75 | $3,944 |
| 3 | 60% | 60 | $3,155 |
| 4 | 52% | 52 | $2,734 |
| 5 | 48% | 48 | $2,524 |
| 6 | 45% | 45 | $2,366 |
| 7 | 43% | 43 | $2,261 |
| 8 | 42% | 42 | $2,208 |
| 9 | 41% | 41 | $2,156 |
| 10 | 40% | 40 | $2,103 |
| 11 | 40% | 40 | $2,103 |
| 12 | 39% | 39 | $2,051 |
| **Total** | | | **$32,863** |

This single cohort of 100 users generates $32,863 over 12 months instead of the $63,096 you'd get with zero churn. Churn costs $30,233 — nearly half.

### Stacking Cohorts
Total MRR in any given month = sum of surviving revenue from every previous cohort + new cohort.

If you add 100 new paying users per month with the retention curve above:
- Month 1: $5,258 (cohort 1 only).
- Month 2: $3,944 (cohort 1) + $5,258 (cohort 2) = $9,202.
- Month 3: $3,155 + $3,944 + $5,258 = $12,357.
- Month 6: Approximately $22,000-25,000 MRR.
- Month 12: Approximately $35,000-40,000 MRR.

### Forecasting Accuracy
- Cohort forecasting is more accurate than straight-line projection because it accounts for the natural retention decay.
- Update retention curves quarterly based on actual data.
- Separate forecasts by tier (each tier has different retention characteristics).

---

## 7. Break-Even Analysis

### Fixed vs Variable Costs for AI SaaS

**Fixed Costs (Monthly)**
| Cost | Estimate | Notes |
|------|----------|-------|
| Vercel hosting | $20-200 | Scales with traffic |
| Neon database | $19-69 | Scales with usage |
| Cloudflare | $0-20 | Free tier may suffice |
| Clerk auth | $0-25 | Free tier for <10K users |
| Domain/DNS | $2 | Annual, amortized monthly |
| **Total Fixed** | **~$70-320** | |

**Variable Costs (Per User/Per Message)**
| Cost | Estimate | Notes |
|------|----------|-------|
| Anthropic API (SMART/PRO) | $0.003-0.03/message | Claude Sonnet pricing |
| vLLM compute (STARTER/PLUS) | ~$0/message | OMEN local, electricity only |
| Electricity (OMEN) | ~$50-100/month | When running inference |
| **Per-message cost** | **$0-0.03** | Depends on tier/model |

### Break-Even Calculation
```
Break-Even Users = Fixed Costs / (ARPU - Variable Cost Per User)
```

**Scenario: Early Stage**
- Fixed costs: $200/month.
- ARPU: $52.58.
- Variable cost per user: $10/month (estimated average across tiers).
- Contribution per user: $42.58.
- Break-even: $200 / $42.58 = ~5 paying users.

Break-even at 5 paying users is extremely achievable. The challenge isn't break-even — it's scaling beyond break-even to meaningful revenue.

### Cost Scaling Concerns
- As user count grows, variable costs scale. Anthropic API usage for SMART/PRO users is the biggest variable cost.
- At 1,000 SMART users sending 50 messages/day at $0.01/message: 50,000 messages/day = $500/day = $15,000/month in API costs.
- Revenue from those 1,000 SMART users: ~$90,000/month.
- Gross margin: ($90,000 - $15,000) / $90,000 = 83%. Healthy.
- Monitor: If average messages per user increases (power users), API costs can spike. Consider per-tier message budgets.

---

## 8. Promo Impact Modeling

### The $9.99 First Month Promo

**Question**: Does the $9.99 first month promo on STARTER ($19.99) earn or lose money over 12 months?

**Scenario A: No Promo (Full Price)**
- 100 users sign up at $19.99/month.
- Month 1 revenue: 100 × $19.99 = $1,999.
- Month 2 retention: 75% → 75 users → $1,499.25.
- Months 3-12: Apply retention curve.
- 12-month total: ~$10,800 (based on retention model).

**Scenario B: $9.99 First Month Promo**
- 140 users sign up at $9.99 (promo attracts 40% more signups).
- Month 1 revenue: 140 × $9.99 = $1,398.60.
- Month 2 retention: 65% (lower — promo cohort is more price-sensitive) → 91 users at $19.99 → $1,819.09.
- Months 3-12: Apply retention curve (promo cohort retains ~5% worse per month).
- 12-month total: ~$11,200.

**Analysis**: The promo generates ~$400 more over 12 months despite lower month-1 revenue. BUT this depends critically on two assumptions:
1. The promo attracts 40% more signups.
2. Promo cohort retention is only 5% worse, not dramatically worse.

If promo cohort retention is 15% worse per month, 12-month revenue drops to ~$8,500 — worse than no promo.

**Conclusion**: The promo is profitable IF the retention gap between promo and full-price cohorts is small. Track this metric obsessively.

### Annual-Only Promo Alternative
- $9.99 first month, but only for annual plans.
- User pays $9.99 + ($19.99 × 11) = $229.88 for the year (with some annual discount).
- Guaranteed 12 months of revenue. Zero month-2 churn risk.
- This is the safest promo structure.

### Promo Decision Framework
Before running any promo, model:
1. Expected incremental signups from the promo.
2. Expected retention difference between promo and full-price cohorts.
3. 12-month revenue comparison: promo scenario vs no-promo scenario.
4. If promo wins on 12-month revenue → run it.
5. If promo loses → only run it if you need short-term volume (launch, growth target).

---

## 9. Unit Economics Per Tier

### Revenue Per User vs Cost to Serve Per User

**STARTER ($19.99/month)**
- Revenue: $19.99/month.
- Compute cost: ~$2/month (local Qwen, minimal marginal cost).
- Infrastructure allocation: ~$1/month.
- Gross margin per user: $16.99/month (85%).
- Verdict: Highly profitable per user. Volume tier.

**PLUS ($49.99/month)**
- Revenue: $49.99/month.
- Compute cost: ~$4/month (local Qwen, heavier usage expected).
- Infrastructure allocation: ~$2/month.
- Gross margin per user: $43.99/month (88%).
- Verdict: Most profitable tier per user. Sweet spot.

**SMART ($99.99/month)**
- Revenue: $99.99/month.
- Compute cost: ~$15-25/month (Claude Sonnet API, usage-dependent).
- Infrastructure allocation: ~$3/month.
- Gross margin per user: $71.99-81.99/month (72-82%).
- Verdict: Profitable but higher variable costs. Watch usage patterns.

**PRO ($200/month)**
- Revenue: $200/month.
- Compute cost: ~$25-40/month (Claude Sonnet, heaviest usage).
- Infrastructure allocation: ~$5/month.
- Gross margin per user: $155-170/month (78-85%).
- Verdict: High absolute margin despite higher costs. Most valuable per user.

### Unit Economics Insights
1. **PLUS has the best margin percentage.** Local compute at a mid-tier price = highest gross margin.
2. **SMART/PRO costs scale with API usage.** Monitor and potentially cap extreme usage.
3. **FREE tier has negative unit economics.** They cost compute and infrastructure with $0 revenue. Acceptable only as a conversion funnel.
4. **Annual billing improves unit economics** because it reduces payment processing fees (one charge vs twelve) and reduces admin/dunning costs.

---

## 10. Scenario Modeling

### Three-Scenario Framework

**Pessimistic Scenario (Bottom 20% Outcome)**
Assumptions:
- 50 new paying users/month (slower acquisition).
- 7% monthly churn.
- ARPU: $40 (skewed toward lower tiers).
- No significant upgrades.

12-month projection:
- Month 12 MRR: ~$16,000.
- Month 12 paying users: ~400.
- ARR: ~$192,000.
- Total 12-month revenue: ~$130,000.

**Base Scenario (Most Likely Outcome)**
Assumptions:
- 100 new paying users/month.
- 5% monthly churn.
- ARPU: $52 (balanced tier mix).
- 10% of users upgrade tiers within 6 months.

12-month projection:
- Month 12 MRR: ~$38,000.
- Month 12 paying users: ~730.
- ARR: ~$456,000.
- Total 12-month revenue: ~$290,000.

**Optimistic Scenario (Top 20% Outcome)**
Assumptions:
- 200 new paying users/month.
- 3% monthly churn.
- ARPU: $65 (skewed toward higher tiers).
- 20% of users upgrade within 6 months.

12-month projection:
- Month 12 MRR: ~$105,000.
- Month 12 paying users: ~1,615.
- ARR: ~$1,260,000.
- Total 12-month revenue: ~$750,000.

### How to Use Scenarios
1. **Plan expenses on the pessimistic scenario.** If the business can survive the worst case, it survives any case.
2. **Plan growth investments on the base scenario.** This is where you should be betting.
3. **Plan opportunistic investments on the optimistic scenario.** If things go well, what would you do with extra resources?
4. **Update scenarios quarterly** with actual data replacing assumptions.

---

## 11. Key Financial Metrics Dashboard

### Monthly Tracking
| Metric | Formula | Target |
|--------|---------|--------|
| MRR | Sum of all subscription revenue | Growing month-over-month |
| Net New MRR | New + Expansion - Contraction - Churn | Positive every month |
| MRR Growth Rate | (This month - Last month) / Last month | 10-20% early stage |
| ARPU | MRR / Paying users | $50+ |
| Monthly Churn Rate | Churned users / Start users | <5% |
| Revenue Churn Rate | Churned MRR / Start MRR | <7% |
| NRR | (Start + Expansion - Contraction - Churn) / Start | >100% |
| LTV | ARPU / Churn Rate | >$1,000 |
| CAC | Acquisition spend / New customers | <$100 |
| LTV:CAC | LTV / CAC | >3:1 |
| Payback Period | CAC / (ARPU × Gross Margin) | <6 months |
| Gross Margin | (Revenue - COGS) / Revenue | >70% |

### Quarterly Tracking
| Metric | Purpose |
|--------|---------|
| ARR | Annual revenue projection |
| Cohort retention curves | Are newer cohorts healthier? |
| Tier distribution | Which tiers are growing/shrinking? |
| Annual plan % | What % of revenue is annual? |
| CAC by channel | Which channels are most efficient? |
| Promo cohort LTV | Are promos attracting valuable users? |

### Annual Tracking
| Metric | Purpose |
|--------|---------|
| Annual revenue (actual, not projected) | Did we hit the target? |
| Year-over-year growth | Trajectory direction |
| Customer count by tier | Market positioning |
| Total LTV collected vs projected | Is LTV model accurate? |

---

## 12. Financial Decision Rules

### Rule 1: The 3:1 Rule
Never spend more than 1/3 of expected LTV to acquire a customer. If LTV is $1,000, max CAC is $333.

### Rule 2: The Payback Rule
Never let blended payback exceed 12 months. If it does, you're growing too expensively.

### Rule 3: The Churn Rule
If monthly churn exceeds 7% for two consecutive months, stop all growth spending and fix retention. Acquiring customers into a leaky bucket is burning money.

### Rule 4: The Margin Rule
Gross margin must stay above 65%. If API costs push margin below 65%, either raise prices or optimize costs.

### Rule 5: The Cash Rule
Always maintain 3 months of operating expenses in cash reserves. If reserves drop below 3 months, cut discretionary spending.

### Rule 6: The Annual Rule
Push for >30% of revenue from annual plans. Below 30% means too much cash flow volatility and churn exposure.

### Rule 7: The Revenue Concentration Rule
No single tier should represent >50% of total MRR. If it does, you're over-dependent on one segment.

---

## 13. Quick Reference: Financial Health Scorecard

| Indicator | Healthy | Warning | Critical |
|-----------|---------|---------|----------|
| MRR Growth | >10%/mo | 5-10%/mo | <5%/mo or negative |
| Churn Rate | <5%/mo | 5-7%/mo | >7%/mo |
| LTV:CAC | >5:1 | 3-5:1 | <3:1 |
| Payback | <6 months | 6-12 months | >12 months |
| Gross Margin | >75% | 65-75% | <65% |
| NRR | >100% | 90-100% | <90% |
| Annual Plan % | >30% | 20-30% | <20% |
| ARPU | Growing | Flat | Declining |
