# Revenue Reporting Automation — Stone AI Ecosystem

## Seed Classification
- **Domain**: Revenue Operations / Financial Reporting
- **Complexity**: Advanced
- **Stack**: Stripe API, Stripe Sigma, Next.js 16, TypeScript, Prisma 7.4
- **Applies To**: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Automated Reporting Architecture

### The Reporting Problem

Manual revenue reporting is a founder tax — hours spent every month extracting data from Stripe, calculating MRR, segmenting by plan tier, reconciling with bank statements, and building spreadsheets. Automated reporting eliminates this entirely: real-time dashboards update themselves, scheduled reports land in your inbox, and financial data is always accurate because it comes directly from Stripe (the source of truth).

### Reporting Stack

```
Data Sources                 Processing              Output
┌──────────┐               ┌──────────┐            ┌──────────┐
│ Stripe   │──webhooks──→  │ Next.js  │──render──→ │ Dashboard│
│ Billing  │               │ API      │            │ (in-app) │
└──────────┘               │ Routes   │            └──────────┘
                           │          │
┌──────────┐               │          │──email──→  ┌──────────┐
│ Stripe   │──query──→     │ Cron     │            │ Reports  │
│ Sigma    │               │ Jobs     │            │ (inbox)  │
└──────────┘               └──────────┘            └──────────┘
                                │
┌──────────┐                    │                   ┌──────────┐
│ Prisma   │──query──→─────────┘──export──→        │ CSV/PDF  │
│ Database │                                        │ (archive)│
└──────────┘                                        └──────────┘
```

---

## 2. Core Revenue Metrics (Automated Calculation)

### MRR Calculation

```typescript
// Automated MRR calculation from Stripe
async function calculateMRR(): Promise<{
  totalMRR: number;
  byPlan: Record<string, number>;
  byProduct: Record<string, number>;
  changes: {
    newMRR: number;
    expansionMRR: number;
    contractionMRR: number;
    churnedMRR: number;
    reactivatedMRR: number;
    netNewMRR: number;
  };
}> {
  const subscriptions = await stripe.subscriptions.list({
    status: 'active',
    expand: ['data.items.data.price'],
    limit: 100, // paginate for more
  });

  let totalMRR = 0;
  const byPlan: Record<string, number> = {};
  const byProduct: Record<string, number> = {};

  for (const sub of subscriptions.data) {
    for (const item of sub.items.data) {
      const price = item.price;
      let monthlyAmount: number;

      if (price.recurring?.interval === 'year') {
        monthlyAmount = (price.unit_amount || 0) / 12 / 100;
      } else {
        monthlyAmount = (price.unit_amount || 0) / 100;
      }

      // Apply any subscription-level discount
      if (sub.discount?.coupon?.percent_off) {
        monthlyAmount *= (1 - sub.discount.coupon.percent_off / 100);
      }

      totalMRR += monthlyAmount;

      const planName = price.lookup_key || price.id;
      byPlan[planName] = (byPlan[planName] || 0) + monthlyAmount;

      const productId = typeof price.product === 'string'
        ? price.product : price.product.id;
      const productName = getProductName(productId);
      byProduct[productName] = (byProduct[productName] || 0) + monthlyAmount;
    }
  }

  // Calculate MRR movements (compare to last month)
  const changes = await calculateMRRMovements();

  return { totalMRR, byPlan, byProduct, changes };
}
```

### ARR Projection

```typescript
function calculateARR(mrr: number): number {
  return mrr * 12;
}

function projectARR(currentMRR: number, monthlyGrowthRate: number, months: number): number {
  return currentMRR * Math.pow(1 + monthlyGrowthRate, months) * 12;
}
```

### MRR Movement Tracking

MRR movements show WHERE revenue is changing:

```typescript
interface MRRMovements {
  newMRR: number;          // From brand new customers
  expansionMRR: number;    // From upgrades (e.g., STARTER → SMART)
  contractionMRR: number;  // From downgrades (e.g., SMART → PLUS)
  churnedMRR: number;      // From cancellations
  reactivatedMRR: number;  // From previously churned customers returning
  netNewMRR: number;       // Sum of all movements
}

async function calculateMRRMovements(): Promise<MRRMovements> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Get all subscription events this month from Stripe
  const events = await stripe.events.list({
    type: 'customer.subscription.updated',
    created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
  });

  const movements: MRRMovements = {
    newMRR: 0, expansionMRR: 0, contractionMRR: 0,
    churnedMRR: 0, reactivatedMRR: 0, netNewMRR: 0,
  };

  // Process each subscription change event
  for (const event of events.data) {
    const sub = event.data.object as Stripe.Subscription;
    const prev = event.data.previous_attributes as any;

    if (prev?.status === 'canceled' && sub.status === 'active') {
      movements.reactivatedMRR += getMRRFromSubscription(sub);
    } else if (sub.status === 'canceled') {
      movements.churnedMRR += getMRRFromSubscription(sub);
    } else if (prev?.items) {
      const oldMRR = calculateItemsMRR(prev.items);
      const newMRR = getMRRFromSubscription(sub);
      if (newMRR > oldMRR) movements.expansionMRR += (newMRR - oldMRR);
      else movements.contractionMRR += (oldMRR - newMRR);
    }
  }

  // New subscriptions
  const newSubs = await stripe.subscriptions.list({
    created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
    status: 'active',
  });
  for (const sub of newSubs.data) {
    movements.newMRR += getMRRFromSubscription(sub);
  }

  movements.netNewMRR = movements.newMRR + movements.expansionMRR
    + movements.reactivatedMRR - movements.contractionMRR - movements.churnedMRR;

  return movements;
}
```

---

## 3. Stripe Sigma

### What Is Stripe Sigma?

Stripe Sigma lets you write SQL queries directly against your Stripe data. It's like having a read-only database of every Stripe object (customers, subscriptions, invoices, charges, refunds) that updates in near-real-time.

**Cost**: $10/month (included with Stripe billing at certain volumes)

### Useful Sigma Queries

**Monthly Revenue by Plan:**
```sql
SELECT
  p.name as plan_name,
  SUM(ii.amount) / 100.0 as revenue,
  COUNT(DISTINCT s.customer) as customer_count
FROM subscriptions s
JOIN subscription_items si ON s.id = si.subscription
JOIN invoice_items ii ON si.id = ii.subscription_item
JOIN prices pr ON si.price = pr.id
JOIN products p ON pr.product = p.id
WHERE ii.period_start >= DATE_TRUNC('month', CURRENT_DATE)
  AND s.status = 'active'
GROUP BY p.name
ORDER BY revenue DESC;
```

**Churn Rate This Month:**
```sql
SELECT
  COUNT(CASE WHEN status = 'canceled'
    AND canceled_at >= DATE_TRUNC('month', CURRENT_DATE)
    THEN 1 END) as churned,
  COUNT(CASE WHEN created < DATE_TRUNC('month', CURRENT_DATE)
    AND status IN ('active', 'canceled')
    THEN 1 END) as start_of_month_total,
  ROUND(
    COUNT(CASE WHEN status = 'canceled'
      AND canceled_at >= DATE_TRUNC('month', CURRENT_DATE)
      THEN 1 END)::NUMERIC /
    NULLIF(COUNT(CASE WHEN created < DATE_TRUNC('month', CURRENT_DATE)
      THEN 1 END), 0) * 100, 2
  ) as churn_rate_percent
FROM subscriptions;
```

**Revenue by Billing Period (Monthly vs Annual):**
```sql
SELECT
  CASE WHEN pr.recurring_interval = 'year' THEN 'Annual'
       ELSE 'Monthly' END as billing_period,
  COUNT(DISTINCT s.id) as subscriptions,
  SUM(pr.unit_amount) / 100.0 as total_price,
  SUM(CASE WHEN pr.recurring_interval = 'year'
    THEN pr.unit_amount / 12.0
    ELSE pr.unit_amount END) / 100.0 as normalized_mrr
FROM subscriptions s
JOIN subscription_items si ON s.id = si.subscription
JOIN prices pr ON si.price = pr.id
WHERE s.status = 'active'
GROUP BY billing_period;
```

**Failed Payments This Month:**
```sql
SELECT
  c.email,
  ch.amount / 100.0 as amount,
  ch.failure_code,
  ch.failure_message,
  ch.created as failed_at
FROM charges ch
JOIN customers c ON ch.customer = c.id
WHERE ch.status = 'failed'
  AND ch.created >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY ch.created DESC;
```

---

## 4. Accounting Integration

### Chart of Accounts for SaaS Revenue

```
Revenue
├── 4000 - Subscription Revenue
│   ├── 4010 - Stone AI Subscriptions
│   ├── 4020 - Best AI Mobile Subscriptions
│   └── 4030 - Stone AI Tools Subscriptions
├── 4100 - Usage Revenue
│   └── 4110 - Stone AI Tools API Usage
├── 4200 - One-Time Revenue
│   └── 4210 - Setup Fees / One-Time Purchases
└── 4900 - Discounts & Credits
    ├── 4910 - Promotional Discounts
    ├── 4920 - Ecosystem Discounts
    └── 4930 - Refunds & Credits

Cost of Revenue
├── 5000 - Infrastructure
│   ├── 5010 - AI Model Costs (vLLM/Claude API)
│   ├── 5020 - Hosting (Vercel)
│   ├── 5030 - Database (Neon)
│   └── 5040 - CDN & Bandwidth (Cloudflare)
├── 5100 - Payment Processing
│   ├── 5110 - Stripe Fees (2.9% + $0.30)
│   └── 5120 - App Store Fees (15-30%)
└── 5200 - Support
    └── 5210 - Customer Support Tools
```

### Revenue Recognition (ASC 606)

SaaS revenue recognition rules:
- **Monthly subscriptions**: Recognize monthly as service is delivered
- **Annual subscriptions**: Recognize 1/12 per month (deferred revenue for unearned portion)
- **Usage-based revenue**: Recognize in the month the usage occurs
- **Promotional credits**: Reduce recognized revenue in the month applied

```typescript
// Monthly revenue recognition calculation
async function recognizeRevenue(month: Date): Promise<{
  recognized: number;
  deferred: number;
}> {
  let recognized = 0;
  let deferred = 0;

  const activeSubscriptions = await stripe.subscriptions.list({
    status: 'active',
    expand: ['data.items.data.price'],
  });

  for (const sub of activeSubscriptions.data) {
    for (const item of sub.items.data) {
      const price = item.price;

      if (price.recurring?.interval === 'month') {
        // Monthly: full amount recognized this month
        recognized += (price.unit_amount || 0) / 100;
      } else if (price.recurring?.interval === 'year') {
        // Annual: 1/12 recognized, 11/12 deferred
        const monthlyPortion = (price.unit_amount || 0) / 12 / 100;
        recognized += monthlyPortion;

        const monthsRemaining = getMonthsRemainingInAnnualSub(sub);
        deferred += monthlyPortion * monthsRemaining;
      }
    }
  }

  return { recognized, deferred };
}
```

---

## 5. Tax Reporting

### Sales Tax / VAT Considerations

SaaS products sold digitally have complex tax obligations:
- **US**: Sales tax varies by state (nexus rules)
- **EU**: VAT applies based on customer location (not seller location)
- **UK**: 20% VAT on digital services
- **Canada**: GST/HST varies by province
- **Japan**: 10% consumption tax (Japanese Invoice System)

### Stripe Tax Integration

```typescript
// Enable Stripe Tax for automatic tax calculation
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  automatic_tax: { enabled: true },
});

// Stripe Tax handles:
// - Determining applicable tax rates based on customer location
// - Calculating tax amounts
// - Including tax on invoices
// - Generating tax summaries for filing
```

### Tax Reporting Exports

```typescript
// Generate tax report for a given period
async function generateTaxReport(startDate: Date, endDate: Date) {
  const invoices = await stripe.invoices.list({
    created: {
      gte: Math.floor(startDate.getTime() / 1000),
      lte: Math.floor(endDate.getTime() / 1000),
    },
    status: 'paid',
    expand: ['data.tax', 'data.customer'],
  });

  const taxReport = invoices.data.map(invoice => ({
    invoiceId: invoice.id,
    customerEmail: (invoice.customer as Stripe.Customer).email,
    customerCountry: invoice.customer_address?.country,
    subtotal: invoice.subtotal / 100,
    taxAmount: invoice.tax / 100,
    taxRate: invoice.tax && invoice.subtotal
      ? ((invoice.tax / invoice.subtotal) * 100).toFixed(2) + '%'
      : '0%',
    total: invoice.total / 100,
    currency: invoice.currency,
    date: new Date(invoice.created * 1000).toISOString(),
  }));

  return taxReport;
}
```

---

## 6. Automated Report Templates

### Daily Revenue Alert

Sent every morning via sendFounderAlert():

```
Subject: Daily Revenue — [Date]

Yesterday's Revenue: $X,XXX.XX
├── Stone AI: $X,XXX
├── Tools:    $XXX
├── Mobile:   $XXX

New Customers: XX
Churned: XX
Failed Payments: XX ($$,XXX at risk)

MRR: $XX,XXX (↑$XXX vs yesterday)
```

### Weekly Revenue Report

```
Subject: Weekly Revenue Report — Week of [Date]

REVENUE
Total this week: $XX,XXX
vs. last week: ↑XX% ($X,XXX)
vs. same week last month: ↑XX%

MRR: $XX,XXX | ARR: $XXX,XXX

NEW CUSTOMERS: XX
├── Free: XX
├── Starter: XX
├── Plus: XX
├── Smart: XX
├── Pro: XX

CHURN: XX customers, $X,XXX MRR lost
EXPANSION: XX upgrades, $X,XXX MRR gained
NET: +$X,XXX MRR

PAYMENT HEALTH
├── Success rate: XX.X%
├── Failed payments: XX ($X,XXX)
├── Recovered: XX ($X,XXX)
└── At risk: XX ($X,XXX)
```

### Monthly Financial Report

```
Subject: Monthly Financial Report — [Month Year]

REVENUE SUMMARY
Total Revenue: $XX,XXX
├── Subscription: $XX,XXX
├── Usage (Tools): $X,XXX
├── Less: Refunds ($XXX)
├── Less: Discounts ($X,XXX)
└── Net Revenue: $XX,XXX

MRR MOVEMENTS
├── Starting MRR: $XX,XXX
├── + New: $X,XXX
├── + Expansion: $X,XXX
├── + Reactivation: $XXX
├── - Contraction: ($XXX)
├── - Churn: ($X,XXX)
└── Ending MRR: $XX,XXX (Net: +$X,XXX)

CUSTOMER METRICS
├── Total customers: X,XXX
├── Paid customers: XXX
├── Free-to-paid rate: X.X%
├── Churn rate: X.X%
├── ARPU: $XX.XX
├── LTV: $XXX
└── LTV:CAC ratio: X.X:1

PLAN DISTRIBUTION
├── FREE: X,XXX (XX%)
├── STARTER: XXX (XX%)
├── PLUS: XXX (XX%)
├── SMART: XXX (XX%)
└── PRO: XX (XX%)

BILLING HEALTH
├── Payment success rate: XX.X%
├── Involuntary churn rate: X.X%
├── Average dunning recovery: XX%
└── Outstanding receivables: $X,XXX
```

### Implementation

```typescript
// Cron job schedule for automated reports
const reportSchedule = {
  daily: {
    cron: '0 8 * * *', // 8 AM daily
    handler: generateDailyAlert,
    delivery: 'email', // sendFounderAlert
  },
  weekly: {
    cron: '0 9 * * 1', // 9 AM every Monday
    handler: generateWeeklyReport,
    delivery: 'email',
  },
  monthly: {
    cron: '0 10 1 * *', // 10 AM on 1st of month
    handler: generateMonthlyReport,
    delivery: 'email + dashboard',
  },
};
```
