# Invoicing Automation for SaaS Companies

## Seed Classification
- **Domain**: Finance & Operations
- **Complexity**: Intermediate
- **Applicability**: SaaS businesses with B2B or mixed B2B/B2C models
- **Last Updated**: 2026-03-09

---

## Why Invoicing Matters for SaaS

Most B2C SaaS companies rely entirely on Stripe's automatic billing — customer enters card, gets charged monthly, done. But as you grow, invoicing becomes critical for:

- **B2B customers** who need invoices for their accounting departments
- **Enterprise deals** where customers pay via bank transfer or purchase order
- **Annual plans** where customers want a single invoice upfront
- **Tax compliance** in jurisdictions requiring formal invoices
- **Revenue tracking** and accounts receivable management
- **Professional credibility** — a proper invoice signals a legitimate business

Automating this process means you never chase a payment manually, never forget to send an invoice, and never lose track of what's owed.

---

## Invoice Anatomy — What Every Invoice Needs

### Required Elements

Every professional invoice must contain:

1. **Your business information**
   - Legal business name (as registered)
   - Business address
   - Phone number or email
   - Tax ID (EIN for US companies)

2. **Customer information**
   - Company name or individual name
   - Billing address
   - Contact email

3. **Invoice details**
   - Unique invoice number (sequential: INV-001, INV-002, etc.)
   - Invoice date (date issued)
   - Due date (when payment is expected)
   - Payment terms (Net 30, Due on Receipt, etc.)

4. **Line items**
   - Description of service/product
   - Subscription tier and period (e.g., "SMART Plan — March 2026")
   - Quantity (usually 1 for SaaS subscriptions)
   - Unit price
   - Line total

5. **Totals**
   - Subtotal
   - Tax (if applicable, with rate specified)
   - Discounts (if applicable, with description)
   - Total amount due

6. **Payment instructions**
   - Accepted payment methods
   - Bank details for wire transfer (if applicable)
   - Online payment link
   - Currency specified (USD)

### Optional but Professional

- Purchase order number (B2B customers often require this)
- Project or reference number
- Notes or terms (late payment policy, refund policy)
- Your logo and brand colors
- "Thank you for your business" footer

---

## Invoice Templates

### Standard Monthly SaaS Invoice

```
┌──────────────────────────────────────────────────────┐
│  [YOUR LOGO]                                         │
│  Stone AI LLC                                        │
│  [Address]                                           │
│  EIN: XX-XXXXXXX                                     │
│                                                      │
│  INVOICE                                             │
│                                                      │
│  Invoice #: INV-2026-0042                            │
│  Date: March 1, 2026                                 │
│  Due Date: March 1, 2026 (Due on Receipt)            │
│                                                      │
│  Bill To:                                            │
│  Acme Corp                                           │
│  Attn: Accounts Payable                              │
│  123 Business Ave, Suite 400                         │
│  New York, NY 10001                                  │
│  billing@acme.com                                    │
│                                                      │
│  ─────────────────────────────────────────────────── │
│  Description              Qty    Rate       Amount   │
│  ─────────────────────────────────────────────────── │
│  SMART Plan Subscription   1    $99.99      $99.99   │
│  (March 2026)                                        │
│  ─────────────────────────────────────────────────── │
│                           Subtotal:         $99.99   │
│                           Tax (0%):          $0.00   │
│                           TOTAL:            $99.99   │
│  ─────────────────────────────────────────────────── │
│                                                      │
│  Payment Methods:                                    │
│  • Pay online: [payment link]                        │
│  • Credit card on file will be charged automatically │
│                                                      │
│  Terms: Due on Receipt                               │
│  Late payments subject to 1.5% monthly interest      │
│                                                      │
│  Thank you for your business!                        │
└──────────────────────────────────────────────────────┘
```

### Annual Prepaid Invoice

```
┌──────────────────────────────────────────────────────┐
│  [YOUR LOGO]                                         │
│  Stone AI LLC                                        │
│                                                      │
│  INVOICE                                             │
│                                                      │
│  Invoice #: INV-2026-0043                            │
│  Date: March 1, 2026                                 │
│  Due Date: March 15, 2026 (Net 15)                   │
│  PO #: PO-2026-8891                                  │
│                                                      │
│  Bill To:                                            │
│  Enterprise Client Inc.                              │
│                                                      │
│  ─────────────────────────────────────────────────── │
│  Description              Qty    Rate       Amount   │
│  ─────────────────────────────────────────────────── │
│  SMART Plan - Annual       1    $1019.88    $1019.88   │
│  (Mar 2026 - Feb 2027)                               │
│  Annual Discount (17%)     1   -$160.00   -$160.00   │
│  ─────────────────────────────────────────────────── │
│                           Subtotal:        $799.88   │
│                           Tax (0%):          $0.00   │
│                           TOTAL:           $799.88   │
│  ─────────────────────────────────────────────────── │
│                                                      │
│  Payment Methods:                                    │
│  • Wire transfer: [bank details]                     │
│  • Pay online: [payment link]                        │
│  • Check payable to: Stone AI LLC                    │
│                                                      │
│  Terms: Net 15                                       │
└──────────────────────────────────────────────────────┘
```

---

## Payment Terms

### Common Payment Terms

| Term | Meaning | Best For |
|---|---|---|
| Due on Receipt | Payment expected immediately | B2C, self-serve signups |
| Net 15 | Due within 15 days | Small B2B, annual plans |
| Net 30 | Due within 30 days | Standard B2B |
| Net 45 | Due within 45 days | Mid-market B2B |
| Net 60 | Due within 60 days | Enterprise (avoid if possible) |
| 2/10 Net 30 | 2% discount if paid within 10 days, otherwise due in 30 | Incentivize early payment |

### Choosing Payment Terms

- **Self-serve SaaS**: Due on Receipt. Card is charged automatically. No terms needed.
- **B2B < $500/month**: Net 15. Small enough that 15 days is reasonable.
- **B2B $500-5,000/month**: Net 30. Standard business practice.
- **Enterprise > $5,000/month**: Net 30 is ideal, but expect pushback for Net 45-60. Never accept Net 90 unless the deal is enormous.

### Early Payment Discounts

"2/10 Net 30" means the customer gets a 2% discount if they pay within 10 days. On a $1,000 invoice, that's $20 off. Sounds small, but annualized, that's a 36% return on their money — most finance teams will take it.

This accelerates your cash flow and reduces collection effort. Consider offering it for invoices over $500.

---

## Recurring Invoices

### The Automation Pyramid

**Level 1: Manual invoicing**
- Create each invoice by hand
- Send via email
- Track payment manually
- Suitable for 1-5 invoiced customers

**Level 2: Template-based**
- Use invoice templates in your accounting software
- Duplicate and modify each period
- Some automation in tracking
- Suitable for 5-20 invoiced customers

**Level 3: Recurring invoices**
- Set up once, auto-generates and sends each period
- Auto-applies payment when received
- Sends reminders for overdue invoices
- Suitable for 20-100 invoiced customers

**Level 4: Full automation**
- Stripe Invoicing or billing platform handles everything
- Integrates with accounting software
- Auto-retry failed payments
- Customer self-service portal for invoice history
- Suitable for 100+ customers

### Setting Up Recurring Invoices

In QuickBooks Online:
1. Go to Sales → Invoices → Create Recurring
2. Set the customer, line items, and amount
3. Choose frequency (monthly, quarterly, annually)
4. Set start date and end date (or ongoing)
5. Choose to auto-send or save as draft for review
6. Set up email template for delivery

In Stripe:
1. Create a subscription for the customer
2. Stripe automatically generates invoices for each billing period
3. Configure invoice settings (payment terms, memo, footer)
4. Invoices are sent via email with a hosted payment page
5. Payments auto-reconcile when received

---

## Late Payment Handling

### Prevention (Before the Problem)

1. **Clear terms upfront** — Payment terms on every invoice AND in your Terms of Service
2. **Easy payment methods** — Accept cards, ACH, wire. Remove friction.
3. **Auto-charge when possible** — Card on file is the gold standard for SaaS
4. **Send invoices early** — For Net 30 terms, send the invoice 5 days before the period starts
5. **Payment link on invoice** — One-click payment dramatically improves collection speed

### Collection Sequence (After the Problem)

**Day of due date**: Automatic reminder email. "Your invoice INV-XXXX for $XX.XX is due today."

**Day 3 past due**: Friendly follow-up. "We noticed your payment is past due. Please let us know if there are any issues."

**Day 7 past due**: Firmer reminder. "Your account has an outstanding balance of $XX.XX. Please remit payment within 7 days to avoid service interruption."

**Day 14 past due**: Final notice. "This is your final notice before account suspension. Payment is required within 48 hours."

**Day 21 past due**: Account suspension. Service is disabled. Email notification that service will be restored upon payment.

**Day 30 past due**: Account cancellation warning. "Your account will be permanently cancelled in 30 days if the balance is not resolved."

**Day 60 past due**: Account cancelled. Outstanding balance referred to collections (if amount justifies it) or written off.

### Late Payment Interest

Standard practice: 1.5% per month (18% annually) on outstanding balances. This must be:
- Stated in your Terms of Service
- Stated on every invoice
- Applied consistently (you can waive it, but the policy should exist)
- Compliant with your state's usury laws (check maximum allowable rates)

### When to Write Off Bad Debt

- Invoice is 90+ days past due
- Customer is unresponsive to all communication
- Cost of collection exceeds the invoice amount
- Customer has gone out of business

Accounting entry for write-off:
| Account | Debit | Credit |
|---|---|---|
| Bad Debt Expense | $XX | |
| Accounts Receivable | | $XX |

---

## Stripe Invoicing

### Why Stripe Invoicing

If you're already using Stripe for subscriptions, Stripe Invoicing is the natural choice:
- Invoices auto-generate for subscriptions
- Customer payment portal (hosted by Stripe)
- Automatic payment reminders
- Support for ACH, wire, cards
- PDF generation and email delivery
- Tax calculation (with Stripe Tax)
- Revenue recognition data
- No additional cost beyond standard Stripe fees

### Setting Up Stripe Invoicing

**For subscription customers (automatic):**
```
// When creating a subscription, Stripe auto-generates invoices
const subscription = await stripe.subscriptions.create({
  customer: 'cus_xxx',
  items: [{ price: 'price_xxx' }],
  collection_method: 'send_invoice', // Instead of 'charge_automatically'
  days_until_due: 30,
});
```

**For one-off invoices:**
```
const invoice = await stripe.invoices.create({
  customer: 'cus_xxx',
  collection_method: 'send_invoice',
  days_until_due: 30,
  description: 'Custom development work — March 2026',
});

// Add line items
await stripe.invoiceItems.create({
  customer: 'cus_xxx',
  invoice: invoice.id,
  amount: 5000, // $50.00 in cents
  description: 'Consulting — 2 hours',
});

// Finalize and send
await stripe.invoices.finalizeInvoice(invoice.id);
await stripe.invoices.sendInvoice(invoice.id);
```

### Stripe Invoice Configuration

In the Stripe Dashboard → Settings → Invoices:

1. **Invoice template**: Add your logo, brand colors, and footer text
2. **Default payment terms**: Set your standard (Net 30, etc.)
3. **Payment methods**: Enable/disable card, ACH, wire transfer
4. **Reminders**: Configure automatic reminder emails (3 days before due, on due date, 3 days after, etc.)
5. **Invoice numbering**: Set prefix and starting number (e.g., INV-2026-0001)
6. **Default memo**: Add standard text that appears on all invoices
7. **Tax settings**: Configure Stripe Tax for automatic tax calculation

### Stripe Invoice Webhooks

Listen for these events to keep your system in sync:

```
invoice.created        — Invoice generated
invoice.finalized      — Invoice ready to send
invoice.sent           — Invoice emailed to customer
invoice.paid           — Payment received (reconcile in your books)
invoice.payment_failed — Payment attempt failed
invoice.overdue        — Invoice past due date
invoice.voided         — Invoice cancelled
```

### Handling Invoice Disputes

When a customer disputes an invoice:
1. Stripe notifies you via `charge.dispute.created` webhook
2. You have evidence submission window (usually 7-21 days)
3. Gather evidence: signed contract, delivery proof, usage logs, communication history
4. Submit via Stripe Dashboard or API
5. Card network makes final decision (45-75 days)

---

## Accounting Integration

### Stripe → QuickBooks Online

**Native integration:**
1. QBO → Apps → Stripe → Connect
2. Choose sync settings:
   - Sync invoices as QBO invoices
   - Sync payments and apply to invoices
   - Sync refunds as credit memos
   - Map revenue to correct accounts
   - Map fees to Payment Processing Fees

**Sync behavior:**
- Daily sync (not real-time)
- Creates/updates invoices in QBO matching Stripe invoices
- Auto-applies payments when received
- Handles partial payments correctly
- Refunds create credit memos and reduce revenue

### Manual Reconciliation (If No Integration)

If you're using a tool without direct Stripe integration:

1. Export Stripe invoices monthly (CSV from Stripe Dashboard)
2. Export Stripe payouts (to match bank deposits)
3. Create invoices in your accounting software
4. Record payments when Stripe deposits hit your bank
5. Reconcile: Stripe balance + pending payouts should match your bank activity

### Multi-Tool Stack Reconciliation

If you invoice through multiple channels:

| Channel | Tracking Tool | Reconciliation Method |
|---|---|---|
| Stripe subscriptions | Stripe Dashboard | Auto-sync to QBO |
| Stripe manual invoices | Stripe Dashboard | Auto-sync to QBO |
| Enterprise wire transfers | Bank statement | Manual matching in QBO |
| PayPal (if used) | PayPal reports | Manual or Zapier sync |

The golden rule: **Every dollar in your bank account must trace back to a source document (invoice, receipt, or contract).** If it can't, you have a reconciliation gap.

---

## Invoice Numbering Systems

### Sequential (Simple)

INV-001, INV-002, INV-003...

Pros: Simple, easy to reference.
Cons: Competitors/customers can estimate your invoice volume.

### Date-Prefixed (Recommended)

INV-2026-0001, INV-2026-0042, INV-2026-0043...

Pros: Immediately tells you the year. Resets numbering annually.
Cons: Slightly longer numbers.

### Customer-Prefixed

INV-ACME-001, INV-ENTER-001...

Pros: Easy to find all invoices for a customer.
Cons: Complex numbering, harder to maintain sequential order.

### Best Practice

Use date-prefixed sequential: `INV-YYYY-NNNN`. Set it up in both Stripe and your accounting software with the same format. Never skip numbers — gaps in invoice numbering are audit red flags.

---

## Credit Notes and Adjustments

### When to Issue a Credit Note

- Customer was overcharged
- Service was down and you're issuing a credit
- Promotional adjustment after invoice was sent
- Partial refund for unused portion of service

### Credit Note Format

A credit note references the original invoice:

```
CREDIT NOTE CN-2026-0012
Reference: INV-2026-0042

Reason: Service credit for outage on March 5, 2026 (4 hours)

Credit Amount: -$13.33
Applied to: Next invoice (INV-2026-0055)
```

### Accounting Entry

| Account | Debit | Credit |
|---|---|---|
| Subscription Revenue | $13.33 | |
| Accounts Receivable (or Cash) | | $13.33 |

---

## Scaling Your Invoicing

### 1-10 Invoiced Customers
- Manual invoices via Stripe or QBO
- Personal follow-up on late payments
- Monthly reconciliation takes 30 minutes

### 10-50 Invoiced Customers
- Recurring invoices in Stripe
- Automated email reminders
- Stripe → QBO sync
- Monthly reconciliation takes 1-2 hours

### 50-200 Invoiced Customers
- Full Stripe Invoicing automation
- Customer self-service portal
- Automated dunning sequences
- AR aging reports weekly
- Dedicated AR review process
- Consider a part-time AR person

### 200+ Invoiced Customers
- Dedicated billing/invoicing platform (Chargebee, Zuora, or Stripe Billing)
- Full accounting integration
- Automated collections workflows
- Dedicated AR team or outsourced AR management
- Cash application automation

---

## Tax on Invoices

### When to Charge Tax

- Customer is in a jurisdiction where SaaS is taxable
- You have nexus in that jurisdiction
- No valid tax exemption certificate on file

### Tax Exemption Handling

B2B customers often have tax exemptions. Process:
1. Customer provides a tax exemption certificate (resale cert, government exemption, etc.)
2. You verify the certificate is valid for your product type and jurisdiction
3. Store the certificate in your files (indefinitely — the IRS can request it years later)
4. Mark the customer as tax-exempt in Stripe and your accounting software
5. Invoices show $0.00 tax with a note: "Tax exempt per certificate on file"

### Stripe Tax

Stripe Tax automates sales tax calculation:
- Determines if SaaS is taxable in the customer's jurisdiction
- Calculates the correct rate
- Adds tax to invoices automatically
- Provides tax reports for filing
- Cost: 0.5% per transaction (on top of standard Stripe fees)

---

## Key Takeaways

1. **Automate from the start** — Even with 5 customers, set up recurring invoices
2. **Use Stripe Invoicing** if you're already on Stripe — it's the path of least resistance
3. **Payment terms matter** — Net 30 is standard B2B, Due on Receipt for B2C
4. **Late payment sequences are automated** — Set them up once, never think about them again
5. **Sync invoicing with accounting** — Stripe → QBO integration eliminates manual data entry
6. **Credit notes, not deletions** — Never delete an invoice. Issue a credit note instead.
7. **Tax compliance on invoices** — Know where SaaS is taxable and collect accordingly
8. **Invoice numbering is sacred** — Sequential, date-prefixed, no gaps
9. **Every bank dollar traces to a document** — If it doesn't, you have a problem
10. **Scale your process before you need to** — Moving from manual to automated is easier at 10 customers than 100
