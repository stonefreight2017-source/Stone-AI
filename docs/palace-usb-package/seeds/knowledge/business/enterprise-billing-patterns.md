# Enterprise Billing Patterns — Stone AI Ecosystem

## Seed Classification
- **Domain**: Revenue Operations / Enterprise Sales
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe API, Prisma 7.4
- **Applies To**: Stone AI (PRO+ tier), Stone AI Tools (Enterprise tier)

---

## 1. Enterprise Billing Overview

### Why Enterprise Billing Is Different

Enterprise customers don't buy like consumers. They have procurement departments, budget approval cycles, legal review, and specific invoicing requirements. If Stone AI can't accommodate these processes, enterprise deals die — not because the product isn't good enough, but because the billing doesn't fit the buyer's workflow.

Enterprise billing patterns include: custom pricing negotiations, invoice-based payment (pay after receiving service, not upfront), purchase orders (PO numbers on invoices), multi-seat licensing (one account for a team), annual contracts with quarterly payments, and legal agreements (MSAs, DPAs, SLAs).

### When to Offer Enterprise Billing

Enterprise billing adds complexity. Don't implement it until:
- Multiple prospects have asked for invoice billing or custom pricing
- Average deal size justifies the overhead (typically $500+/month or $5,000+/year)
- You have someone who can manage enterprise relationships (founder initially, account manager later)

---

## 2. Custom Pricing

### Custom Pricing Framework

Enterprise customers expect negotiated pricing. The framework:

```
Standard Pricing (self-serve):
├── STARTER: $19.99/mo
├── PLUS: $49.99/mo
├── SMART: $99.99/mo
└── PRO: $200/mo

Enterprise Pricing (negotiated):
├── Volume discount: 10-30% based on seats
├── Annual commitment discount: Additional 10-20%
├── Multi-product discount: 15-20% for 2+ products
├── Custom features: Additional pricing for dedicated support, SLA, etc.
└── Minimum commitment: $500/mo or $5,000/year
```

### Pricing Calculator

```typescript
// Enterprise pricing calculator
function calculateEnterprisePricing(params: {
  basePlan: PlanTier;
  seats: number;
  billingPeriod: 'monthly' | 'quarterly' | 'annual';
  products: ('stone-ai' | 'tools' | 'mobile')[];
  commitmentMonths: number;
  customFeatures: string[];
}): {
  perSeatPrice: number;
  totalMonthly: number;
  totalAnnual: number;
  discountApplied: number;
} {
  const basePrice = getPlanPrice(params.basePlan); // e.g., $200 for PRO

  // Volume discount based on seats
  let volumeDiscount = 0;
  if (params.seats >= 100) volumeDiscount = 0.30;
  else if (params.seats >= 50) volumeDiscount = 0.25;
  else if (params.seats >= 25) volumeDiscount = 0.20;
  else if (params.seats >= 10) volumeDiscount = 0.15;
  else if (params.seats >= 5) volumeDiscount = 0.10;

  // Commitment discount
  let commitmentDiscount = 0;
  if (params.commitmentMonths >= 36) commitmentDiscount = 0.20;
  else if (params.commitmentMonths >= 24) commitmentDiscount = 0.15;
  else if (params.commitmentMonths >= 12) commitmentDiscount = 0.10;

  // Multi-product discount
  const multiProductDiscount = params.products.length >= 3 ? 0.20
    : params.products.length >= 2 ? 0.15 : 0;

  // Total discount (capped at 40%)
  const totalDiscount = Math.min(
    volumeDiscount + commitmentDiscount + multiProductDiscount,
    0.40
  );

  const perSeatPrice = basePrice * (1 - totalDiscount);
  const totalMonthly = perSeatPrice * params.seats;
  const totalAnnual = totalMonthly * 12;

  return {
    perSeatPrice: Math.round(perSeatPrice * 100) / 100,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalAnnual: Math.round(totalAnnual * 100) / 100,
    discountApplied: totalDiscount,
  };
}
```

### Custom Price Objects in Stripe

For each enterprise deal, create custom Stripe Price objects:

```typescript
// Create custom pricing for an enterprise deal
async function createEnterprisePricing(deal: {
  customerId: string;
  perSeatPrice: number;
  seats: number;
  billingInterval: 'month' | 'quarter' | 'year';
  contractMonths: number;
}) {
  // Create a custom price for this customer
  const price = await stripe.prices.create({
    product: STONE_AI_PRODUCT_ID,
    unit_amount: Math.round(deal.perSeatPrice * 100),
    currency: 'usd',
    recurring: {
      interval: deal.billingInterval === 'quarter' ? 'month' : deal.billingInterval,
      interval_count: deal.billingInterval === 'quarter' ? 3 : 1,
    },
    metadata: {
      type: 'enterprise_custom',
      customer: deal.customerId,
      seats: deal.seats.toString(),
      contract_months: deal.contractMonths.toString(),
    },
  });

  return price;
}
```

---

## 3. Invoice Billing

### How Invoice Billing Works

Consumer billing: Customer provides a credit card, gets charged automatically each month.
Enterprise billing: Customer receives an invoice, pays within 30 days (NET 30) via bank transfer, check, or corporate card.

```
Normal (Consumer):
  Card on file → Auto-charge → Instant payment → Access continues

Invoice (Enterprise):
  Invoice generated → Sent to customer → NET 30 payment terms →
  Customer pays via bank transfer → Payment reconciled → Access continues
```

### Stripe Invoice Billing Implementation

```typescript
// Create an enterprise subscription with invoice billing
async function createEnterpriseSubscription(params: {
  customerId: string;
  priceId: string;
  seats: number;
  poNumber?: string;
  paymentTermsDays: number; // NET 30, NET 45, etc.
}) {
  // Set customer to invoice billing
  await stripe.customers.update(params.customerId, {
    invoice_settings: {
      custom_fields: params.poNumber ? [
        { name: 'PO Number', value: params.poNumber },
      ] : undefined,
    },
  });

  // Create subscription with invoice collection method
  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{
      price: params.priceId,
      quantity: params.seats,
    }],
    collection_method: 'send_invoice',
    days_until_due: params.paymentTermsDays, // NET 30, 45, or 60
    metadata: {
      type: 'enterprise',
      po_number: params.poNumber || '',
      seats: params.seats.toString(),
    },
  });

  return subscription;
}
```

### Invoice Customization

Enterprise invoices need specific elements:

```typescript
// Customize invoice for enterprise requirements
async function customizeEnterpriseInvoice(invoiceId: string, details: {
  poNumber: string;
  billingContact: string;
  department?: string;
  costCenter?: string;
  customNotes?: string;
}) {
  await stripe.invoices.update(invoiceId, {
    custom_fields: [
      { name: 'PO Number', value: details.poNumber },
      { name: 'Billing Contact', value: details.billingContact },
      ...(details.department ? [{ name: 'Department', value: details.department }] : []),
      ...(details.costCenter ? [{ name: 'Cost Center', value: details.costCenter }] : []),
    ],
    footer: details.customNotes || 'Payment terms: NET 30. Questions? enterprise@stone-ai.net',
    description: `Stone AI Enterprise Subscription — ${details.poNumber}`,
  });
}
```

### Payment Tracking for Invoices

Invoice payments don't arrive instantly. Track payment status:

```typescript
// Monitor invoice payment status
async function checkOverdueInvoices() {
  const overdueInvoices = await stripe.invoices.list({
    status: 'open',
    due_date: { lt: Math.floor(Date.now() / 1000) }, // Past due
    collection_method: 'send_invoice',
  });

  for (const invoice of overdueInvoices.data) {
    const daysOverdue = Math.floor(
      (Date.now() / 1000 - invoice.due_date!) / 86400
    );

    if (daysOverdue > 0 && daysOverdue <= 7) {
      // Gentle reminder
      await sendInvoiceReminder(invoice, 'gentle');
    } else if (daysOverdue > 7 && daysOverdue <= 14) {
      // Firm reminder
      await sendInvoiceReminder(invoice, 'firm');
    } else if (daysOverdue > 14 && daysOverdue <= 30) {
      // Escalation to account manager
      await escalateOverdueInvoice(invoice);
    } else if (daysOverdue > 30) {
      // Consider service suspension
      await notifyFounderOverdueInvoice(invoice, daysOverdue);
    }
  }
}
```

---

## 4. Purchase Orders

### What Is a Purchase Order?

A purchase order (PO) is a formal document issued by the buyer's procurement department authorizing the purchase. Enterprise customers require the PO number on every invoice for their internal tracking and approval workflows.

### PO Workflow

```
1. Enterprise prospect requests a quote
2. You generate a formal quote (PDF)
3. Prospect's procurement issues a PO
4. You create the subscription with PO reference
5. PO number appears on every invoice
6. Customer's accounts payable matches invoice to PO for payment
```

### Quote Generation

```typescript
// Generate an enterprise quote
async function generateQuote(params: {
  companyName: string;
  contactName: string;
  contactEmail: string;
  plan: PlanTier;
  seats: number;
  billingPeriod: 'monthly' | 'quarterly' | 'annual';
  customPricing: number; // Per-seat price after negotiation
  contractMonths: number;
  additionalTerms?: string[];
}): Promise<Stripe.Quote> {
  // Ensure customer exists in Stripe
  let customer = await findOrCreateStripeCustomer(params.contactEmail, params.companyName);

  const quote = await stripe.quotes.create({
    customer: customer.id,
    line_items: [{
      price_data: {
        product: STONE_AI_PRODUCT_ID,
        unit_amount: Math.round(params.customPricing * 100),
        currency: 'usd',
        recurring: {
          interval: params.billingPeriod === 'quarterly' ? 'month' : params.billingPeriod,
          interval_count: params.billingPeriod === 'quarterly' ? 3 : 1,
        },
      },
      quantity: params.seats,
    }],
    metadata: {
      company: params.companyName,
      seats: params.seats.toString(),
      contract_months: params.contractMonths.toString(),
    },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 86400, // 30-day expiry
    description: `Stone AI Enterprise — ${params.seats} seats, ${params.contractMonths}-month contract`,
    footer: 'This quote is valid for 30 days. Contact enterprise@stone-ai.net to proceed.',
  });

  // Finalize quote to make it sendable
  const finalizedQuote = await stripe.quotes.finalizeQuote(quote.id);

  return finalizedQuote;
}
```

---

## 5. Multi-Seat Licensing

### Multi-Seat Architecture

Enterprise accounts need multiple users under one billing entity:

```typescript
model Organization {
  id                String   @id @default(cuid())
  name              String
  stripeCustomerId  String   @unique
  subscriptionId    String?  @unique
  plan              PlanTier @default(FREE)
  maxSeats          Int      @default(1)
  currentSeats      Int      @default(1)
  billingContactId  String   // User who manages billing
  poNumber          String?
  contractStartDate DateTime?
  contractEndDate   DateTime?
  createdAt         DateTime @default(now())

  members           OrganizationMember[]
  billingContact    User     @relation(fields: [billingContactId], references: [id])
}

model OrganizationMember {
  id              String   @id @default(cuid())
  organizationId  String
  userId          String
  role            OrgRole  @default(MEMBER)
  addedAt         DateTime @default(now())
  addedBy         String   // userId who added them

  organization    Organization @relation(fields: [organizationId], references: [id])
  user            User         @relation(fields: [userId], references: [id])

  @@unique([organizationId, userId])
}

enum OrgRole {
  OWNER   // Can manage billing, add/remove members
  ADMIN   // Can add/remove members
  MEMBER  // Regular user access
}
```

### Seat Management

```typescript
// Add a seat to the enterprise subscription
async function addSeat(orgId: string, userEmail: string, addedByUserId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { members: true },
  });

  if (org.currentSeats >= org.maxSeats) {
    throw new Error('Seat limit reached. Contact your account manager to add more seats.');
  }

  // Find or invite user
  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    // Send invitation email
    await sendSeatInvitation(userEmail, org);
    return { status: 'invited' };
  }

  // Add to organization
  await prisma.organizationMember.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      role: 'MEMBER',
      addedBy: addedByUserId,
    },
  });

  // Update seat count
  await prisma.organization.update({
    where: { id: orgId },
    data: { currentSeats: { increment: 1 } },
  });

  // Update Stripe subscription quantity
  if (org.subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(org.subscriptionId);
    await stripe.subscriptionItems.update(subscription.items.data[0].id, {
      quantity: org.currentSeats + 1,
      proration_behavior: 'create_prorations',
    });
  }

  // Grant user the org's plan tier
  await prisma.user.update({
    where: { id: user.id },
    data: { stoneAiPlan: org.plan },
  });

  return { status: 'added', user };
}

// Remove a seat
async function removeSeat(orgId: string, userId: string) {
  await prisma.organizationMember.delete({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId,
      },
    },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { currentSeats: { decrement: 1 } },
  });

  // Update Stripe quantity
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (org.subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(org.subscriptionId);
    await stripe.subscriptionItems.update(subscription.items.data[0].id, {
      quantity: Math.max(1, org.currentSeats - 1),
      proration_behavior: 'create_prorations',
    });
  }

  // Downgrade user to FREE (they no longer have org plan)
  await prisma.user.update({
    where: { id: userId },
    data: { stoneAiPlan: 'FREE' },
  });
}
```

---

## 6. Enterprise Contract Management

### Contract Data Model

```typescript
model EnterpriseContract {
  id                String   @id @default(cuid())
  organizationId    String
  status            ContractStatus @default(DRAFT)
  startDate         DateTime
  endDate           DateTime
  autoRenew         Boolean  @default(true)
  renewalTermMonths Int      @default(12)
  totalContractValue Float
  monthlyValue      Float
  paymentTerms      Int      @default(30) // NET 30
  customTerms       Json?    // Additional contract terms
  signedAt          DateTime?
  signedBy          String?
  documentUrl       String?  // Link to signed PDF
  createdAt         DateTime @default(now())

  organization      Organization @relation(fields: [organizationId], references: [id])
}

enum ContractStatus {
  DRAFT
  SENT
  SIGNED
  ACTIVE
  EXPIRING  // Within 60 days of end
  EXPIRED
  RENEWED
  TERMINATED
}
```

### Contract Renewal Automation

```typescript
// Check for contracts approaching renewal
async function checkContractRenewals() {
  const expiringContracts = await prisma.enterpriseContract.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        lte: addDays(new Date(), 60),
        gte: new Date(),
      },
    },
    include: { organization: true },
  });

  for (const contract of expiringContracts) {
    const daysUntilExpiry = differenceInDays(contract.endDate, new Date());

    // Update status to EXPIRING
    if (contract.status !== 'EXPIRING') {
      await prisma.enterpriseContract.update({
        where: { id: contract.id },
        data: { status: 'EXPIRING' },
      });
    }

    // Send renewal notifications
    if (daysUntilExpiry === 60) {
      await sendRenewalNotification(contract, '60-day');
    } else if (daysUntilExpiry === 30) {
      await sendRenewalNotification(contract, '30-day');
    } else if (daysUntilExpiry === 14) {
      await sendRenewalNotification(contract, '14-day-urgent');
    } else if (daysUntilExpiry === 7) {
      await sendRenewalNotification(contract, '7-day-final');
    }

    // Auto-renew if configured
    if (daysUntilExpiry <= 0 && contract.autoRenew) {
      await autoRenewContract(contract);
    }
  }
}
```

---

## 7. Enterprise Security and Compliance

### Requirements Enterprise Customers Ask For

| Requirement | Current Status | Implementation |
|-------------|:-------------:|----------------|
| SOC 2 Type II | Future | Audit + certification ($20K-50K) |
| Data Processing Agreement (DPA) | Template ready | Standard DPA template |
| SSO (SAML/OIDC) | Clerk supports | Configuration per org |
| Data residency | Neon regions | Select region per org |
| Audit logs | Built | Extend for org-level |
| Role-based access | Built | Org roles (Owner/Admin/Member) |
| IP allowlisting | Future | Middleware enforcement |
| Custom data retention | Future | Per-org retention policies |
| SLA guarantee | Template ready | 99.9% uptime guarantee |
| Dedicated support | Manual | Slack Connect or email SLA |

### Enterprise Onboarding Checklist

```
□ Contract signed and filed
□ PO number recorded in Stripe
□ Stripe customer created with invoice billing
□ Organization created in database
□ Billing contact assigned
□ Seats provisioned
□ SSO configured (if required)
□ DPA signed (if required)
□ Dedicated Slack channel created (if applicable)
□ Onboarding call scheduled
□ Admin training session scheduled
□ Success metrics defined
□ 30-day check-in scheduled
□ 90-day review scheduled
```
