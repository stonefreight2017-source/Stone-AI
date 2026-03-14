# Financial Forecasting Models — Stone AI Palace Knowledge Seed

## Seed Classification
- **Domain**: Revenue Operations / Financial Planning
- **Complexity**: Advanced
- **Stack**: TypeScript, SQL, Spreadsheet Models
- **Applies To**: Stone AI, Best AI, Stone AI Tools (Three-Headed Monster)

---

## 1. Why Financial Forecasting Matters

Financial forecasting is not about predicting the future with certainty. It is about creating structured models that help you make decisions under uncertainty. For Stone AI, forecasting answers critical questions: How much runway do we have? When do we break even? How fast can we grow before cash runs out? What happens if churn doubles?

Good forecasts don't tell you what will happen. They tell you what you need to believe for your plan to work.

---

## 2. Revenue Projection Models

### Three-Scenario Framework

Every forecast should include three scenarios. Not because one is "right," but because the spread between them defines your risk.

```typescript
// src/lib/forecasting/revenue-projections.ts

interface MonthlyProjection {
  month: number;
  date: string;
  newCustomers: number;
  churnedCustomers: number;
  totalCustomers: number;
  mrr: number;
  arr: number;
  expenses: number;
  netCashFlow: number;
  cumulativeCash: number;
  runway: number | null; // months of cash remaining
}

interface Scenario {
  name: string;
  assumptions: {
    monthlyNewCustomers: number[];  // 12-month array
    monthlyChurnRate: number;       // 0-1
    arpu: number;                   // average revenue per user
    monthlyExpenses: number;        // total operating expenses
    expenseGrowthRate: number;      // monthly expense growth (hiring, etc.)
    startingCash: number;           // cash on hand
    startingCustomers: number;      // current paying customers
  };
}

export function projectRevenue(scenario: Scenario, months: number = 24): MonthlyProjection[] {
  const projections: MonthlyProjection[] = [];
  let customers = scenario.assumptions.startingCustomers;
  let cash = scenario.assumptions.startingCash;
  let expenses = scenario.assumptions.monthlyExpenses;

  for (let i = 0; i < months; i++) {
    const newCustomers = i < 12
      ? scenario.assumptions.monthlyNewCustomers[i]
      : scenario.assumptions.monthlyNewCustomers[11] * (1 + 0.05); // 5% growth after year 1

    const churnedCustomers = Math.round(customers * scenario.assumptions.monthlyChurnRate);
    customers = customers + newCustomers - churnedCustomers;
    customers = Math.max(0, customers);

    const mrr = customers * scenario.assumptions.arpu;
    const arr = mrr * 12;
    const netCashFlow = mrr - expenses;
    cash += netCashFlow;

    expenses *= (1 + scenario.assumptions.expenseGrowthRate);

    const runway = netCashFlow < 0
      ? Math.floor(cash / Math.abs(netCashFlow))
      : null; // Profitable — infinite runway

    const date = new Date();
    date.setMonth(date.getMonth() + i);

    projections.push({
      month: i + 1,
      date: date.toISOString().slice(0, 7), // YYYY-MM
      newCustomers,
      churnedCustomers,
      totalCustomers: customers,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      cumulativeCash: Math.round(cash * 100) / 100,
      runway,
    });
  }

  return projections;
}
```

### Stone AI Scenarios

```typescript
// src/lib/forecasting/stone-ai-scenarios.ts

export const STONE_AI_SCENARIOS: Scenario[] = [
  {
    name: 'Conservative',
    assumptions: {
      // Slow, organic growth. No paid marketing. Word-of-mouth only.
      monthlyNewCustomers: [5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30, 32],
      monthlyChurnRate: 0.06, // 6% monthly churn (high for SaaS but realistic for early stage)
      arpu: 45, // Weighted: most users on STARTER/PLUS
      monthlyExpenses: 500, // Minimal: Vercel, Neon, domain, Stripe fees
      expenseGrowthRate: 0.02, // 2% monthly increase
      startingCash: 2000,
      startingCustomers: 0,
    },
  },
  {
    name: 'Moderate',
    assumptions: {
      // Some paid acquisition. Active content marketing. Product-market fit found.
      monthlyNewCustomers: [10, 15, 25, 35, 50, 65, 80, 95, 110, 125, 140, 155],
      monthlyChurnRate: 0.04, // 4% monthly churn
      arpu: 55, // Better mix: more SMART subscribers
      monthlyExpenses: 800,
      expenseGrowthRate: 0.03,
      startingCash: 2000,
      startingCustomers: 0,
    },
  },
  {
    name: 'Aggressive',
    assumptions: {
      // Product goes viral. Strong paid acquisition. Press coverage.
      monthlyNewCustomers: [20, 40, 80, 120, 180, 250, 320, 400, 480, 560, 640, 720],
      monthlyChurnRate: 0.03, // 3% monthly churn (better retention with scale)
      arpu: 65, // Higher ARPU as SMART and PRO gain traction
      monthlyExpenses: 1500,
      expenseGrowthRate: 0.05,
      startingCash: 2000,
      startingCustomers: 0,
    },
  },
];

// Run all scenarios
export function runAllScenarios(): Record<string, MonthlyProjection[]> {
  const results: Record<string, MonthlyProjection[]> = {};
  for (const scenario of STONE_AI_SCENARIOS) {
    results[scenario.name] = projectRevenue(scenario, 24);
  }
  return results;
}
```

### ARPU Calculation by Plan Mix

```typescript
// The ARPU assumption is critical. Here's how to model it:

export function calculateWeightedARPU(planMix: {
  starterPct: number;
  plusPct: number;
  smartMonthlyPct: number;
  smartAnnualPct: number;
  proMonthlyPct: number;
  proAnnualPct: number;
}): number {
  return (
    planMix.starterPct * 19.99 +
    planMix.plusPct * 49.99 +
    planMix.smartMonthlyPct * 99.99 +
    planMix.smartAnnualPct * 79.99 +
    planMix.proMonthlyPct * 200.00 +
    planMix.proAnnualPct * 170.00
  );
}

// Expected plan distribution at different stages:
const EARLY_STAGE_MIX = {
  starterPct: 0.40, // 40% Starter
  plusPct: 0.25,     // 25% Plus
  smartMonthlyPct: 0.15, // 15% Smart Monthly
  smartAnnualPct: 0.10,  // 10% Smart Annual
  proMonthlyPct: 0.05,   // 5% Pro Monthly
  proAnnualPct: 0.05,    // 5% Pro Annual
};
// ARPU: $50.25

const MATURE_STAGE_MIX = {
  starterPct: 0.25,
  plusPct: 0.20,
  smartMonthlyPct: 0.15,
  smartAnnualPct: 0.20,
  proMonthlyPct: 0.08,
  proAnnualPct: 0.12,
};
// ARPU: $68.80
```

---

## 3. Burn Rate Calculation

### What Is Burn Rate?

**Gross Burn Rate** = Total monthly expenses
**Net Burn Rate** = Total monthly expenses - Total monthly revenue
**Runway** = Cash on hand / Net Burn Rate (in months)

```typescript
// src/lib/forecasting/burn-rate.ts

export interface BurnRateAnalysis {
  grossBurn: number;         // Total monthly spend
  netBurn: number;           // Spend minus revenue
  revenue: number;           // Monthly revenue
  cashOnHand: number;        // Current cash
  runwayMonths: number;      // Months of cash remaining
  breakEvenDate: Date | null; // When revenue >= expenses
  burningCash: boolean;      // Is the company cash-flow negative?
}

export function calculateBurnRate(params: {
  monthlyRevenue: number;
  monthlyExpenses: {
    hosting: number;        // Vercel, Neon, Cloudflare
    saas: number;          // Stripe fees, Clerk, monitoring tools
    marketing: number;     // Ad spend, content creation
    labor: number;         // Contractors, eventual employees
    misc: number;          // Domain, legal, accounting
  };
  cashOnHand: number;
  revenueGrowthRate: number;  // Monthly growth rate
  expenseGrowthRate: number;  // Monthly growth rate
}): BurnRateAnalysis {
  const grossBurn = Object.values(params.monthlyExpenses).reduce((a, b) => a + b, 0);
  const netBurn = grossBurn - params.monthlyRevenue;

  let breakEvenDate: Date | null = null;
  if (netBurn > 0) {
    // Find when revenue catches up to expenses
    let projectedRevenue = params.monthlyRevenue;
    let projectedExpenses = grossBurn;
    for (let month = 1; month <= 60; month++) {
      projectedRevenue *= (1 + params.revenueGrowthRate);
      projectedExpenses *= (1 + params.expenseGrowthRate);
      if (projectedRevenue >= projectedExpenses) {
        breakEvenDate = new Date();
        breakEvenDate.setMonth(breakEvenDate.getMonth() + month);
        break;
      }
    }
  }

  const runwayMonths = netBurn > 0
    ? Math.floor(params.cashOnHand / netBurn)
    : Infinity; // Profitable

  return {
    grossBurn,
    netBurn: Math.max(0, netBurn),
    revenue: params.monthlyRevenue,
    cashOnHand: params.cashOnHand,
    runwayMonths: runwayMonths === Infinity ? 999 : runwayMonths,
    breakEvenDate,
    burningCash: netBurn > 0,
  };
}
```

### Stone AI Expense Structure

```typescript
// Current (bootstrap phase) monthly expenses:
const STONE_AI_EXPENSES_BOOTSTRAP = {
  hosting: 40,      // Vercel Pro ($20) + Neon ($19) + Cloudflare (free)
  saas: 30,         // Stripe fees (~2.9% + 30c per transaction) + Clerk (free tier)
  marketing: 0,     // Organic only at bootstrap
  labor: 0,         // Founder-only
  misc: 20,         // Domain renewal amortized + misc
};
// Total: ~$90/month

// Growth phase (post-launch, paid marketing):
const STONE_AI_EXPENSES_GROWTH = {
  hosting: 100,     // Vercel scaling + Neon scaling
  saas: 150,        // Higher Stripe volume + Clerk paid tier
  marketing: 500,   // Ad spend + content
  labor: 0,         // Still founder-only
  misc: 50,
};
// Total: ~$800/month

// Scale phase (if revenue supports):
const STONE_AI_EXPENSES_SCALE = {
  hosting: 300,
  saas: 400,
  marketing: 2000,
  labor: 3000,      // Contract developer
  misc: 100,
};
// Total: ~$5,800/month
```

---

## 4. Break-Even Analysis

### The Break-Even Formula

```
Break-Even Point (customers) = Fixed Costs / (ARPU - Variable Cost Per Customer)

For SaaS:
Variable Cost Per Customer ≈ AI API costs + Stripe fees + marginal hosting

Example:
Fixed costs: $500/month
ARPU: $55/month
Variable cost/customer: $5/month (AI API + Stripe ~3%)
Contribution margin: $55 - $5 = $50/customer/month
Break-even: $500 / $50 = 10 paying customers
```

```typescript
// src/lib/forecasting/break-even.ts

export interface BreakEvenAnalysis {
  fixedCosts: number;
  variableCostPerCustomer: number;
  arpu: number;
  contributionMargin: number;
  breakEvenCustomers: number;
  breakEvenMRR: number;
  currentCustomers: number;
  customersNeeded: number;
  estimatedMonthsToBreakEven: number;
}

export function calculateBreakEven(params: {
  fixedMonthlyCosts: number;
  variableCostPerCustomer: number;
  arpu: number;
  currentPayingCustomers: number;
  monthlyCustomerGrowthRate: number;
}): BreakEvenAnalysis {
  const contributionMargin = params.arpu - params.variableCostPerCustomer;
  const breakEvenCustomers = Math.ceil(params.fixedMonthlyCosts / contributionMargin);
  const breakEvenMRR = breakEvenCustomers * params.arpu;

  const customersNeeded = Math.max(0, breakEvenCustomers - params.currentPayingCustomers);

  // Estimate months to break even at current growth rate
  let months = 0;
  let customers = params.currentPayingCustomers;
  while (customers < breakEvenCustomers && months < 120) {
    customers = Math.round(customers * (1 + params.monthlyCustomerGrowthRate));
    months++;
  }

  return {
    fixedCosts: params.fixedMonthlyCosts,
    variableCostPerCustomer: params.variableCostPerCustomer,
    arpu: params.arpu,
    contributionMargin,
    breakEvenCustomers,
    breakEvenMRR,
    currentCustomers: params.currentPayingCustomers,
    customersNeeded,
    estimatedMonthsToBreakEven: months,
  };
}

// Variable cost breakdown per customer:
const VARIABLE_COSTS = {
  aiApiCost: {
    local: 0, // Qwen on local hardware — no marginal cost
    cloud: {
      haiku: 0.005,    // ~$0.005 per message (Haiku fallback)
      sonnet: 0.03,    // ~$0.03 per message (Claude Sonnet)
    },
    averagePerCustomerPerMonth: 2.50, // Blended across tiers
  },
  stripeFees: {
    percentage: 0.029,  // 2.9%
    fixed: 0.30,        // $0.30 per transaction
    perCustomerPerMonth: 1.90, // Average on $55 ARPU
  },
  hosting: {
    marginalPerCustomer: 0.10, // Minimal per-user hosting cost at scale
  },
  total: 4.50, // ~$4.50 variable cost per paying customer per month
};
```

---

## 5. Sensitivity Analysis

### What-If Scenarios

```typescript
// src/lib/forecasting/sensitivity.ts

export interface SensitivityResult {
  variable: string;
  baseCase: number;
  pessimistic: number;
  optimistic: number;
  impact: {
    baseBreakEvenMonths: number;
    pessimisticBreakEvenMonths: number;
    optimisticBreakEvenMonths: number;
  };
}

export function runSensitivityAnalysis(): SensitivityResult[] {
  const baseScenario = STONE_AI_SCENARIOS[1]; // Moderate

  const variables = [
    {
      name: 'Monthly Churn Rate',
      base: 0.04,
      pessimistic: 0.08,
      optimistic: 0.02,
      apply: (scenario: Scenario, value: number) => {
        scenario.assumptions.monthlyChurnRate = value;
      },
    },
    {
      name: 'ARPU',
      base: 55,
      pessimistic: 35,
      optimistic: 75,
      apply: (scenario: Scenario, value: number) => {
        scenario.assumptions.arpu = value;
      },
    },
    {
      name: 'Customer Growth (multiplier)',
      base: 1.0,
      pessimistic: 0.5,
      optimistic: 1.5,
      apply: (scenario: Scenario, value: number) => {
        scenario.assumptions.monthlyNewCustomers =
          scenario.assumptions.monthlyNewCustomers.map(n => Math.round(n * value));
      },
    },
    {
      name: 'Monthly Expenses',
      base: 800,
      pessimistic: 1500,
      optimistic: 400,
      apply: (scenario: Scenario, value: number) => {
        scenario.assumptions.monthlyExpenses = value;
      },
    },
  ];

  return variables.map(v => {
    const scenarios = [v.pessimistic, v.base, v.optimistic].map(value => {
      const scenario = JSON.parse(JSON.stringify(baseScenario)) as Scenario;
      v.apply(scenario, value);
      const projections = projectRevenue(scenario, 36);
      const breakEvenMonth = projections.findIndex(p => p.netCashFlow >= 0);
      return breakEvenMonth === -1 ? 36 : breakEvenMonth + 1;
    });

    return {
      variable: v.name,
      baseCase: v.base,
      pessimistic: v.pessimistic,
      optimistic: v.optimistic,
      impact: {
        pessimisticBreakEvenMonths: scenarios[0],
        baseBreakEvenMonths: scenarios[1],
        optimisticBreakEvenMonths: scenarios[2],
      },
    };
  });
}
```

---

## 6. Cash Flow Forecasting

```typescript
// src/lib/forecasting/cash-flow.ts

export interface MonthlyCashFlow {
  month: string;
  // Inflows
  subscriptionRevenue: number;
  annualPrepayments: number;
  otherRevenue: number;
  totalInflow: number;
  // Outflows
  hostingCosts: number;
  saasCosts: number;
  marketingSpend: number;
  laborCosts: number;
  stripeFees: number;
  taxPayments: number;
  miscExpenses: number;
  totalOutflow: number;
  // Net
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

export function forecastCashFlow(
  months: number,
  startingBalance: number,
  monthlyMetrics: {
    mrr: number;
    mrrGrowthRate: number;
    annualSubscriberPct: number;
    expenses: Record<string, number>;
    expenseGrowthRate: number;
  }
): MonthlyCashFlow[] {
  const results: MonthlyCashFlow[] = [];
  let balance = startingBalance;
  let mrr = monthlyMetrics.mrr;
  let expenses = { ...monthlyMetrics.expenses };

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    const monthStr = date.toISOString().slice(0, 7);

    // Revenue
    const subscriptionRevenue = mrr;
    // Some months get annual prepayments (lump sum)
    const annualPrepayments = i % 12 === 0 ? mrr * monthlyMetrics.annualSubscriberPct * 11 : 0;
    const totalInflow = subscriptionRevenue + annualPrepayments;

    // Expenses
    const stripeFees = subscriptionRevenue * 0.029 + (mrr / monthlyMetrics.mrr || 1) * 50 * 0.30;
    const totalOutflow = Object.values(expenses).reduce((a, b) => a + b, 0) + stripeFees;

    const netCashFlow = totalInflow - totalOutflow;
    const openingBalance = balance;
    balance += netCashFlow;

    results.push({
      month: monthStr,
      subscriptionRevenue: round2(subscriptionRevenue),
      annualPrepayments: round2(annualPrepayments),
      otherRevenue: 0,
      totalInflow: round2(totalInflow),
      hostingCosts: round2(expenses.hosting ?? 0),
      saasCosts: round2(expenses.saas ?? 0),
      marketingSpend: round2(expenses.marketing ?? 0),
      laborCosts: round2(expenses.labor ?? 0),
      stripeFees: round2(stripeFees),
      taxPayments: 0,
      miscExpenses: round2(expenses.misc ?? 0),
      totalOutflow: round2(totalOutflow),
      netCashFlow: round2(netCashFlow),
      openingBalance: round2(openingBalance),
      closingBalance: round2(balance),
    });

    // Grow for next month
    mrr *= (1 + monthlyMetrics.mrrGrowthRate);
    for (const key of Object.keys(expenses)) {
      expenses[key] *= (1 + monthlyMetrics.expenseGrowthRate);
    }
  }

  return results;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

---

## 7. Three-Headed Monster Combined Forecasting

### Multi-Product Revenue Model

```typescript
// Stone AI, Best AI, and Stone AI Tools have different revenue profiles

export interface ThreeHeadedMonsterForecast {
  stoneAI: MonthlyProjection[];
  bestAI: MonthlyProjection[];
  stoneAITools: MonthlyProjection[];
  combined: {
    month: string;
    totalMRR: number;
    totalARR: number;
    totalCustomers: number;
    totalExpenses: number;
    netCashFlow: number;
    cumulativeCash: number;
  }[];
}

export function forecastThreeHeadedMonster(): ThreeHeadedMonsterForecast {
  const stoneAI = projectRevenue({
    name: 'Stone AI',
    assumptions: {
      monthlyNewCustomers: [10, 15, 25, 35, 50, 65, 80, 95, 110, 125, 140, 155],
      monthlyChurnRate: 0.04,
      arpu: 55,
      monthlyExpenses: 500,
      expenseGrowthRate: 0.03,
      startingCash: 2000,
      startingCustomers: 0,
    },
  }, 24);

  // Best AI launches ~18 weeks after Stone AI
  const bestAIDelay = 5; // months
  const bestAI = projectRevenue({
    name: 'Best AI',
    assumptions: {
      monthlyNewCustomers: [0, 0, 0, 0, 0, 5, 10, 20, 35, 50, 70, 90],
      monthlyChurnRate: 0.05,
      arpu: 12, // Mobile app — lower ARPU
      monthlyExpenses: 200,
      expenseGrowthRate: 0.04,
      startingCash: 0, // Funded by Stone AI revenue
      startingCustomers: 0,
    },
  }, 24);

  // Stone AI Tools launches same week as Best AI
  const tools = projectRevenue({
    name: 'Stone AI Tools',
    assumptions: {
      monthlyNewCustomers: [0, 0, 0, 0, 0, 3, 8, 15, 25, 40, 55, 70],
      monthlyChurnRate: 0.03,
      arpu: 30, // API usage — metered billing
      monthlyExpenses: 150,
      expenseGrowthRate: 0.03,
      startingCash: 0,
      startingCustomers: 0,
    },
  }, 24);

  // Combined view
  const combined = stoneAI.map((sa, i) => ({
    month: sa.date,
    totalMRR: sa.mrr + (bestAI[i]?.mrr ?? 0) + (tools[i]?.mrr ?? 0),
    totalARR: (sa.mrr + (bestAI[i]?.mrr ?? 0) + (tools[i]?.mrr ?? 0)) * 12,
    totalCustomers: sa.totalCustomers + (bestAI[i]?.totalCustomers ?? 0) + (tools[i]?.totalCustomers ?? 0),
    totalExpenses: sa.expenses + (bestAI[i]?.expenses ?? 0) + (tools[i]?.expenses ?? 0),
    netCashFlow: sa.netCashFlow + (bestAI[i]?.netCashFlow ?? 0) + (tools[i]?.netCashFlow ?? 0),
    cumulativeCash: sa.cumulativeCash + (bestAI[i]?.cumulativeCash ?? 0) + (tools[i]?.cumulativeCash ?? 0),
  }));

  return { stoneAI, bestAI, stoneAITools: tools, combined };
}
```

---

## 8. Milestone Tracking

### Key Financial Milestones

```typescript
export const MILESTONES = [
  { name: 'First paying customer', metric: 'customers', target: 1 },
  { name: '$100 MRR', metric: 'mrr', target: 100 },
  { name: '$500 MRR', metric: 'mrr', target: 500 },
  { name: '$1,000 MRR (Ramen profitable)', metric: 'mrr', target: 1000 },
  { name: 'Break-even', metric: 'netCashFlow', target: 0 },
  { name: '100 paying customers', metric: 'customers', target: 100 },
  { name: '$5,000 MRR', metric: 'mrr', target: 5000 },
  { name: '$10,000 MRR', metric: 'mrr', target: 10000 },
  { name: '$100,000 ARR', metric: 'arr', target: 100000 },
  { name: '1,000 paying customers', metric: 'customers', target: 1000 },
  { name: '$1M ARR', metric: 'arr', target: 1000000 },
];

export function estimateMilestoneTimelines(
  projections: MonthlyProjection[]
): { milestone: string; estimatedMonth: number | null; estimatedDate: string | null }[] {
  return MILESTONES.map(milestone => {
    const reachedMonth = projections.findIndex(p => {
      switch (milestone.metric) {
        case 'customers': return p.totalCustomers >= milestone.target;
        case 'mrr': return p.mrr >= milestone.target;
        case 'arr': return p.arr >= milestone.target;
        case 'netCashFlow': return p.netCashFlow >= milestone.target;
        default: return false;
      }
    });

    return {
      milestone: milestone.name,
      estimatedMonth: reachedMonth >= 0 ? reachedMonth + 1 : null,
      estimatedDate: reachedMonth >= 0 ? projections[reachedMonth].date : null,
    };
  });
}
```

---

## 9. Key Assumptions and Risk Factors

### Assumption Validation

Every forecast is only as good as its assumptions. Here are Stone AI's key assumptions and how to validate them:

| Assumption | How to Validate | Update Frequency |
|---|---|---|
| Monthly churn rate | Actual churn from Stripe data | Monthly |
| New customer growth | Actual signups + conversion rate | Weekly |
| ARPU | Actual MRR / paying customers | Monthly |
| Plan distribution | Actual tier breakdown | Monthly |
| Variable cost per user | AI API costs + Stripe fees | Monthly |
| Marketing ROI | CAC vs customer value | Monthly |

### Risk Factors

| Risk | Impact | Mitigation |
|---|---|---|
| Higher churn than expected | Lower MRR, longer break-even | Improve onboarding, dunning, product value |
| Lower conversion (free→paid) | Fewer customers, higher CAC | Optimize trial, improve value prop |
| AI API cost increase | Lower margins | Local AI (Qwen) reduces dependency |
| Competitor launches | Customer acquisition harder | Unique features (Bestie, agents) |
| Single revenue stream | Business fragility | Three-Headed Monster diversification |

---

## Summary

This seed provides the complete financial forecasting toolkit for Stone AI and the Three-Headed Monster:

1. **Revenue projection models** with three scenarios (conservative, moderate, aggressive)
2. **ARPU calculation** based on plan mix distribution
3. **Burn rate analysis** including gross/net burn and runway estimation
4. **Break-even analysis** with variable cost breakdown
5. **Sensitivity analysis** for key variables (churn, ARPU, growth, expenses)
6. **Cash flow forecasting** with monthly inflow/outflow detail
7. **Multi-product forecasting** combining Stone AI, Best AI, and Tools revenue
8. **Milestone tracking** from first customer to $1M ARR
9. **Risk factor identification** with mitigation strategies

All models are implemented in TypeScript and can be run programmatically to generate updated forecasts as actual data accumulates. The models are designed to be simple enough to run quickly but detailed enough to make real business decisions.
