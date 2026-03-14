# Partner Integration Framework for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / Business Development
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Intermediate-Advanced
- **Prerequisites**: Multi-tenancy, billing, API gateway
- **Last Updated**: 2026-03-09

---

## 1. Partner Program Overview

### Partner Types

```
Partner Tiers:

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  TIER 1: Technology Partners                                 │
│  ─────────────────────────                                  │
│  Companies that integrate Stone AI agents into their own     │
│  products. White-label API access, co-branded experiences.   │
│  Revenue share: 20% of partner-referred usage                │
│                                                              │
│  Examples: SaaS platforms, dev tool companies                │
│                                                              │
│  TIER 2: Reseller Partners                                   │
│  ─────────────────────────                                  │
│  Companies that resell Stone AI Tools to their customers.    │
│  Volume discounts, custom branding, dedicated support.       │
│  Revenue share: 30% of subscription revenue referred         │
│                                                              │
│  Examples: IT consultancies, agencies                        │
│                                                              │
│  TIER 3: Referral Partners                                   │
│  ─────────────────────────                                  │
│  Individuals/companies that refer developers to Stone AI.    │
│  Simple referral links, pay-per-conversion.                  │
│  Commission: $50 per paid conversion + 10% recurring (12mo)  │
│                                                              │
│  Examples: Bloggers, dev advocates, influencers              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Partner Data Model

```prisma
// File: prisma/schema.prisma (partner additions)

model Partner {
  id              String          @id @default(cuid())
  name            String
  slug            String          @unique
  tier            PartnerTier     @default(REFERRAL)
  status          PartnerStatus   @default(PENDING)

  // Contact
  contactName     String
  contactEmail    String
  website         String?

  // Branding
  logoUrl         String?
  brandColor      String?         // Hex color for co-branding
  customDomain    String?         // partner.tools.stone-ai.net

  // Commercial
  revenueSharePercent Float       @default(10)
  payoutMethod    String?         // "stripe" | "paypal" | "wire"
  payoutDetails   Json?           // Encrypted payout info
  minimumPayout   Int             @default(100) // $100 minimum

  // API access
  partnerApiKeyId String?         // Special API key with partner permissions

  // Metadata
  settings        Json            @default("{}")
  metadata        Json            @default("{}")

  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  approvedAt      DateTime?

  // Relations
  referrals       PartnerReferral[]
  payouts         PartnerPayout[]
  tenants         Tenant[]        @relation("PartnerTenants")

  @@index([tier, status])
  @@map("partners")
}

enum PartnerTier {
  TECHNOLOGY
  RESELLER
  REFERRAL
}

enum PartnerStatus {
  PENDING
  ACTIVE
  SUSPENDED
  DEACTIVATED
}

model PartnerReferral {
  id              String          @id @default(cuid())
  partnerId       String
  tenantId        String?         // Null until tenant signs up
  referralCode    String          @unique

  // Tracking
  clickCount      Int             @default(0)
  signupAt        DateTime?
  convertedAt     DateTime?       // When tenant becomes paid
  churnedAt       DateTime?

  // Attribution
  source          String?         // "blog", "twitter", "youtube", etc.
  campaign        String?
  medium          String?

  // Revenue tracking
  totalRevenue    Int             @default(0) // Microdollars
  totalPaid       Int             @default(0) // Microdollars paid to partner

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  partner         Partner         @relation(fields: [partnerId], references: [id])

  @@index([partnerId])
  @@index([referralCode])
  @@map("partner_referrals")
}

model PartnerPayout {
  id              String          @id @default(cuid())
  partnerId       String
  amount          Int             // In cents
  currency        String          @default("usd")
  status          PayoutStatus    @default(PENDING)
  period          String          // "2026-03"

  // Details
  referralCount   Int             @default(0)
  revenueGenerated Int            @default(0) // Total revenue from referrals
  commissionRate  Float

  // Payment
  payoutMethod    String?
  payoutReference String?         // External payment ID
  paidAt          DateTime?

  createdAt       DateTime        @default(now())

  partner         Partner         @relation(fields: [partnerId], references: [id])

  @@index([partnerId, period])
  @@map("partner_payouts")
}

enum PayoutStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
}
```

---

## 3. White-Label API Access

### 3.1 Custom Domain and Branding

```typescript
// File: src/services/partner-whitelabel.ts

interface WhiteLabelConfig {
  partnerId: string;
  customDomain?: string;       // api.partner.com → proxies to Stone AI
  brandName: string;           // Shown in error messages
  brandColor: string;          // Used in developer portal
  logoUrl: string;
  supportEmail: string;
  docsUrl?: string;           // Custom docs URL
  hideStoneAIBranding: boolean;
}

class WhiteLabelService {
  /**
   * Set up white-label configuration for a technology partner.
   */
  async configure(config: WhiteLabelConfig): Promise<void> {
    await db.raw.partner.update({
      where: { id: config.partnerId },
      data: {
        customDomain: config.customDomain,
        logoUrl: config.logoUrl,
        brandColor: config.brandColor,
        settings: {
          brandName: config.brandName,
          supportEmail: config.supportEmail,
          docsUrl: config.docsUrl,
          hideStoneAIBranding: config.hideStoneAIBranding,
        },
      },
    });

    // Set up custom domain routing in Cloudflare
    if (config.customDomain) {
      await this.setupCustomDomain(config.partnerId, config.customDomain);
    }
  }

  /**
   * Apply white-label branding to API responses.
   * Partner's customers see partner branding, not Stone AI.
   */
  async applyBranding(req: GatewayRequest, res: GatewayResponse): Promise<void> {
    const partnerId = req.metadata.partnerId as string | undefined;
    if (!partnerId) return;

    const partner = await this.getCachedPartnerConfig(partnerId);
    if (!partner) return;

    const settings = partner.settings as any;

    // Replace Stone AI branding in error messages
    if (res.statusCode >= 400 && settings.hideStoneAIBranding) {
      const body = res.getBody() as any;
      if (body?.error?.docs_url) {
        body.error.docs_url = body.error.docs_url.replace(
          'tools.stone-ai.net',
          settings.docsUrl ?? partner.customDomain ?? 'tools.stone-ai.net'
        );
      }
      if (body?.error?.message) {
        body.error.message = body.error.message.replace(
          'Stone AI Tools',
          settings.brandName
        );
      }
      res.setBody(body);
    }

    // Custom response headers
    if (settings.hideStoneAIBranding) {
      res.removeHeader('X-Powered-By');
    }
  }

  private async setupCustomDomain(partnerId: string, domain: string): Promise<void> {
    // 1. Verify domain ownership (DNS TXT record)
    // 2. Configure Cloudflare custom hostname
    // 3. Provision SSL certificate
    // 4. Update routing rules

    logger.info('Custom domain configured', { partnerId, domain });
  }
}
```

### 3.2 Partner API Key Scoping

```typescript
// File: src/services/partner-api-access.ts

class PartnerApiAccess {
  /**
   * Create a partner-scoped API key.
   * Partner keys have special permissions and are tracked separately.
   */
  async createPartnerKey(partnerId: string): Promise<{ key: string; id: string }> {
    const partner = await db.raw.partner.findUniqueOrThrow({
      where: { id: partnerId },
    });

    const { fullKey, keyHash, keyPrefix } = generateApiKey();

    const apiKey = await db.raw.apiKey.create({
      data: {
        tenantId: partnerId, // Partner acts as a pseudo-tenant
        name: `Partner: ${partner.name}`,
        keyHash,
        keyPrefix,
        scopes: this.getPartnerScopes(partner.tier),
        createdBy: 'system',
        metadata: {
          isPartnerKey: true,
          partnerId,
          partnerTier: partner.tier,
        },
      },
    });

    await db.raw.partner.update({
      where: { id: partnerId },
      data: { partnerApiKeyId: apiKey.id },
    });

    return { key: fullKey, id: apiKey.id };
  }

  private getPartnerScopes(tier: PartnerTier): string[] {
    switch (tier) {
      case 'TECHNOLOGY':
        return [
          'agents:read',
          'agents:invoke',
          'usage:read',
          'webhooks:read',
          'webhooks:write',
          'partner:manage-tenants',
          'partner:usage-reports',
        ];
      case 'RESELLER':
        return [
          'agents:read',
          'partner:manage-tenants',
          'partner:usage-reports',
          'partner:billing',
        ];
      case 'REFERRAL':
        return [
          'partner:referral-stats',
        ];
    }
  }
}
```

---

## 4. Revenue Sharing

### 4.1 Revenue Tracking

```typescript
// File: src/services/partner-revenue.ts

class PartnerRevenueService {
  /**
   * Track revenue generated by partner-referred tenants.
   * Called when a referred tenant's payment succeeds.
   */
  async trackRevenue(tenantId: string, amountCents: number, period: string): Promise<void> {
    // Find referral for this tenant
    const referral = await db.raw.partnerReferral.findFirst({
      where: { tenantId },
      include: { partner: true },
    });

    if (!referral) return; // Tenant was not referred by a partner

    const partner = referral.partner;
    const commissionCents = Math.floor(amountCents * (partner.revenueSharePercent / 100));
    const commissionMicros = commissionCents * 10_000;

    // Update referral revenue
    await db.raw.partnerReferral.update({
      where: { id: referral.id },
      data: {
        totalRevenue: { increment: amountCents * 10_000 },
      },
    });

    // Accrue commission for the period
    await db.raw.partnerPayout.upsert({
      where: {
        partnerId_period: { partnerId: partner.id, period },
      },
      create: {
        partnerId: partner.id,
        amount: commissionCents,
        period,
        commissionRate: partner.revenueSharePercent,
        revenueGenerated: amountCents,
        referralCount: 1,
      },
      update: {
        amount: { increment: commissionCents },
        revenueGenerated: { increment: amountCents },
        referralCount: { increment: 0 },
      },
    });

    logger.info('Partner revenue tracked', {
      partnerId: partner.id,
      tenantId,
      revenueCents: amountCents,
      commissionCents,
      period,
    });
  }

  /**
   * Process monthly payouts for all eligible partners.
   * Run at the end of each billing period.
   */
  async processPayouts(period: string): Promise<void> {
    const pendingPayouts = await db.raw.partnerPayout.findMany({
      where: { period, status: 'PENDING' },
      include: { partner: true },
    });

    for (const payout of pendingPayouts) {
      // Check minimum payout threshold
      if (payout.amount < payout.partner.minimumPayout * 100) {
        // Below minimum — roll over to next month
        logger.info('Payout below minimum, rolling over', {
          partnerId: payout.partnerId,
          amount: payout.amount,
          minimum: payout.partner.minimumPayout * 100,
        });
        continue;
      }

      try {
        await this.executePayout(payout);
      } catch (error) {
        logger.error('Payout failed', {
          partnerId: payout.partnerId,
          amount: payout.amount,
          error: error instanceof Error ? error.message : 'Unknown',
        });

        await db.raw.partnerPayout.update({
          where: { id: payout.id },
          data: { status: 'FAILED' },
        });
      }
    }
  }

  private async executePayout(payout: PartnerPayout & { partner: Partner }): Promise<void> {
    await db.raw.partnerPayout.update({
      where: { id: payout.id },
      data: { status: 'PROCESSING' },
    });

    // Execute payment via Stripe Connect or PayPal
    const paymentRef = await this.sendPayment(
      payout.partner.payoutMethod ?? 'stripe',
      payout.partner.payoutDetails,
      payout.amount,
      payout.currency
    );

    await db.raw.partnerPayout.update({
      where: { id: payout.id },
      data: {
        status: 'PAID',
        payoutReference: paymentRef,
        paidAt: new Date(),
      },
    });

    // Update referral paid amounts
    await db.raw.partnerReferral.updateMany({
      where: { partnerId: payout.partnerId },
      data: {
        totalPaid: { increment: payout.amount * 10_000 },
      },
    });

    // Notify partner
    await sendEmail(payout.partner.contactEmail, 'partner-payout-sent', {
      amount: (payout.amount / 100).toFixed(2),
      period: payout.period,
      referralCount: payout.referralCount,
    });
  }
}
```

---

## 5. Partner Portal

### 5.1 Partner Dashboard

```
Partner Dashboard Layout:

┌─────────────────────────────────────────────────────┐
│ Partner Portal: Acme Corp (Technology Partner)       │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Revenue This Month                                   │
│ ███████████████████████░░░░░░ $4,230 / $5,000 target │
│                                                      │
│ ┌──────────────────┬──────────────────────────────┐ │
│ │ Key Metrics       │ Revenue Trend                │ │
│ │                   │                              │ │
│ │ Active tenants: 47│ [Monthly bar chart showing   │ │
│ │ New this month: 8 │  revenue growth over 6       │ │
│ │ Churned: 2        │  months]                     │ │
│ │ Revenue share: 20%│                              │ │
│ │ Next payout: Apr 1│                              │ │
│ └──────────────────┴──────────────────────────────┘ │
│                                                      │
│ Referral Performance                                 │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Code      Clicks  Signups  Conversions  Revenue  │ │
│ │ ACME2026  1,234   156      47           $4,230   │ │
│ │ ACME-BLG  456     42       12           $1,080   │ │
│ │ ACME-YT   234     28       8            $720     │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ [Create Referral Link] [Download Report] [Settings]  │
└─────────────────────────────────────────────────────┘
```

### 5.2 Partner API Endpoints

```typescript
// File: src/app/api/partner/dashboard/route.ts

export async function GET(req: Request) {
  const partnerId = await requirePartnerAuth(req);

  const partner = await db.raw.partner.findUniqueOrThrow({
    where: { id: partnerId },
  });

  const period = getCurrentBillingPeriod();

  const [referrals, currentPayout, monthlyStats] = await Promise.all([
    // Active referrals
    db.raw.partnerReferral.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
    }),

    // Current period payout
    db.raw.partnerPayout.findUnique({
      where: { partnerId_period: { partnerId, period } },
    }),

    // Monthly stats (last 6 months)
    db.raw.partnerPayout.findMany({
      where: { partnerId, status: { not: 'FAILED' } },
      orderBy: { period: 'desc' },
      take: 6,
    }),
  ]);

  const activeTenants = referrals.filter(r => r.convertedAt && !r.churnedAt);
  const totalRevenue = referrals.reduce((sum, r) => sum + r.totalRevenue, 0);

  return Response.json({
    partner: {
      name: partner.name,
      tier: partner.tier,
      revenueSharePercent: partner.revenueSharePercent,
    },
    metrics: {
      activeTenants: activeTenants.length,
      totalReferrals: referrals.length,
      totalRevenue: totalRevenue / 1_000_000, // Convert microdollars
      currentPeriodRevenue: (currentPayout?.revenueGenerated ?? 0) / 100,
      pendingPayout: (currentPayout?.amount ?? 0) / 100,
      nextPayoutDate: getNextPayoutDate(),
    },
    referrals: referrals.map(r => ({
      code: r.referralCode,
      clicks: r.clickCount,
      signedUp: !!r.signupAt,
      converted: !!r.convertedAt,
      revenue: r.totalRevenue / 1_000_000,
      source: r.source,
    })),
    monthlyStats: monthlyStats.map(s => ({
      period: s.period,
      revenue: s.revenueGenerated / 100,
      commission: s.amount / 100,
      referrals: s.referralCount,
      status: s.status,
    })),
  });
}
```

---

## 6. Referral Tracking

### 6.1 Referral Link System

```typescript
// File: src/services/partner-referral.ts

class PartnerReferralService {
  /**
   * Generate a referral link for a partner.
   */
  async createReferralLink(
    partnerId: string,
    source?: string,
    campaign?: string
  ): Promise<{ code: string; url: string }> {
    const code = `${await this.getPartnerSlug(partnerId)}-${generateShortCode()}`;

    await db.raw.partnerReferral.create({
      data: {
        partnerId,
        referralCode: code,
        source,
        campaign,
      },
    });

    return {
      code,
      url: `https://tools.stone-ai.net/signup?ref=${code}`,
    };
  }

  /**
   * Track a referral click.
   */
  async trackClick(referralCode: string): Promise<void> {
    await db.raw.partnerReferral.update({
      where: { referralCode },
      data: { clickCount: { increment: 1 } },
    });
  }

  /**
   * Attribute a signup to a referral.
   */
  async attributeSignup(referralCode: string, tenantId: string): Promise<void> {
    await db.raw.partnerReferral.update({
      where: { referralCode },
      data: {
        tenantId,
        signupAt: new Date(),
      },
    });

    // Mark tenant as partner-referred
    await db.raw.tenant.update({
      where: { id: tenantId },
      data: {
        metadata: {
          referralCode,
          referredBy: await this.getPartnerIdFromCode(referralCode),
        },
      },
    });
  }

  /**
   * Attribute a conversion (free → paid).
   */
  async attributeConversion(tenantId: string): Promise<void> {
    const referral = await db.raw.partnerReferral.findFirst({
      where: { tenantId, convertedAt: null },
    });

    if (!referral) return;

    await db.raw.partnerReferral.update({
      where: { id: referral.id },
      data: { convertedAt: new Date() },
    });

    logger.info('Partner referral converted', {
      partnerId: referral.partnerId,
      tenantId,
      referralCode: referral.referralCode,
    });
  }

  private generateShortCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }
}
```

---

## 7. Partner Onboarding

### 7.1 Application Flow

```typescript
// File: src/app/api/partner/apply/route.ts

const PartnerApplicationSchema = z.object({
  companyName: z.string().min(2).max(200),
  contactName: z.string().min(2).max(100),
  contactEmail: z.string().email(),
  website: z.string().url(),
  tier: z.enum(['TECHNOLOGY', 'RESELLER', 'REFERRAL']),
  description: z.string().min(50).max(2000),
  expectedVolume: z.enum(['<1000', '1000-10000', '10000-100000', '>100000']),
  useCase: z.string().min(20).max(1000),
}).strict();

export async function POST(req: Request) {
  const body = PartnerApplicationSchema.parse(await req.json());

  const partner = await db.raw.partner.create({
    data: {
      name: body.companyName,
      slug: slugify(body.companyName),
      tier: body.tier,
      status: 'PENDING',
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      website: body.website,
      metadata: {
        application: {
          description: body.description,
          expectedVolume: body.expectedVolume,
          useCase: body.useCase,
          appliedAt: new Date().toISOString(),
        },
      },
    },
  });

  // Notify team for review
  await sendFounderAlert({
    alertType: 'partner.application',
    title: `[PARTNER] New ${body.tier} application: ${body.companyName}`,
    body: `${body.contactName} (${body.contactEmail}) applied as ${body.tier} partner. Expected volume: ${body.expectedVolume}.`,
    details: { partnerId: partner.id, ...body },
  });

  // Send confirmation email
  await sendEmail(body.contactEmail, 'partner-application-received', {
    companyName: body.companyName,
    tier: body.tier,
  });

  return Response.json({
    id: partner.id,
    status: 'pending',
    message: 'Application received. We will review and respond within 48 hours.',
  }, { status: 201 });
}
```

### 7.2 Partner Approval

```typescript
// File: src/services/partner-onboarding.ts

class PartnerOnboardingService {
  async approvePartner(partnerId: string): Promise<void> {
    const partner = await db.raw.partner.findUniqueOrThrow({
      where: { id: partnerId },
    });

    // 1. Activate partner
    await db.raw.partner.update({
      where: { id: partnerId },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        revenueSharePercent: this.getDefaultRevenueShare(partner.tier),
      },
    });

    // 2. Create partner API key (for Technology partners)
    if (partner.tier === 'TECHNOLOGY') {
      const { key } = await partnerApiAccess.createPartnerKey(partnerId);
      // Key will be sent via secure channel
    }

    // 3. Create initial referral code
    const referral = await partnerReferralService.createReferralLink(partnerId);

    // 4. Send welcome email with onboarding guide
    await sendEmail(partner.contactEmail, 'partner-approved', {
      companyName: partner.name,
      tier: partner.tier,
      referralCode: referral.code,
      referralUrl: referral.url,
      portalUrl: 'https://tools.stone-ai.net/partner/dashboard',
    });

    logger.info('Partner approved', { partnerId, tier: partner.tier });
  }

  private getDefaultRevenueShare(tier: PartnerTier): number {
    switch (tier) {
      case 'TECHNOLOGY': return 20;
      case 'RESELLER': return 30;
      case 'REFERRAL': return 10;
    }
  }
}
```

---

## 8. Partner Usage Reporting

```typescript
// File: src/services/partner-reporting.ts

class PartnerReportingService {
  /**
   * Generate monthly partner report.
   */
  async generateMonthlyReport(partnerId: string, period: string): Promise<PartnerReport> {
    const referrals = await db.raw.partnerReferral.findMany({
      where: { partnerId },
    });

    const tenantIds = referrals
      .filter(r => r.tenantId)
      .map(r => r.tenantId!);

    // Aggregate usage across all referred tenants
    const usage = await db.raw.usageRecord.aggregate({
      where: {
        tenantId: { in: tenantIds },
        billingPeriod: period,
      },
      _sum: {
        requestCount: true,
        tokenCount: true,
        costMicros: true,
      },
    });

    // Revenue breakdown
    const payout = await db.raw.partnerPayout.findUnique({
      where: { partnerId_period: { partnerId, period } },
    });

    return {
      period,
      referrals: {
        total: referrals.length,
        active: referrals.filter(r => r.convertedAt && !r.churnedAt).length,
        newThisPeriod: referrals.filter(r =>
          r.signupAt && r.signupAt.toISOString().startsWith(period)
        ).length,
        conversionsThisPeriod: referrals.filter(r =>
          r.convertedAt && r.convertedAt.toISOString().startsWith(period)
        ).length,
      },
      usage: {
        totalCalls: usage._sum.requestCount ?? 0,
        totalTokens: usage._sum.tokenCount ?? 0,
        totalRevenue: (usage._sum.costMicros ?? 0) / 1_000_000,
      },
      payout: {
        amount: (payout?.amount ?? 0) / 100,
        status: payout?.status ?? 'PENDING',
        referralCount: payout?.referralCount ?? 0,
      },
    };
  }
}
```

---

## 9. Co-Branding

```typescript
// File: src/services/partner-cobranding.ts

interface CoBrandConfig {
  partnerLogo: string;
  partnerName: string;
  partnerColor: string;
  showPoweredBy: boolean;  // "Powered by Stone AI"
  customFooter?: string;
}

/**
 * Co-branding applies to:
 * 1. API error messages (partner name instead of Stone AI)
 * 2. Developer portal (partner logo and colors)
 * 3. Emails to referred tenants (co-branded)
 * 4. Dashboard (partner branding for their tenants)
 */

function applyCobranding(template: string, config: CoBrandConfig): string {
  let result = template;

  if (!config.showPoweredBy) {
    result = result.replace(/Stone AI Tools/g, config.partnerName);
    result = result.replace(/tools\.stone-ai\.net/g, config.customDomain ?? 'tools.stone-ai.net');
  } else {
    // "PartnerName (Powered by Stone AI)"
    result = result.replace(
      /Stone AI Tools/g,
      `${config.partnerName} (Powered by Stone AI)`
    );
  }

  return result;
}
```

---

## Summary

The Stone AI Tools Partner Integration Framework enables three tiers of partnerships:

1. **Technology Partners**: White-label API access with custom domains, co-branding, and 20% revenue share
2. **Reseller Partners**: Volume discounts, custom branding, dedicated support, 30% revenue share
3. **Referral Partners**: Simple referral links, $50 per conversion + 10% recurring commission

Key components:
- **Partner Data Model**: Full tracking of referrals, revenue, and payouts
- **White-Label Access**: Custom domains, branded error messages, partner-scoped API keys
- **Revenue Sharing**: Automatic commission tracking, monthly payout processing, minimum thresholds
- **Partner Portal**: Dashboard with metrics, referral management, payout history
- **Referral Tracking**: Click → signup → conversion attribution with source/campaign tracking
- **Co-Branding**: Partner logos, colors, and names throughout the experience
- **Partner Onboarding**: Application → review → approval → API key + referral code generation
