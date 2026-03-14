# Payment Compliance for SaaS

## Palace Knowledge Seed — Legal & Compliance Series
### Classification: Critical Payment Infrastructure
### Applicable To: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Executive Summary

Payment compliance for SaaS companies encompasses PCI DSS requirements, recurring billing regulations, refund policy mandates, automatic renewal laws, and price change notification rules. Getting payment compliance wrong can result in payment processor account suspension (killing your revenue instantly), regulatory fines, chargebacks, and lawsuits. With Stripe as the payment processor, many PCI requirements are handled, but the business still has significant compliance obligations.

---

## 2. PCI DSS Compliance for Stripe Integration

### 2.1 PCI DSS Overview

The Payment Card Industry Data Security Standard (PCI DSS) is a security standard for organizations that handle credit card information. Non-compliance can result in fines of $5,000-$100,000 per month from card brands.

### 2.2 Stripe's PCI Responsibility Model

Stripe is a PCI Level 1 Service Provider (the highest level). When using Stripe properly, Stone AI operates under a significantly reduced PCI scope.

```
PCI RESPONSIBILITY MATRIX (Stripe Integration):

STRIPE HANDLES:
✓ Card number storage and tokenization
✓ Payment processing and settlement
✓ PCI DSS Level 1 compliance for payment infrastructure
✓ Encryption of cardholder data
✓ Network security for payment systems
✓ Regular security testing and audits

STONE AI MUST HANDLE:
✓ SAQ A or SAQ A-EP self-assessment questionnaire
✓ HTTPS/TLS on all pages (already in place via Vercel/Cloudflare)
✓ Never storing, processing, or transmitting raw card data
✓ Using Stripe.js or Stripe Elements for card collection (never custom forms)
✓ Securing API keys (Stripe secret key server-side only)
✓ Access controls for Stripe Dashboard
✓ Vulnerability management for web application
✓ Security awareness for personnel
```

### 2.3 SAQ A Requirements

Since Stone AI uses Stripe Elements (client-side card collection that iframes to Stripe), the applicable Self-Assessment Questionnaire is SAQ A:

```
SAQ A REQUIREMENTS:

1. All payment processing fully outsourced to Stripe
2. No electronic storage of cardholder data on your systems
3. Confirmation that merchant (you) is not storing card data
4. All pages serving the payment page use HTTPS
5. Stripe's PCI compliance is validated

SAQ A IS THE SIMPLEST PCI COMPLIANCE LEVEL.
No vulnerability scan, no penetration test, no complex controls required
— as long as you NEVER touch raw card data.

CRITICAL RULES:
- NEVER log card numbers, CVVs, or full card data in server logs
- NEVER pass card data through your server (use Stripe Elements/Checkout)
- NEVER store card data in your database
- NEVER display full card numbers to users (Stripe provides last 4 only)
- Use Stripe's hosted payment forms or Elements exclusively
```

### 2.4 Stripe API Key Security

```
API KEY SECURITY REQUIREMENTS:

1. SECRET KEY (sk_live_* / sk_test_*):
   - Store ONLY in environment variables (never in source code)
   - Never expose to client-side code
   - Never commit to version control
   - Rotate periodically (quarterly recommended)
   - Use restricted API keys with minimum required permissions

2. PUBLISHABLE KEY (pk_live_* / pk_test_*):
   - Safe for client-side use (it's designed for this)
   - Still don't commit to source control with secret keys
   - Use environment variables

3. WEBHOOK SIGNING SECRET (whsec_*):
   - Store in environment variables
   - Verify all webhook signatures
   - Reject requests with invalid signatures

4. STRIPE DASHBOARD ACCESS:
   - Enable 2FA for all dashboard users
   - Limit dashboard access to essential personnel
   - Review access quarterly
   - Use role-based access (developer, analyst, admin)
```

---

## 3. Recurring Billing Regulations

### 3.1 Federal Requirements

**Restore Online Shoppers' Confidence Act (ROSCA)**:
- Requires clear disclosure of material terms before billing
- Must obtain express informed consent (separate from other terms)
- Must provide simple cancellation mechanism

**FTC Negative Option Rule (Updated 2023-2024)**:
- All material terms must be clearly disclosed before consent
- Must obtain express informed consent for recurring charges
- Must provide simple cancellation ("click to cancel" — as easy to cancel as to sign up)
- Must send pre-renewal notification before charging

### 3.2 New York Auto-Renewal Law (GOL § 5-903)

```
NY GENERAL OBLIGATIONS LAW § 5-903 REQUIREMENTS:

1. CLEAR DISCLOSURE (before initial purchase):
   - Automatic renewal terms in clear and conspicuous manner
   - Cancellation policy
   - Recurring charge amount (or how it's calculated)
   - Length of renewal term

2. AFFIRMATIVE CONSENT:
   - Customer must affirmatively consent to auto-renewal terms
   - Pre-checked boxes are NOT sufficient consent
   - Separate acknowledgment from general terms acceptance (recommended)

3. ACKNOWLEDGMENT:
   - Send written/electronic acknowledgment that includes:
     - Auto-renewal terms
     - Cancellation policy
     - Contact information for cancellation
   - Must be sent at time of purchase or shortly after

4. CANCELLATION MECHANISM:
   - If customer enrolled online, must be able to cancel online
   - Must be simple and straightforward
   - Cannot require phone call if enrollment was online
   - Cannot add unreasonable barriers (long hold times, excessive steps)

5. RENEWAL REMINDER:
   - Send reminder before renewal date
   - Include: renewal date, amount, how to cancel
   - Timing: [30-60 days] before renewal (recommended)

PENALTY: Violation makes the renewal provision void and unenforceable.
Customer entitled to refund of renewal charges.
```

### 3.3 California Auto-Renewal Law (ARL — Bus. & Prof. Code § 17600-17606)

```
CALIFORNIA ARL REQUIREMENTS:

1. CLEAR AND CONSPICUOUS DISCLOSURE of:
   - Auto-renewal offer terms
   - Cancellation policy
   - That charges will continue until cancelled

2. AFFIRMATIVE CONSENT before charging

3. ACKNOWLEDGMENT:
   - Must include: renewal terms, cancellation policy, contact info
   - Must be in a manner that can be retained (email/printable)
   - For FREE TRIAL offers: must also disclose:
     - Price after trial ends
     - How to cancel before being charged
     - When the trial ends

4. CANCELLATION:
   - Online enrollment = online cancellation available
   - Must be "cost-effective, timely, and easy-to-use"
   - Must provide immediate confirmation of cancellation

5. MATERIAL CHANGES:
   - Must notify customer of material changes before renewal
   - Must obtain fresh consent for material changes

PENALTY: Any charges made in violation are deemed an "unlawful business practice."
```

### 3.4 Other State Auto-Renewal Laws

| State | Key Requirements | Notable Differences |
|-------|-----------------|-------------------|
| Connecticut | Clear disclosure, affirmative consent | Requires 30-60 day pre-renewal notice |
| Virginia | Clear disclosure, easy cancellation | Applies to consumer contracts |
| Illinois | Disclosure before charge, online cancellation | 815 ILCS 601/5 |
| Oregon | Written notice 30 days before renewal | ORS 646A.295 |
| Colorado | Notice 25 days before renewal for 60+ day terms | Auto-renewal provisions void if non-compliant |
| Washington DC | Clear disclosure, cancellation method | Applies to all consumer subscriptions |
| Vermont | 30-day advance renewal notice | VT Stat. Ann. tit. 9, § 2454a |

### 3.5 Implementation Checklist for Stone AI

```
RECURRING BILLING COMPLIANCE CHECKLIST:

PRE-PURCHASE:
[ ] Clear display of: subscription price, billing frequency, renewal terms
[ ] Auto-renewal terms displayed before payment form
[ ] Separate consent checkbox for auto-renewal (not pre-checked)
[ ] Free trial: clearly state when trial ends and price after trial
[ ] Promotional pricing: clearly state regular price after promotion

AT PURCHASE:
[ ] Confirmation email with: subscription details, renewal terms, cancellation info
[ ] Receipt with amount charged, next billing date, plan details
[ ] Store consent record (timestamp, IP, terms version)

PRE-RENEWAL:
[ ] Send renewal reminder [30 days] before renewal date
[ ] Include: renewal date, amount to be charged, how to cancel
[ ] For annual plans: reminder is especially important

POST-RENEWAL:
[ ] Send receipt for renewal charge
[ ] Include: amount charged, next renewal date, cancellation info

CANCELLATION:
[ ] In-app cancellation available (Settings > Subscription > Cancel)
[ ] No dark patterns (guilt-tripping, excessive steps, hidden buttons)
[ ] Immediate confirmation of cancellation
[ ] Confirmation email with: effective date, what access remains, re-subscribe info
[ ] Access continues through end of paid period (no immediate cutoff)

PRICE CHANGES:
[ ] [30+ days] advance notice before price increase takes effect
[ ] Notice via email with: current price, new price, effective date, opt-out
[ ] Option to cancel before new price takes effect
[ ] New price applies starting next billing cycle (not mid-cycle)
```

---

## 4. Refund Policy Requirements

### 4.1 Legal Requirements

There is no US federal law requiring SaaS refunds, but:
- State consumer protection laws may apply
- Credit card network rules (Visa/Mastercard) require reasonable refund policies
- FTC considers unreasonable no-refund policies potentially deceptive
- Chargebacks are expensive ($15-$100+ per dispute) and high rates can get your Stripe account suspended

### 4.2 Recommended Refund Policy

```
REFUND POLICY:

1. MONTHLY SUBSCRIPTIONS:
   - No refund for partial months
   - Cancellation takes effect at end of current billing period
   - User retains access through end of paid period

2. ANNUAL SUBSCRIPTIONS:
   - Pro-rated refund if cancelled within first [30 days]
   - No refund after 30 days (access continues through term end)
   - [OR] Pro-rated refund for unused full months remaining

3. FREE TRIAL:
   - No charge during trial period
   - Auto-conversion clearly disclosed
   - Full refund if charged within [7 days] of trial end and user did not
     intend to continue

4. PROMOTIONAL PRICING:
   - Refund based on promotional price paid, not full price
   - Standard refund terms apply

5. DISPUTE RESOLUTION:
   - Contact support at [email] before filing a chargeback
   - Good-faith effort to resolve billing disputes
   - Refund processing time: [5-10 business days] via original payment method

6. NON-REFUNDABLE:
   - Account termination for ToS violation
   - Service already fully consumed
   - Requests made [90+ days] after charge
```

### 4.3 Chargeback Prevention

```
CHARGEBACK PREVENTION STRATEGY:

1. CLEAR BILLING DESCRIPTOR:
   - Stripe statement descriptor: "STONE AI" or "STONEAI.NET"
   - Must be recognizable to customers on bank statements
   - Include website URL in descriptor

2. PRE-CHARGE NOTIFICATION:
   - Send email [3-7 days] before any charge
   - Especially important for: first post-trial charge, annual renewal,
     price changes

3. EASY CANCELLATION:
   - Make cancellation genuinely easy (reduces dispute-based cancellations)
   - In-app cancellation, no phone required

4. RESPONSIVE SUPPORT:
   - Respond to billing inquiries within [24 hours]
   - Proactively offer refunds for legitimate complaints
   - A refund is cheaper than a chargeback

5. RECEIPT AND CONFIRMATION:
   - Send receipt for every charge
   - Include: amount, description, next charge date, support contact

6. STRIPE RADAR:
   - Enable Stripe Radar for fraud detection
   - Configure risk rules appropriate to your business
   - Block known fraudulent cards

7. DISPUTE RESPONSE:
   - Respond to all Stripe disputes within [7 days]
   - Provide evidence: subscription agreement, usage logs, communication history
   - Use Stripe's dispute response tools

CHARGEBACK RATE TARGET: Below 0.75% (Stripe will suspend at 1%+)
```

---

## 5. Price Change Notification Rules

### 5.1 Legal Requirements

```
PRICE CHANGE NOTIFICATION REQUIREMENTS:

FEDERAL (FTC):
- Material changes require notice
- Automatic renewal at higher price without notice = deceptive practice

NEW YORK (GOL § 5-903):
- Auto-renewal at increased price requires clear notice
- Customer must consent to new terms

CALIFORNIA (ARL):
- Material changes to automatic renewal terms require notice + consent

STRIPE REQUIREMENTS:
- For Stripe Billing: Use price migration tools
- Notify customers before price changes take effect

BEST PRACTICE:
- Minimum 30 days' advance notice for any price increase
- Written notice (email) to all affected customers
- Clear comparison: current price vs. new price
- Effective date
- Option to cancel or downgrade before new price applies
- Grandfather existing customers at current price for [1 billing cycle]
```

### 5.2 Price Change Communication Template

```
Subject: Important Update to Your [Stone AI] Subscription

Dear [Name],

We're writing to let you know about an upcoming change to your subscription pricing.

CURRENT PLAN: [Plan Name] — $[current price]/[month/year]
NEW PRICE: $[new price]/[month/year]
EFFECTIVE DATE: [Date — at least 30 days from this notice]

WHY THE CHANGE:
[Brief, honest explanation — improved features, infrastructure costs, etc.]

YOUR OPTIONS:
1. STAY ON YOUR PLAN: Your subscription will automatically continue at the new
   price starting [date]. No action needed.
2. CHANGE PLANS: You can switch to a different plan at any time from your
   account settings.
3. CANCEL: You can cancel your subscription before [date] and you will not be
   charged the new rate.

To manage your subscription, visit: [settings URL]

Thank you for being a [Stone AI] customer. If you have questions, reply to this
email or contact support at [support email].

Best,
The Stone AI Team
```

---

## 6. SaaS Sales Tax Compliance

### 6.1 SaaS Taxability by State

SaaS taxation varies significantly by state. As of 2026:

| Taxability | States |
|-----------|--------|
| SaaS is TAXABLE | NY, TX, PA, OH, CT, NM, UT, WA, DC, HI, SD, RI, TN, WV, SC, MS, IA, NE, KY, AZ, and others |
| SaaS is NOT TAXABLE | CA (generally), CO, FL (generally), IL (generally), GA, VA, MD, MO, and others |
| UNCLEAR/VARIES | Several states with evolving guidance |

**New York**: SaaS is taxable in NY at the combined state and local rate (approximately 8% in NYC, varies by county).

### 6.2 Economic Nexus Thresholds

Post-South Dakota v. Wayfair (2018), states can require sales tax collection based on economic presence:

| Common Threshold | Trigger |
|-----------------|---------|
| $100,000 in sales | Most states |
| 200 transactions | Some states (declining) |
| Either threshold | Triggers obligation |

**Stone AI Action**: Once SaaS revenue exceeds $100K or 200 transactions in any state, register for sales tax in that state.

### 6.3 Stripe Tax

Stripe Tax can automate sales tax calculation, collection, and reporting:
- Automatically determines tax rates based on customer location
- Collects appropriate tax at checkout
- Provides reports for filing
- Cost: 0.5% of transaction amount (per Stripe Tax pricing)

---

## 7. International Payment Considerations

### 7.1 EU Payment Regulations

**PSD2 (Payment Services Directive 2)**:
- Strong Customer Authentication (SCA) required for EU transactions
- Stripe handles SCA through 3D Secure
- Affects: Initial payments, some recurring payments, one-time charges

**EU Consumer Rights Directive**:
- 14-day cooling-off period for online purchases (EU consumers can cancel and get a full refund within 14 days)
- Must inform consumers of this right before purchase
- Right may be waived for digital content if consumer consents

### 7.2 Currency and Cross-Border Compliance

```
INTERNATIONAL PAYMENT BEST PRACTICES:

1. CURRENCY:
   - Display prices in customer's local currency where possible
   - Use Stripe's multi-currency support
   - Clearly disclose if charging in USD

2. VAT/GST:
   - EU: Collect VAT based on customer location (MOSS/OSS scheme)
   - UK: 20% VAT on digital services to UK consumers
   - Australia: 10% GST
   - Canada: GST/HST varies by province

3. INVOICING:
   - EU invoices must include: VAT number, tax amounts, customer details
   - Use Stripe Invoicing for compliant invoices

4. STRIPE ATLAS:
   - Consider Stripe Atlas if formalizing international operations
```

---

## 8. Billing System Technical Requirements

### 8.1 Required Technical Implementations

```
BILLING SYSTEM REQUIREMENTS:

1. SUBSCRIPTION MANAGEMENT:
   [ ] Stripe Billing integration for subscription lifecycle
   [ ] Webhook handling for: invoice.paid, invoice.payment_failed,
       customer.subscription.updated, customer.subscription.deleted
   [ ] Grace period for failed payments (retry 3 times over 7 days)
   [ ] Dunning emails for failed payments (Stripe Smart Retries)

2. TIER MANAGEMENT:
   [ ] Upgrade: immediate or prorated
   [ ] Downgrade: takes effect at end of billing period
   [ ] Tier change reflected immediately in feature access
   [ ] Prorated credits for mid-cycle changes

3. INVOICING:
   [ ] Automated invoice generation
   [ ] Invoice accessible in user account settings
   [ ] PDF download available
   [ ] All required information (company name, address, tax info)

4. TAX HANDLING:
   [ ] Tax calculation at checkout (Stripe Tax or manual)
   [ ] Tax displayed separately on invoice
   [ ] Tax ID collection for business customers (EU VAT ID)

5. RECEIPTS:
   [ ] Automated receipt email for every charge
   [ ] Receipt includes: date, amount, description, next billing date
   [ ] Receipt link in account settings

6. CANCELLATION FLOW:
   [ ] In-app cancellation (no phone required)
   [ ] Cancellation confirmation screen
   [ ] Cancellation confirmation email
   [ ] Access maintained through billing period end
   [ ] Optional: cancellation survey, retention offer
```

---

## 9. Compliance Calendar

| Frequency | Action |
|-----------|--------|
| Per transaction | Generate receipt, verify tax calculation |
| Monthly | Review chargeback rate, reconcile Stripe dashboard |
| Quarterly | Review compliance with auto-renewal laws, SAQ A check |
| Annually | Full PCI compliance review, sales tax nexus assessment, refund policy review |
| As needed | Price change notifications (30+ days advance), regulatory updates |

---

*This seed provides payment compliance guidance for educational purposes. It does not constitute legal or financial advice. Consult qualified legal and tax professionals for payment compliance decisions.*
