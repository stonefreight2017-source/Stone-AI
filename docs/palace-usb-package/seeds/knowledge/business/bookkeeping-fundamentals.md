# Bookkeeping Fundamentals for SaaS Companies

## Seed Classification
- **Domain**: Finance & Accounting
- **Complexity**: Intermediate
- **Applicability**: All SaaS businesses, solopreneurs to Series A
- **Last Updated**: 2026-03-09

---

## Why Bookkeeping Matters for SaaS Founders

Every dollar that moves through your business tells a story. Bookkeeping is how you read that story — and more importantly, how the IRS, investors, and your future self will read it. Most SaaS founders treat bookkeeping as a chore they'll "deal with later." That's how you end up with a $15K surprise tax bill, a failed audit, or an investor who walks because your books are a mess.

Good bookkeeping is not optional. It is the foundation of every financial decision you make — pricing, hiring, fundraising, tax strategy, and knowing whether you're actually profitable or just burning cash with good vibes.

---

## Double-Entry Accounting

### The Core Principle

Every financial transaction affects at least two accounts. For every debit, there is an equal and opposite credit. This is not a suggestion — it is the fundamental law of accounting that has governed commerce since Luca Pacioli formalized it in 1494.

### Debits and Credits Demystified

The most common confusion in accounting. Here's the actual rule:

| Account Type | Debit Increases | Credit Increases |
|---|---|---|
| Assets | Yes | No |
| Liabilities | No | Yes |
| Equity | No | Yes |
| Revenue | No | Yes |
| Expenses | Yes | No |

### How It Works in Practice

**Example: Customer pays $99/month subscription**

| Account | Debit | Credit |
|---|---|---|
| Cash (Asset) | $99 | |
| Subscription Revenue | | $99 |

Cash goes up (debit to asset), revenue goes up (credit to revenue). The books balance.

**Example: You pay $500 for cloud hosting**

| Account | Debit | Credit |
|---|---|---|
| Hosting Expense | $500 | |
| Cash (Asset) | | $500 |

Expense goes up (debit to expense), cash goes down (credit to asset). Books still balance.

**Example: Customer pays annual subscription upfront — $1,188 for 12 months**

| Account | Debit | Credit |
|---|---|---|
| Cash (Asset) | $1,188 | |
| Deferred Revenue (Liability) | | $1,188 |

You received the cash, but you haven't earned it yet. Each month, you recognize $99:

| Account | Debit | Credit |
|---|---|---|
| Deferred Revenue (Liability) | $99 | |
| Subscription Revenue | | $99 |

This is revenue recognition — one of the most important concepts in SaaS accounting.

### The Accounting Equation

**Assets = Liabilities + Equity**

Every transaction must keep this equation in balance. If it doesn't, something is wrong. This is your universal error-check.

### Why Double-Entry Matters for SaaS

Single-entry bookkeeping (just tracking money in/out) will fail you because:
- You can't track deferred revenue (critical for annual subscriptions)
- You can't separate accounts receivable from actual cash
- You can't generate a proper balance sheet for investors
- You can't pass an audit
- You can't calculate true profitability per product line

---

## Chart of Accounts for SaaS

Your chart of accounts is the skeleton of your financial system. Every transaction gets categorized into one of these accounts. Get this right from day one and you'll never have to reclassify thousands of transactions later.

### Asset Accounts (1000-1999)

```
1000 — Checking Account (Primary)
1010 — Savings Account (Reserve)
1020 — Stripe Balance (Pending Settlement)
1030 — PayPal Balance
1100 — Accounts Receivable
1200 — Prepaid Expenses
1210 — Prepaid Software Subscriptions
1220 — Prepaid Insurance
1300 — Security Deposits
1400 — Equipment (Computers, Servers)
1410 — Accumulated Depreciation — Equipment
1500 — Domain Names & IP (Intangible Assets)
```

### Liability Accounts (2000-2999)

```
2000 — Accounts Payable
2100 — Credit Card Payable
2200 — Deferred Revenue (Monthly)
2210 — Deferred Revenue (Annual)
2300 — Accrued Expenses
2310 — Accrued Payroll
2320 — Accrued Taxes
2400 — Sales Tax Payable
2500 — Loan Payable
```

### Equity Accounts (3000-3999)

```
3000 — Owner's Equity / Capital
3100 — Owner's Draws
3200 — Retained Earnings
3300 — Additional Paid-In Capital (if incorporated)
```

### Revenue Accounts (4000-4999)

```
4000 — Subscription Revenue — FREE Tier (tracking only, $0)
4010 — Subscription Revenue — STARTER
4020 — Subscription Revenue — PLUS
4030 — Subscription Revenue — SMART
4040 — Subscription Revenue — PRO
4050 — Promotional Revenue (discounted first month)
4100 — Annual Subscription Revenue — SMART
4110 — Annual Subscription Revenue — PRO
4200 — Enterprise Revenue
4300 — Referral Revenue Share
4400 — Interest Income
4500 — Other Income
```

### Cost of Goods Sold (5000-5999)

```
5000 — Cloud Infrastructure (Vercel, Neon, AWS)
5010 — AI API Costs (Anthropic, vLLM compute)
5020 — Payment Processing Fees (Stripe)
5030 — CDN & Bandwidth (Cloudflare)
5040 — Third-Party API Costs (Clerk, etc.)
5050 — Customer Support Tools
```

### Operating Expense Accounts (6000-6999)

```
6000 — Payroll & Wages
6010 — Contractor Payments
6020 — Employee Benefits
6100 — Software Subscriptions (Internal Tools)
6110 — Development Tools & Licenses
6120 — Design Tools
6200 — Marketing — Paid Advertising
6210 — Marketing — Content & SEO
6220 — Marketing — Social Media
6230 — Marketing — Influencer
6240 — Marketing — PR
6300 — Office Supplies
6310 — Equipment Purchases (<$2,500)
6320 — Equipment Repairs
6400 — Professional Services — Legal
6410 — Professional Services — Accounting/Tax
6420 — Professional Services — Consulting
6500 — Insurance — General Liability
6510 — Insurance — E&O / Cyber
6600 — Bank Fees
6610 — Merchant Processing Fees
6700 — Travel & Meals (Business)
6800 — Education & Training
6900 — Depreciation Expense
6910 — Amortization Expense
```

### Customizing for Your Business

The chart above is a starting template. Rules for customization:
- **Never delete accounts that have transactions**. Mark them inactive instead.
- **Sub-accounts are your friend**. 6200 Marketing with sub-accounts lets you see total marketing spend AND individual channel spend.
- **Match your revenue accounts to your pricing tiers**. When an investor asks "What's SMART tier revenue?" you should answer in 10 seconds.
- **Keep COGS separate from operating expenses**. COGS directly supports delivery of your product. OpEx is everything else.

---

## Accrual vs. Cash Basis Accounting

### Cash Basis

**Revenue is recorded when cash is received. Expenses are recorded when cash is paid.**

Pros:
- Simple to understand
- Easy to implement
- You always know your cash position
- Acceptable for businesses under $25M revenue (IRS threshold)

Cons:
- Misleading for subscription businesses
- Annual prepayments inflate revenue in the month received
- Doesn't match expenses to the periods they benefit
- Not GAAP compliant
- Investors won't accept it for due diligence

### Accrual Basis

**Revenue is recorded when earned. Expenses are recorded when incurred.**

Pros:
- Accurate picture of financial health
- Matches revenue to the period it's earned
- GAAP compliant
- Required for investor reporting
- Handles deferred revenue correctly

Cons:
- More complex to implement
- Need to track receivables and payables
- Requires monthly adjusting entries
- Cash flow isn't immediately obvious from P&L

### Which Should You Use?

**Start with accrual.** Here's why:

If you're a SaaS company with any annual plans, cash basis will lie to you. A customer pays $960 upfront for an annual PRO plan. Cash basis says you made $960 in January. Reality says you earned $80 in January and owe the customer 11 more months of service.

Accrual basis gets this right. You record $960 as deferred revenue (a liability) and recognize $80/month as you deliver the service.

If you're truly solo, pre-revenue, and just tracking personal expenses — cash basis is fine temporarily. But switch to accrual before you take your first customer payment.

### Modified Cash Basis (The Pragmatic Middle)

Some small SaaS companies use a hybrid:
- Day-to-day transactions on cash basis (simpler data entry)
- Monthly adjusting entries for deferred revenue, prepaid expenses, and depreciation
- Financial statements presented on accrual basis

This gives you the simplicity of cash-basis bookkeeping with the accuracy of accrual-basis reporting. Most accounting software supports this workflow.

---

## Monthly Close Process

The monthly close is your financial hygiene routine. Skip it and your books rot. Do it consistently and you'll always know your financial position within 5 business days of month-end.

### Pre-Close Checklist (Days 1-3 After Month End)

1. **Reconcile all bank accounts**
   - Download bank statements for the month
   - Match every transaction in your accounting software to a bank transaction
   - Investigate any discrepancies immediately
   - Mark reconciliation complete with the ending balance

2. **Reconcile Stripe**
   - Compare Stripe dashboard revenue to your books
   - Account for processing fees (usually 2.9% + $0.30)
   - Verify refunds are recorded
   - Match Stripe payouts to bank deposits (note: Stripe batches payouts, so timing differences are normal)
   - Check for disputes/chargebacks

3. **Reconcile credit cards**
   - Match every charge to a categorized expense
   - Flag any personal charges for removal
   - Verify auto-renewals are still active and needed

4. **Review accounts receivable**
   - Any invoices past due? Follow up.
   - Write off uncollectable amounts (after 90 days, typically)
   - Verify payment terms are being honored

5. **Review accounts payable**
   - Any bills you haven't recorded?
   - Check for upcoming payments due
   - Verify contractor invoices match agreements

### Adjusting Entries (Days 3-4)

6. **Revenue recognition**
   - Calculate monthly portion of all annual subscriptions
   - Debit Deferred Revenue, Credit Subscription Revenue
   - Verify MRR in your billing system matches your books

7. **Prepaid expense amortization**
   - Annual software subscriptions paid upfront → recognize monthly
   - Insurance premiums → recognize monthly
   - Any other prepaid items

8. **Depreciation**
   - Compute monthly depreciation for all fixed assets
   - Standard method for hardware: straight-line over 3-5 years
   - Example: $3,000 laptop → $50/month depreciation over 5 years

9. **Accrued expenses**
   - Record expenses incurred but not yet paid
   - Contractor work completed but not invoiced
   - Utilities, services used but billed next month

### Review and Close (Days 4-5)

10. **Generate financial statements**
    - Profit & Loss (Income Statement)
    - Balance Sheet
    - Cash Flow Statement

11. **Variance analysis**
    - Compare to budget: Any line item >10% off? Investigate.
    - Compare to prior month: Any unusual swings?
    - Compare to prior year same month: Trending correctly?

12. **Key metrics calculation**
    - MRR / ARR
    - Gross margin (Revenue minus COGS)
    - Operating margin
    - Burn rate (if pre-profit)
    - Runway remaining

13. **Lock the period**
    - Prevent any new entries in the closed month
    - Most accounting software has a "close books" date feature
    - Use it. Future-you will thank present-you.

### Monthly Close Calendar

| Day | Task |
|---|---|
| 1st | Download all statements, begin reconciliation |
| 2nd | Complete bank and Stripe reconciliation |
| 3rd | Credit card reconciliation, AR/AP review |
| 4th | Adjusting entries (revenue recognition, depreciation, accruals) |
| 5th | Generate statements, variance analysis, lock period |

---

## QuickBooks Online Setup for SaaS

### Why QuickBooks Online (QBO)

- Most accountants and bookkeepers know it
- Stripe integration is solid
- Scales from solopreneur to 50+ employees
- Generates all standard financial reports
- Simple bank feed reconciliation
- Starting at $30/month (Simple Start plan is sufficient initially)

### Initial Setup Walkthrough

1. **Create your QBO account**
   - Select "Simple Start" plan to begin
   - Enter your legal business name (matches your LLC/S-Corp filing)
   - Set fiscal year start month (usually January for calendar year)
   - Select "Accrual" as your accounting method

2. **Customize your chart of accounts**
   - Go to Settings → Chart of Accounts
   - Delete the default accounts you don't need
   - Add the SaaS-specific accounts from the chart above
   - Set account numbers (enable in Settings → Advanced → Chart of Accounts)
   - Create sub-accounts for granular tracking

3. **Connect your bank accounts**
   - Settings → Banking → Connect Account
   - Connect checking, savings, and credit cards
   - Let QBO download historical transactions (usually 90 days)
   - Set up bank rules for recurring transactions

4. **Connect Stripe**
   - Apps → Find Stripe → Connect
   - Map Stripe revenue to your subscription revenue accounts
   - Map Stripe fees to Payment Processing Fees (5020)
   - Set sync frequency to daily
   - Verify the first few synced transactions manually

5. **Set up products/services**
   - Create a "product" for each subscription tier
   - STARTER ($19.99/mo), PLUS ($49.99/mo), etc.
   - Map each to the correct revenue account
   - This enables per-tier revenue reporting

6. **Configure sales tax (if applicable)**
   - SaaS sales tax is a complex and evolving area
   - Currently, ~20 US states tax SaaS
   - Consult with a tax professional for your specific situation
   - If required, set up tax rates and collection in QBO

7. **Create recurring journal entries**
   - Monthly depreciation
   - Monthly amortization of prepaid expenses
   - Any other regular adjusting entries
   - Set them to auto-post on the 1st of each month

### Bank Rules (Time Savers)

Set up rules for recurring transactions so QBO auto-categorizes them:

| Vendor/Description | Category | Account |
|---|---|---|
| VERCEL | Cloud Infrastructure | 5000 |
| ANTHROPIC | AI API Costs | 5010 |
| STRIPE FEE | Payment Processing | 5020 |
| CLOUDFLARE | CDN & Bandwidth | 5030 |
| CLERK | Third-Party API Costs | 5040 |
| GITHUB | Development Tools | 6110 |
| FIGMA | Design Tools | 6120 |

### Reports to Run Monthly

1. **Profit & Loss** — Your income statement. Revenue minus expenses.
2. **Balance Sheet** — Assets, liabilities, equity snapshot.
3. **Cash Flow Statement** — Where cash came from and where it went.
4. **Profit & Loss by Product** — Revenue per subscription tier (requires products set up).
5. **Expense by Vendor** — Who are you paying the most? Any surprises?
6. **AR Aging** — Who owes you money and how long overdue?

---

## Wave Accounting (Free Alternative)

### When Wave Makes Sense

- Pre-revenue or very early stage
- Budget is extremely tight
- You don't need payroll integration yet
- You want $0/month for accounting software

### Wave Setup

1. Create account at waveapps.com
2. Add your business (LLC name, fiscal year)
3. Customize chart of accounts (similar to QBO process)
4. Connect bank accounts
5. Wave doesn't have native Stripe integration — you'll import CSV or use Zapier

### Wave Limitations

- No native Stripe sync (manual or Zapier required)
- Limited inventory tracking (not relevant for SaaS)
- Fewer third-party integrations
- Less robust reporting
- No project tracking
- Support is slower than QBO
- If you scale past ~$50K ARR, you'll likely outgrow it

### Migration Path: Wave → QBO

When you're ready to upgrade:
1. Export all transactions from Wave as CSV
2. Set up QBO with your chart of accounts
3. Import historical data into QBO
4. Verify balances match
5. Run parallel for one month before cutting over

---

## SaaS-Specific Bookkeeping Considerations

### Revenue Recognition (ASC 606)

The five-step model:
1. **Identify the contract** — Customer subscribes to a plan
2. **Identify performance obligations** — Access to the SaaS platform for the subscription period
3. **Determine transaction price** — Monthly or annual subscription amount
4. **Allocate to performance obligations** — Typically straightforward for SaaS (one obligation)
5. **Recognize revenue as obligations are satisfied** — Over time, as the service is delivered

For monthly subscriptions: recognize in full each month.
For annual subscriptions: recognize 1/12 each month.
For promotional pricing: recognize at the promotional rate for that period.

### Handling Refunds

When you issue a refund:
| Account | Debit | Credit |
|---|---|---|
| Subscription Revenue | $XX | |
| Cash/Stripe Balance | | $XX |

This reduces your revenue for the period. Never hide refunds in an expense account.

### Handling Chargebacks

Chargebacks have two components:
1. The refunded amount (same as above)
2. The chargeback fee ($15-25 from Stripe)

| Account | Debit | Credit |
|---|---|---|
| Subscription Revenue | $99 | |
| Bank Fees | $15 | |
| Cash/Stripe Balance | | $114 |

### Failed Payment Tracking

When a payment fails:
- No revenue is recorded (nothing was received)
- Track the failed amount in a CRM or billing notes (not in accounting)
- When the payment eventually succeeds, record normally
- If the payment never succeeds and you cancel the subscription, no accounting entry needed (you never recorded revenue)

### Multi-Currency Considerations

If you accept payments in non-USD currencies:
- Stripe converts to USD at settlement
- Record at the USD amount you actually received
- Foreign exchange gains/losses are minimal for SaaS (Stripe handles conversion)
- If you eventually support direct foreign currency, you'll need a multi-currency setup

### Contractor Payments (1099 Tracking)

For every US-based contractor paid $600+ in a calendar year:
- Collect W-9 before first payment
- Track all payments by contractor
- Issue 1099-NEC by January 31 of the following year
- QBO has built-in 1099 tracking — use it from day one

---

## Bookkeeping Automation Stack

### Recommended Integrations

| Tool | Purpose | Cost |
|---|---|---|
| QBO / Wave | Core accounting | $30/mo or Free |
| Stripe | Payment processing → auto-sync | Per transaction |
| Relay / Mercury | Business banking with QBO sync | Free |
| Dext / Receipt Bank | Receipt capture & categorization | $20/mo |
| Bench (optional) | Outsourced bookkeeping | $299/mo |

### Automation Rules

1. **Stripe → QBO sync**: Automatic. Every charge, refund, and payout syncs daily.
2. **Bank feed → QBO**: Automatic. Transactions appear for categorization within 24 hours.
3. **Bank rules**: Set once, auto-categorize forever. Review monthly for accuracy.
4. **Recurring journal entries**: Auto-post monthly adjustments.
5. **Receipt capture**: Photograph receipts immediately. Dext auto-matches to transactions.

### What to Automate vs. What to Review Manually

**Automate**: Bank feed imports, recurring vendor categorization, Stripe sync, depreciation entries.

**Review manually**: New vendors, large transactions (>$500), refunds, any transaction QBO flags as "uncategorized."

---

## Common Bookkeeping Mistakes in SaaS

### 1. Not Tracking Deferred Revenue
Annual subscriptions are NOT revenue when received. They're a liability. Recognize monthly.

### 2. Mixing Personal and Business Expenses
Get a separate business bank account and credit card. Day one. No exceptions.

### 3. Ignoring Stripe Fees
Stripe fees are a COGS item. They reduce your gross margin. Track them.

### 4. Recording Gross vs. Net Revenue
Stripe deposits the net amount (charge minus fees). Record the GROSS revenue and the fee separately. Otherwise, your revenue is understated and your expenses are understated.

### 5. Not Reconciling Monthly
Unreconciled books compound errors. A $50 mistake in January becomes a $600 nightmare by December.

### 6. Categorizing Everything as "Miscellaneous"
If more than 5% of your expenses are "miscellaneous," your books are useless for decision-making.

### 7. Not Backing Up
Export your books quarterly. QBO is cloud-based, but having a local backup of your financial data is prudent.

### 8. Waiting Until Tax Season
Monthly close takes 2-4 hours. Reconstructing a year of books takes 20-40 hours and costs $2,000+ if you hire someone.

---

## When to Hire a Bookkeeper

### DIY Stage (Pre-Revenue to ~$10K MRR)
- You do it yourself
- Monthly time commitment: 2-4 hours
- Use QBO with Stripe sync
- Have an accountant review quarterly

### Part-Time Bookkeeper (~$10K-50K MRR)
- Hire a part-time bookkeeper (5-10 hrs/month)
- Cost: $500-1,500/month
- They handle reconciliation, categorization, and monthly close
- You review financial statements and make decisions

### Full-Service (~$50K+ MRR)
- Full-service bookkeeping firm or full-time hire
- Cost: $2,000-5,000/month
- They handle everything including payroll, AP/AR, and financial reporting
- You focus on strategy

### What to Look For
- Experience with SaaS companies specifically
- Familiar with Stripe and subscription billing
- Comfortable with accrual-basis accounting
- Can explain your financials to you in plain English
- Responsive (24-48 hour turnaround on questions)

---

## Key Takeaways

1. **Start with accrual basis** — it's the right foundation for SaaS
2. **Set up your chart of accounts properly** — match it to your business model
3. **Monthly close is non-negotiable** — 5 business days, every month
4. **Automate the boring stuff** — bank feeds, Stripe sync, recurring entries
5. **Never mix personal and business finances** — separate accounts from day one
6. **Track deferred revenue** — annual subscriptions are a liability until earned
7. **Record gross revenue and fees separately** — don't net them
8. **Reconcile everything** — if it doesn't match, find out why
9. **Keep receipts** — digital copies are fine, but keep them
10. **Know when to hire help** — your time has a cost too
