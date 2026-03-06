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
  imageGeneration: boolean;      // AI image generation (DALL-E / Stable Diffusion)
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
 * STONE AI PRICING — Option A (March 2026)
 * ═══════════════════════════════════════════════════════════
 *
 * DB Enum  | Display Name | Monthly | Agents | Smart/day
 * FREE     | Free         | $0      | 5      | 0
 * STARTER  | Builder      | $19.99  | 14     | 10
 * PLUS     | Growth       | $49.99  | 26     | 30
 * SMART    | Executive    | $99.99  | 38     | 80
 * PRO      | Reseller     | $200    | 38     | 150
 *
 * PROMOTIONAL PRICES (one-time, signup only):
 * - Trial: STARTER tier at $14.99/mo (CC required, signup only)
 * - Growth Signup Special: PLUS tier at $39.99/mo (signup only)
 * These are separate Stripe prices mapped to the same tiers.
 *
 * Enterprise: $500+/mo — custom engagement, not self-service.
 */
export const TIER_CONFIG: Record<Tier, TierConfig> = {
  FREE: {
    name: "Free",
    price: 0,
    stripePriceEnvKey: null,
    localModel: "meta-llama/Llama-3.1-8B-Instruct",
    agentCount: 4,
    tagline: "Explore AI with essential tools",
    limits: {
      messagesPerDay: 30,
      tokensPerMonth: 100_000,
      maxResponseTokens: 500,
      concurrentRequests: 1,
      requestsPerMinute: 2,
      smartMessagesPerDay: 0,
      smartMaxResponseTokens: 0,
      smartContextMessages: 0,
      smartTokensPerMonth: 0,
    },
    perks: {
      contextMessages: 10,
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
      imageGeneration: false,
      voiceInteraction: false,
      pluginIntegrations: 0,
      teamWorkspace: false,
      customModelFineTuning: false,
      soc2Compliance: false,
      hipaaCompliance: false,
      mobileApp: false,
    },
    allowedModes: ["LOCAL"],
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
      messagesPerDay: 200,
      tokensPerMonth: 5_000_000,
      maxResponseTokens: 2_000,
      concurrentRequests: 2,
      requestsPerMinute: 10,
      smartMessagesPerDay: 10,
      smartMaxResponseTokens: 1_500,     // ~$6/mo max Smart cost → $14 margin
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
      maxDocuments: 5,
      webSearchesPerDay: 10,
      codeExecutionsPerDay: 0,
      fileUploadAnalysis: true,
      imageGeneration: false,
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
      maxResponseTokens: 4_000,
      concurrentRequests: 3,
      requestsPerMinute: 20,
      smartMessagesPerDay: 20,             // Reduced from 30 → ~$19/mo max Smart cost → $31 margin
      smartMaxResponseTokens: 2_500,
      smartContextMessages: 20,
      smartTokensPerMonth: 2_000_000,
    },
    perks: {
      contextMessages: 50,
      autoRouting: true,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: false,
      commercialLicense: false,
      earlyAccess: false,
      agentBuilder: false,
      referralMultiplier: 1,
      maxBesties: 3,
      maxDocuments: 25,
      webSearchesPerDay: 50,
      codeExecutionsPerDay: 50,
      fileUploadAnalysis: true,
      imageGeneration: true,
      voiceInteraction: true,
      pluginIntegrations: 3,
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
    agentCount: 42,
    tagline: "Plan, start, maintain, and run your business",
    limits: {
      messagesPerDay: 1_500,
      tokensPerMonth: 50_000_000,
      maxResponseTokens: 8_000,
      concurrentRequests: 5,
      requestsPerMinute: 40,
      smartMessagesPerDay: 40,             // Reduced from 80 → ~$45/mo max Smart cost → $55 margin
      smartMaxResponseTokens: 3_000,
      smartContextMessages: 25,
      smartTokensPerMonth: 5_000_000,
    },
    perks: {
      contextMessages: 80,
      autoRouting: true,
      conversationExport: true,
      priorityQueue: true,
      apiAccess: false,
      commercialLicense: false,
      earlyAccess: true,
      agentBuilder: true,
      referralMultiplier: 1,
      maxBesties: 5,
      maxDocuments: 100,
      webSearchesPerDay: 200,
      codeExecutionsPerDay: 200,
      fileUploadAnalysis: true,
      imageGeneration: true,
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
    agentCount: 42,
    tagline: "Full platform access with reseller capabilities",
    limits: {
      messagesPerDay: 99_999,
      tokensPerMonth: 999_999_999,
      maxResponseTokens: 32_000,
      concurrentRequests: 10,
      requestsPerMinute: 60,
      smartMessagesPerDay: 60,             // Reduced from 150 → ~$92/mo max Smart cost → $108 margin
      smartMaxResponseTokens: 4_000,
      smartContextMessages: 40,
      smartTokensPerMonth: 10_000_000,
    },
    perks: {
      contextMessages: 100,
      autoRouting: true,
      conversationExport: true,
      priorityQueue: true,
      apiAccess: true,
      commercialLicense: true,
      earlyAccess: true,
      agentBuilder: true,
      referralMultiplier: 2,
      maxBesties: 10,
      maxDocuments: 500,
      webSearchesPerDay: 999,
      codeExecutionsPerDay: 999,
      fileUploadAnalysis: true,
      imageGeneration: true,
      voiceInteraction: true,
      pluginIntegrations: 999,
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
  /** Trial: Builder tier at $14.99/mo — CC required at signup */
  TRIAL: {
    tier: "STARTER" as Tier,
    price: 14.99,
    stripePriceEnvKey: "STRIPE_PRICE_TRIAL",
    label: "Launch Trial",
    description: "Builder plan at an exclusive signup price. Credit card required.",
    signupOnly: true,
  },
  /** Growth Signup Special: Growth tier at $39.99/mo — only during initial signup */
  GROWTH_SIGNUP: {
    tier: "PLUS" as Tier,
    price: 39.99,
    stripePriceEnvKey: "STRIPE_PRICE_GROWTH_SIGNUP",
    label: "Growth — Early Adopter",
    description: "Growth plan at an exclusive signup price. One-time offer.",
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
 * PRO agents: available to SMART (Executive) and above
 */
export function canAccessAgent(userTier: Tier, agentRequiredTier: Tier): boolean {
  const userPriority = TIER_CONFIG[userTier].priority;
  const requiredPriority = TIER_CONFIG[agentRequiredTier].priority;
  // Special mapping: PLUS-required agents are available from STARTER (Builder)
  // This allows the 14 "plan & start" agents to be available at Builder tier
  if (agentRequiredTier === "PLUS") return userPriority >= 1; // STARTER+
  if (agentRequiredTier === "SMART") return userPriority >= 2; // PLUS+
  if (agentRequiredTier === "PRO") return userPriority >= 3;   // SMART+
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
