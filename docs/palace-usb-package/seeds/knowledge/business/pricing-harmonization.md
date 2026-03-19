# Pricing Harmonization — Cross-Product Strategy

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Cardinal (Head 2)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Revenue Critical

---

## 1. Executive Summary

Three products with independent pricing creates confusion. Three products with harmonized pricing creates bundles, cross-sell opportunities, and higher LTV. This seed defines how pricing aligns across Stone AI, Best AI, and Stone AI Tools — including bundle structures, cross-product discounts, unified billing through Stripe, and tier alignment.

---

## 2. Individual Product Pricing

### 2.1 Stone AI (Web SaaS) — Current

| Tier | Monthly | Annual (Monthly) | Agents | Key Features |
|------|---------|-----------------|--------|-------------|
| FREE | $0 | $0 | 4 | Basic agents, rate limited |
| STARTER | $19.99 | — | 16 | More agents, higher limits |
| PLUS | $49.99 | — | 30 | Most agents, forum access |
| SMART | $99.99 | $84.99/mo | 39 | Cloud AI (Sonnet), priority |
| PRO | $200 | $170/mo | 38 | All agents, max limits |

Promos: $9.99 first month, $14.99 trial, $39.99 growth

### 2.2 Best AI (Mobile) — Proposed

| Tier | Monthly | Annual (Monthly) | Key Features |
|------|---------|-----------------|-------------|
| FREE | $0 | $0 | 4 agents, text only, ads |
| BASIC | $9.99 | $7.99/mo | 12 agents, voice, no ads |
| PREMIUM | $24.99 | $19.99/mo | All mobile agents, voice, push priority |

**Pricing Rationale**: Mobile users expect lower price points. $9.99 entry removes hesitation. Premium at $24.99 is approachable for power users.

### 2.3 Stone AI Tools (API Marketplace) — Proposed

| Tier | Monthly | Annual (Monthly) | Key Features |
|------|---------|-----------------|-------------|
| FREE | $0 | $0 | 1,000 calls/mo, 3 agents, rate limited |
| DEVELOPER | $14.99 | $11.99/mo | 25,000 calls/mo, all agents, webhooks |
| BUSINESS | $49.99 | $39.99/mo | 250,000 calls/mo, priority, SLA, support |

Usage overage (DEVELOPER+): $0.002 per additional call

---

## 3. Bundle Pricing

### 3.1 Bundle Tiers

**EXPLORER Bundle** (any 2 products):
```
Pricing: Sum of individual products - 20% discount
Example: Stone AI STARTER ($19.99) + Best AI BASIC ($9.99)
  Individual: $29.98/mo
  Bundle: $23.98/mo (save $5.98/mo)
```

**POWERHOUSE Bundle** (all 3 products):
```
Pricing: Sum of individual products - 30% discount
Example: Stone AI PLUS ($49.99) + Best AI PREMIUM ($24.99) + Tools DEVELOPER ($14.99)
  Individual: $89.97/mo
  Bundle: $62.98/mo (save $26.99/mo)
```

### 3.2 Bundle Matrix

| Stone AI | Best AI | Tools | Individual | Explorer (-20%) | Powerhouse (-30%) |
|----------|---------|-------|-----------|----------------|-------------------|
| STARTER | BASIC | — | $29.98 | $23.98 | — |
| STARTER | — | DEVELOPER | $34.98 | $27.98 | — |
| — | BASIC | DEVELOPER | $24.98 | $19.98 | — |
| STARTER | BASIC | DEVELOPER | $44.97 | — | $31.48 |
| PLUS | PREMIUM | DEVELOPER | $89.97 | — | $62.98 |
| SMART | PREMIUM | BUSINESS | $174.97 | — | $122.48 |
| PRO | PREMIUM | BUSINESS | $274.98 | — | $192.49 |

### 3.3 Bundle Rules

1. **Minimum tier**: All bundled products must be on a paid tier (no free in bundles)
2. **Mix and match**: Any paid tier on any product can combine
3. **Billing cycle**: Bundle must be same billing cycle (monthly or annual)
4. **Annual bundle bonus**: Annual bundles get additional 5% off (35% total for Powerhouse)
5. **Upgrade any time**: Can upgrade individual product tier within bundle
6. **Downgrade protection**: Downgrading one product below paid removes bundle discount

---

## 4. Cross-Product Discounts

### 4.1 Discount Types

| Discount | Trigger | Amount | Duration |
|----------|---------|--------|----------|
| Second Product Trial | Paid on product 1, signs up product 2 | 7 days free premium | Once per product |
| Cross-Product Upgrade | Upgrades tier while on 2+ products | 10% off upgrade price | First month |
| Bundle Conversion | Eligible for bundle (2+ paid) | 20-30% off combined | Ongoing |
| Annual Commitment | Switches any bundle to annual | Extra 5% off | Ongoing |
| Referral Cross-Product | Referral signs up for a different product | $10 credit | Per referral |
| Loyalty Milestone | 6 months on 2+ products | 1 month free on lowest product | Once |

### 4.2 Discount Stacking Rules

1. **Bundle discount + Annual discount**: YES (max combined: 35%)
2. **Bundle discount + Promo**: NO (bundle already discounted)
3. **Annual discount + Promo**: YES (first month promo + annual pricing)
4. **Multiple product promos**: NO (max 1 promo per product at a time)
5. **Referral credit + Any discount**: YES (credit is separate from pricing)

---

## 5. Unified Billing

### 5.1 Stripe Architecture

Each product has a separate Stripe account for revenue tracking, but billing is unified for the user.

```
Option A: Single Stripe Account (RECOMMENDED for bundles)
  - One subscription per user, one invoice
  - Bundle pricing as a Stripe "plan"
  - Product breakdown visible on invoice
  - Simpler for users, simpler for accounting

Option B: Multiple Stripe Accounts with Connect
  - Product-specific revenue tracking
  - Connected accounts for each product
  - More complex, better revenue attribution
  - Use only if needed for legal/accounting separation
```

**Recommended: Option A** until revenue complexity requires separate accounting.

### 5.2 Stripe Product/Price Structure

```typescript
// Stripe products
const stripeProducts = {
  stoneAi: "prod_stone_ai",
  bestAi: "prod_best_ai",
  tools: "prod_tools",
  explorerBundle: "prod_explorer_bundle",
  powerhouseBundle: "prod_powerhouse_bundle",
};

// Example: Powerhouse Bundle pricing
const powerhousePrices = [
  {
    id: "price_ph_starter_basic_dev_monthly",
    product: "prod_powerhouse_bundle",
    unit_amount: 3148, // $31.48
    recurring: { interval: "month" },
    metadata: {
      stone_ai_tier: "STARTER",
      best_ai_tier: "BASIC",
      tools_tier: "DEVELOPER",
      discount_percent: "30",
    },
  },
  // ... more combinations
];
```

### 5.3 Invoice Design

```
INVOICE — Concept E / Three-Headed Monster
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Customer: john@example.com
Plan: POWERHOUSE Bundle (30% off)
Billing Period: March 1-31, 2026

Products:
  Stone AI — PLUS tier           $49.99
  Best AI — PREMIUM tier         $24.99
  Stone AI Tools — DEVELOPER     $14.99
                                 ──────
  Subtotal:                      $89.97
  POWERHOUSE discount (-30%):   -$26.99
                                 ──────
  Total:                         $62.98

Next billing: April 1, 2026
Manage subscription: stone-ai.net/settings/billing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 6. Tier Alignment Strategy

### 6.1 Feature Parity Principles

Users should intuitively understand how tiers map across products:

```
Value Alignment:
  FREE tier = Try the product, limited but useful
  Entry paid = Remove major friction, full basic experience
  Mid paid = Power user features, most agents/calls
  Top paid = Everything, priority, SLA

Cross-Product Expectation:
  A STARTER user on Stone AI should feel like a BASIC user on Best AI
  (same relative value, just different product)
```

### 6.2 Tier Equivalency Map

| Value Level | Stone AI | Best AI | Tools |
|------------|---------|--------|-------|
| Free | FREE (4 agents) | FREE (4 agents) | FREE (1K calls) |
| Entry | STARTER ($19.99) | BASIC ($9.99) | DEVELOPER ($14.99) |
| Mid | PLUS ($49.99) | — | — |
| Power | SMART ($99.99) | PREMIUM ($24.99) | BUSINESS ($49.99) |
| Max | PRO ($200) | — | — |

### 6.3 Agent Access Harmonization

Agents available per product and tier:

```
40 total agents (38 user-facing + Stone internal + Chaos founder-only)

Stone AI distribution: As defined (4/16/30/39/42 by tier)
Best AI distribution: Mobile-optimized subset
  FREE: 4 (same 4 as Stone AI free)
  BASIC: 12 (most popular from Stone AI)
  PREMIUM: 30 (all mobile-compatible agents)

Tools distribution: API access to agents
  FREE: 3 (demo agents)
  DEVELOPER: All 38 user-facing agents
  BUSINESS: All 38 + priority queue
```

---

## 7. Pricing Psychology

### 7.1 Anchoring Strategy

```
Bundle page layout (left to right):
  1. Show individual pricing first (anchor high)
  2. Show EXPLORER bundle (moderate savings)
  3. Show POWERHOUSE bundle (best value — highlighted)

Example:
  "Individually: $89.97/mo"
  "Explorer (2 products): $71.98/mo — save 20%"
  "POWERHOUSE (all 3): $62.98/mo — save 30% ★ BEST VALUE"
```

### 7.2 Price Ending Psychology

- All prices end in .99 (familiar, expected in SaaS)
- Bundle prices end in .98 (signals calculation/discount)
- Annual savings shown as monthly rate (lower number)

### 7.3 Upgrade Nudges

```
On Stone AI (user on STARTER):
  "You're on STARTER. Add Best AI BASIC for just $4/mo more with Explorer bundle."
  (Shows: $19.99 → $23.98 for two products)

On Best AI (user on BASIC):
  "Your web agents miss you. Add Stone AI STARTER for $14/mo more."
  (Shows: $9.99 → $23.98 for two products)

On any two products:
  "You're 1 product away from POWERHOUSE pricing.
   Add [third product] and save 30% on everything."
```

---

## 8. Revenue Modeling

### 8.1 Revenue Projections by Pricing Model

**Scenario: 5,000 total users, Month 6**

| Scenario | Free | Entry Paid | Mid Paid | Top Paid | Bundle | MRR |
|----------|------|-----------|---------|---------|--------|-----|
| No bundles | 3,500 | 800 | 400 | 200 | 0 | $28,500 |
| With bundles (20% adopt) | 3,500 | 640 | 320 | 160 | 280 | $31,200 |
| Aggressive bundles (35%) | 3,500 | 520 | 260 | 130 | 490 | $33,800 |

**Key insight**: Bundles increase MRR even at a discount because they increase conversion from free and reduce churn.

### 8.2 Bundle Adoption Forecast

```
Month 1: 5% of multi-product users on bundle
Month 3: 15% (awareness grows)
Month 6: 25% (pricing page optimization, auto-detection)
Month 12: 40% (target steady state)
```

---

## 9. Implementation

### Phase 1: Individual Pricing (Current)
- Stone AI pricing live and working
- Stripe configured for Stone AI

### Phase 2: Multi-Product Pricing (Best AI + Tools Launch)
- Best AI and Tools pricing configured in Stripe
- Individual subscriptions per product
- Cross-product discount codes (manual)

### Phase 3: Bundle Pricing (Month 2-3)
- Bundle Stripe products and prices created
- Unified billing page showing all products
- Auto-detect bundle eligibility
- Bundle upgrade flow

### Phase 4: Optimization (Month 4-6)
- A/B test bundle discount percentages
- Test annual commitment incentives
- Dynamic pricing experiments
- Price increase strategy for established users

---

*Seed created by Agent Stone (Head 1) + Cardinal (Head 2) — Three-Headed Monster Operations*
*Harmonized pricing makes three products feel like one investment. Bundles increase conversion, retention, and LTV simultaneously.*
