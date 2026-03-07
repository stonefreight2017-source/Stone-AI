import { Tier as PrismaTier, Mode as PrismaMode } from "@/generated/prisma/enums";

// Re-export Prisma enums for convenience
export const Tier = PrismaTier;
export type Tier = PrismaTier;

export const Mode = PrismaMode;
export type Mode = PrismaMode;

// Extended mode type that includes PRIORITY (not stored in DB, used for routing)
export type RequestMode = "LOCAL" | "SMART" | "PRIORITY";

export interface TierLimits {
  messagesPerDay: number;
  tokensPerMonth: number;
  maxResponseTokens: number;          // Max response tokens for LOCAL mode
  concurrentRequests: number;
  requestsPerMinute: number;
  smartMessagesPerDay: number;         // Hard cap on cloud (SMART) messages per day
  smartMaxResponseTokens: number;      // Max response tokens for SMART mode (lower = cheaper)
  smartContextMessages: number;        // Max past messages sent as context in SMART mode
  smartTokensPerMonth: number;         // Hard monthly cap on total SMART token usage (input+output)
}

/**
 * SMART mode costs the company real money (OpenAI API).
 * Each SMART message counts as this many messages against daily quota.
 * This protects margins and nudges users toward Local mode.
 */
export const SMART_COST_MULTIPLIER = 3;

export interface TierPerks {
  contextMessages: number;      // How many past messages sent to model as context
  autoRouting: boolean;          // Auto-pick best model per question
  conversationExport: boolean;
  priorityQueue: boolean;
  apiAccess: boolean;            // Can generate API keys
  commercialLicense: boolean;    // Clean commercial use rights (no attribution)
  earlyAccess: boolean;          // New agents 30 days early
  agentBuilder: boolean;         // Create custom agents with own prompts + knowledge
  referralMultiplier: number;    // Referral credit multiplier (1 = normal, 2 = double)
  maxBesties: number;            // Max AI Bestie companions per user
  // ═══ Capability features ═══
  maxDocuments: number;          // Max uploaded documents for RAG (0 = disabled)
  webSearchesPerDay: number;     // Web searches per day (0 = disabled)
  codeExecutionsPerDay: number;  // Code sandbox runs per day (0 = disabled)
  fileUploadAnalysis: boolean;   // Upload and analyze files (PDF, CSV, images)

  voiceInteraction: boolean;     // Voice input/output and text-to-speech
  pluginIntegrations: number;    // Max connected integrations (Zapier, Google, etc.)
  teamWorkspace: boolean;        // Shared workspace for team collaboration
  customModelFineTuning: boolean; // Fine-tune models on custom data
  // ═══ Compliance features ═══
  soc2Compliance: boolean;       // SOC 2 audit trail and controls
  hipaaCompliance: boolean;      // HIPAA-ready data handling
  mobileApp: boolean;            // Mobile app access (when available)
}

export interface TierConfig {
  name: string;
  price: number;
  stripePriceEnvKey: string | null;
  limits: TierLimits;
  perks: TierPerks;
  allowedModes: RequestMode[];
  priority: number;
  cloudFallback: boolean;
  /** Which local model to use for this tier */
  localModel: string;
  /** Number of agents accessible at this tier */
  agentCount: number;
  /** Short description of what this tier includes */
  tagline: string;
}

/**
 * ═══════════════════════════════════════════════════════════
 * STONE AI PRICING — Final (March 2026)
 * ═══════════════════════════════════════════════════════════
 *
 * DB Enum  | Display Name | Monthly | Agents | Cloud AI         | Max API Cost/mo | Margin @100%
 * FREE     | Free         | $0      | 4      | 5 lifetime creds | $0.13 once      | N/A
 * STARTER  | Builder      | $19.99  | 16     | 10/day           | ~$5.50          | 73%
 * PLUS     | Growth       | $49.99  | 30     | 15/day           | ~$12            | 76%
 * SMART    | Executive    | $99.99  | 39     | 30/day           | ~$27            | 73%
 * PRO      | Reseller     | $200    | 43     | 50/day           | ~$55            | 73%
 *
 * LOCAL (Stone Engine) = UNLIMITED on all tiers ($0 cost, RTX 5090)
 *
 * PROMOTIONAL PRICES (one-time, signup only, non-renewable):
 * - Launch Trial: STARTER tier at $14.99/mo (same Bestie as Builder)
 * - Growth Early Adopter: PLUS tier at $39.99/mo (7-day free trial, full Bestie)
 *
 * OVERAGE CREDITS (all tiers, when cap is hit):
 * - 10 Cloud AI credits: $1.99 (90% margin)
 * - 25 Cloud AI credits: $3.99 (88% margin)
 * - 50 Cloud AI credits: $6.99 (86% margin)
 * Credits expire at end of billing cycle.
 *
 * FREE tier uses lifetime credits (smartCreditsRemaining on User model).
 * Paid tiers use daily caps (smartMessagesPerDay).
 *
 * Enterprise: $500+/mo — custom engagement, not self-service.
 */
export const FREE_SMART_CREDITS = 5; // One-time lifetime credits for free users

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  FREE: {
    name: "Free",
    price: 0,
    stripePriceEnvKey: null,
    localModel: "meta-llama/Llama-3.1-70B-Instruct",
    agentCount: 4,
    tagline: "Explore AI with essential tools",
    limits: {
      messagesPerDay: 100,
      tokensPerMonth: 200_000,
      maxResponseTokens: 1_200,
      concurrentRequests: 1,
      requestsPerMinute: 3,
      smartMessagesPerDay: 0,              // FREE uses lifetime credits, not daily cap
      smartMaxResponseTokens: 800,
      smartContextMessages: 5,
      smartTokensPerMonth: 50_000,
    },
    perks: {
      contextMessages: 15,
      autoRouting: false,
      conversationExport: false,
      priorityQueue: false,
      apiAccess: false,
      commercialLicense: false,
      earlyAccess: false,
      agentBuilder: false,
      referralMultiplier: 1,
      maxBesties: 1,
      maxDocuments: 0,
      webSearchesPerDay: 0,
      codeExecutionsPerDay: 0,
      fileUploadAnalysis: false,

      voiceInteraction: false,
      pluginIntegrations: 0,
      teamWorkspace: false,
      customModelFineTuning: false,
      soc2Compliance: false,
      hipaaCompliance: false,
      mobileApp: true,
    },
    allowedModes: ["LOCAL", "SMART"],    // SMART allowed for 5 lifetime trial credits
    priority: 0,
    cloudFallback: false,
  },
  STARTER: {
    name: "Builder",
    price: 19.99,
    stripePriceEnvKey: "STRIPE_PRICE_STARTER",
    localModel: "meta-llama/Llama-3.1-70B-Instruct",
    agentCount: 16,
    tagline: "Plan and start your business",
    limits: {
      messagesPerDay: 250,
      tokensPerMonth: 6_000_000,
      maxResponseTokens: 2_500,
      concurrentRequests: 2,
      requestsPerMinute: 10,
      smartMessagesPerDay: 10,             // 10/day × 30 × ~$0.018 = ~$5.40/mo max → 73% margin
      smartMaxResponseTokens: 1_500,
      smartContextMessages: 10,
      smartTokensPerMonth: 500_000,
    },
    perks: {
      contextMessages: 25,
      autoRouting: false,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: false,
      commercialLicense: false,
      earlyAccess: false,
      agentBuilder: false,
      referralMultiplier: 1,
      maxBesties: 1,
      maxDocuments: 10,
      webSearchesPerDay: 10,
      codeExecutionsPerDay: 10,
      fileUploadAnalysis: true,

      voiceInteraction: false,
      pluginIntegrations: 0,
      teamWorkspace: false,
      customModelFineTuning: false,
      soc2Compliance: false,
      hipaaCompliance: false,
      mobileApp: true,
    },
    allowedModes: ["LOCAL", "SMART"],
    priority: 1,
    cloudFallback: true,
  },
  PLUS: {
    name: "Growth",
    price: 49.99,
    stripePriceEnvKey: "STRIPE_PRICE_PLUS",
    localModel: "meta-llama/Llama-3.1-70B-Instruct",
    agentCount: 30,
    tagline: "Plan, start, and maintain your business",
    limits: {
      messagesPerDay: 500,
      tokensPerMonth: 15_000_000,
      maxResponseTokens: 3_500,
      concurrentRequests: 3,
      requestsPerMinute: 15,
      smartMessagesPerDay: 15,             // 15/day × 30 × ~$0.027 = ~$12/mo max → 76% margin
      smartMaxResponseTokens: 2_000,
      smartContextMessages: 15,
      smartTokensPerMonth: 1_200_000,
    },
    perks: {
      contextMessages: 40,
      autoRouting: true,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: false,
      commercialLicense: true,
      earlyAccess: false,
      agentBuilder: false,
      referralMultiplier: 1,
      maxBesties: 1,
      maxDocuments: 30,
      webSearchesPerDay: 25,
      codeExecutionsPerDay: 25,
      fileUploadAnalysis: true,

      voiceInteraction: true,
      pluginIntegrations: 5,
      teamWorkspace: false,
      customModelFineTuning: false,
      soc2Compliance: false,
      hipaaCompliance: false,
      mobileApp: true,
    },
    allowedModes: ["LOCAL", "SMART"],
    priority: 2,
    cloudFallback: true,
  },
  SMART: {
    name: "Executive",
    price: 99.99,
    stripePriceEnvKey: "STRIPE_PRICE_SMART",
    localModel: "meta-llama/Llama-3.1-70B-Instruct",
    agentCount: 39,
    tagline: "Plan, start, maintain, and run your business",
    limits: {
      messagesPerDay: 1_000,
      tokensPerMonth: 40_000_000,
      maxResponseTokens: 6_000,
      concurrentRequests: 4,
      requestsPerMinute: 25,
      smartMessagesPerDay: 30,             // 30/day × 30 × ~$0.030 = ~$27/mo max → 73% margin
      smartMaxResponseTokens: 2_500,
      smartContextMessages: 20,
      smartTokensPerMonth: 2_500_000,
    },
    perks: {
      contextMessages: 60,
      autoRouting: true,
      conversationExport: true,
      priorityQueue: true,
      apiAccess: false,
      commercialLicense: true,
      earlyAccess: true,
      agentBuilder: true,
      referralMultiplier: 1.5,
      maxBesties: 1,
      maxDocuments: 100,
      webSearchesPerDay: 60,
      codeExecutionsPerDay: 60,
      fileUploadAnalysis: true,

      voiceInteraction: true,
      pluginIntegrations: 10,
      teamWorkspace: true,
      customModelFineTuning: false,
      soc2Compliance: true,
      hipaaCompliance: false,
      mobileApp: true,
    },
    allowedModes: ["LOCAL", "SMART"],
    priority: 3,
    cloudFallback: true,
  },
  PRO: {
    name: "Reseller",
    price: 200,
    stripePriceEnvKey: "STRIPE_PRICE_PRO",
    localModel: "meta-llama/Llama-3.1-70B-Instruct",
    agentCount: 43,
    tagline: "Full platform access with reseller capabilities",
    limits: {
      messagesPerDay: 3_000,
      tokensPerMonth: 100_000_000,
      maxResponseTokens: 8_000,
      concurrentRequests: 6,
      requestsPerMinute: 30,
      smartMessagesPerDay: 50,             // 50/day × 30 × ~$0.037 = ~$55/mo max → 73% margin
      smartMaxResponseTokens: 3_000,
      smartContextMessages: 25,
      smartTokensPerMonth: 4_000_000,
    },
    perks: {
      contextMessages: 80,
      autoRouting: true,
      conversationExport: true,
      priorityQueue: true,
      apiAccess: true,
      commercialLicense: true,
      earlyAccess: true,
      agentBuilder: true,
      referralMultiplier: 2,
      maxBesties: 1,
      maxDocuments: 500,
      webSearchesPerDay: 150,
      codeExecutionsPerDay: 150,
      fileUploadAnalysis: true,

      voiceInteraction: true,
      pluginIntegrations: 50,
      teamWorkspace: true,
      customModelFineTuning: true,
      soc2Compliance: true,
      hipaaCompliance: true,
      mobileApp: true,
    },
    allowedModes: ["LOCAL", "SMART", "PRIORITY"],
    priority: 4,
    cloudFallback: true,
  },
} as const;

// Ordered tier list for progression logic
const TIER_ORDER: Tier[] = ["FREE", "STARTER", "PLUS", "SMART", "PRO"];

export function getTierConfig(tier: Tier): TierConfig {
  return TIER_CONFIG[tier];
}

export function getNextTier(tier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === -1 || idx === TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

export function isModeAllowed(tier: Tier, mode: RequestMode): boolean {
  return TIER_CONFIG[tier].allowedModes.includes(mode);
}

export function getRequiredTierForMode(mode: RequestMode): Tier {
  for (const tier of TIER_ORDER) {
    if (TIER_CONFIG[tier].allowedModes.includes(mode)) return tier;
  }
  return "PRO"; // fallback
}

export function getMaxBesties(tier: Tier): number {
  return TIER_CONFIG[tier].perks.maxBesties;
}

export function getLocalModel(tier: Tier): string {
  return TIER_CONFIG[tier].localModel;
}

export type BillingPeriod = "monthly" | "semiannual" | "annual";

/**
 * Standard billing discounts for FREE through SMART tiers.
 * NOTE: PRO (Reseller) and Enterprise use REDUCED discounts:
 *   - PRO (Reseller): Annual only, 15% off ($200 → $170/mo)
 *   - Enterprise: Annual only, 5% off (custom engagement)
 * These special cases are defined in pricing-section.tsx (price6month / priceAnnual fields).
 *
 * SMART (Executive): Annual only, 20% off ($99.99 → $79.99/mo).
 */
export const BILLING_PERIODS: { key: BillingPeriod; label: string; discount: number; months: number }[] = [
  { key: "monthly", label: "Monthly", discount: 0, months: 1 },
  { key: "semiannual", label: "6 Months", discount: 10, months: 6 },
  { key: "annual", label: "Annual", discount: 20, months: 12 },
];

/**
 * Promotional prices — one-time signup deals only.
 * These Stripe prices map to existing tiers at discounted rates.
 * Once a user cancels, they cannot re-subscribe at the promo price.
 */
export const PROMO_PRICES = {
  /** Launch Trial: Builder tier at $14.99/mo — CC required, one-time, non-renewable */
  TRIAL: {
    tier: "STARTER" as Tier,
    price: 14.99,
    stripePriceEnvKey: "STRIPE_PRICE_TRIAL",
    label: "Launch Trial",
    description: "Builder plan at an exclusive signup price. If you cancel, this deal is gone forever.",
    signupOnly: true,
  },
  /** Growth Early Adopter: Growth tier at $39.99/mo + 7-day free trial — one-time, non-renewable */
  GROWTH_SIGNUP: {
    tier: "PLUS" as Tier,
    price: 39.99,
    stripePriceEnvKey: "STRIPE_PRICE_GROWTH_SIGNUP",
    label: "Growth — Early Adopter",
    description: "Growth plan with 7-day free trial at an exclusive signup price. If you cancel, this deal is gone forever.",
    signupOnly: true,
  },
} as const;

export type PromoKey = keyof typeof PROMO_PRICES;

export function getStripePriceId(tier: Tier, period: BillingPeriod = "monthly"): string | null {
  if (period === "monthly") {
    const envKey = TIER_CONFIG[tier].stripePriceEnvKey;
    if (!envKey) return null;
    return process.env[envKey] || null;
  }
  const suffix = period === "semiannual" ? "_6MO" : "_ANNUAL";
  const envKey = `STRIPE_PRICE_${tier}${suffix}`;
  return process.env[envKey] || null;
}

export function getPromoPriceId(promoKey: PromoKey): string | null {
  const promo = PROMO_PRICES[promoKey];
  return process.env[promo.stripePriceEnvKey] || null;
}

export function getPriceForPeriod(monthlyPrice: number, period: BillingPeriod): number {
  const info = BILLING_PERIODS.find((p) => p.key === period)!;
  return Math.round(monthlyPrice * info.months * (1 - info.discount / 100) * 100) / 100;
}

export function getMonthlyEquivalent(monthlyPrice: number, period: BillingPeriod): number {
  const info = BILLING_PERIODS.find((p) => p.key === period)!;
  return Math.round(monthlyPrice * (1 - info.discount / 100) * 100) / 100;
}

// Map a Stripe price ID back to a tier (checks monthly, 6-month, annual, and promo prices)
export function mapPriceToTier(priceId: string): Tier | null {
  // Check standard tier prices
  for (const tier of TIER_ORDER) {
    const baseKey = TIER_CONFIG[tier].stripePriceEnvKey;
    if (!baseKey) continue;
    if (process.env[baseKey] === priceId) return tier;
    const sixMoKey = `STRIPE_PRICE_${tier}_6MO`;
    if (process.env[sixMoKey] === priceId) return tier;
    const annualKey = `STRIPE_PRICE_${tier}_ANNUAL`;
    if (process.env[annualKey] === priceId) return tier;
  }
  // Check promotional prices
  for (const [, promo] of Object.entries(PROMO_PRICES)) {
    if (process.env[promo.stripePriceEnvKey] === priceId) return promo.tier;
  }
  return null;
}

/**
 * Agent tier requirements — maps agent requiredTier to the
 * minimum tier needed to access it.
 *
 * FREE agents: available to all tiers
 * PLUS agents: available to STARTER (Builder) and above
 * SMART agents: available to PLUS (Growth) and above
 * PRO agents: available to PRO (Reseller) and above only
 *
 * Result: FREE=4, STARTER=16, PLUS=30, SMART=39, PRO=43 agents
 */
export function canAccessAgent(userTier: Tier, agentRequiredTier: Tier): boolean {
  const userPriority = TIER_CONFIG[userTier].priority;
  const requiredPriority = TIER_CONFIG[agentRequiredTier].priority;
  // Special mapping: PLUS-required agents are available from STARTER (Builder)
  // This allows the 14 "plan & start" agents to be available at Builder tier
  if (agentRequiredTier === "PLUS") return userPriority >= 1; // STARTER+
  if (agentRequiredTier === "SMART") return userPriority >= 2; // PLUS+
  if (agentRequiredTier === "PRO") return userPriority >= 4;   // PRO+ only (not SMART)
  return true; // FREE agents available to everyone
}

// Display config for frontend
export const TIER_DISPLAY = [
  { key: "FREE" as Tier, name: "Free", price: 0, badge: "zinc", popular: false },
  { key: "STARTER" as Tier, name: "Builder", price: 19.99, badge: "blue", popular: false },
  { key: "PLUS" as Tier, name: "Growth", price: 49.99, badge: "indigo", popular: true },
  { key: "SMART" as Tier, name: "Executive", price: 99.99, badge: "purple", popular: false },
  { key: "PRO" as Tier, name: "Reseller", price: 200, badge: "amber", popular: false },
] as const;
