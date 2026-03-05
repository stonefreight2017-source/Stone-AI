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
  maxResponseTokens: number;
  concurrentRequests: number;
  requestsPerMinute: number;
  smartMessagesPerDay: number; // Hard cap on cloud (SMART) messages per day
}

/**
 * SMART mode costs the company real money (OpenAI API).
 * Each SMART message counts as this many messages against daily quota.
 * This protects margins and nudges users toward Local mode.
 */
export const SMART_COST_MULTIPLIER = 3;

export interface TierPerks {
  contextMessages: number;   // How many past messages sent to model as context
  autoRouting: boolean;       // Auto-pick best model per question
  conversationExport: boolean;
  priorityQueue: boolean;
  apiAccess: boolean;         // Can generate API keys
  commercialLicense: boolean; // Clean commercial use rights (no attribution)
  earlyAccess: boolean;       // New agents 30 days early
  agentBuilder: boolean;      // Create custom agents with own prompts + knowledge
  referralMultiplier: number; // Referral credit multiplier (1 = normal, 2 = double)
  maxBesties: number;         // Max AI Bestie companions per user
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
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  FREE: {
    name: "Free",
    price: 0,
    stripePriceEnvKey: null,
    limits: {
      messagesPerDay: 30,
      tokensPerMonth: 100_000,
      maxResponseTokens: 500,
      concurrentRequests: 1,
      requestsPerMinute: 2,
      smartMessagesPerDay: 0, // No SMART access
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
    },
    allowedModes: ["LOCAL"],
    priority: 0,
    cloudFallback: false,
  },
  STARTER: {
    name: "Starter",
    price: 9.99,
    stripePriceEnvKey: "STRIPE_PRICE_STARTER",
    limits: {
      messagesPerDay: 150,
      tokensPerMonth: 2_000_000,
      maxResponseTokens: 2_000,
      concurrentRequests: 1,
      requestsPerMinute: 8,
      smartMessagesPerDay: 0, // No SMART access
    },
    perks: {
      contextMessages: 20,
      autoRouting: false,
      conversationExport: false,
      priorityQueue: false,
      apiAccess: false,
      commercialLicense: false,
      earlyAccess: false,
      agentBuilder: false,
      referralMultiplier: 1,
      maxBesties: 1,
    },
    allowedModes: ["LOCAL"],
    priority: 1,
    cloudFallback: false,
  },
  PLUS: {
    name: "Plus",
    price: 29.99,
    stripePriceEnvKey: "STRIPE_PRICE_PLUS",
    limits: {
      messagesPerDay: 490,
      tokensPerMonth: 9_800_000,
      maxResponseTokens: 3_920,
      concurrentRequests: 2,
      requestsPerMinute: 15,
      smartMessagesPerDay: 0, // No SMART access
    },
    perks: {
      contextMessages: 40,
      autoRouting: false,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: false,
      commercialLicense: false,
      earlyAccess: false,
      agentBuilder: false,
      referralMultiplier: 1,
      maxBesties: 2,
    },
    allowedModes: ["LOCAL"],
    priority: 2,
    cloudFallback: false,
  },
  SMART: {
    name: "Smart",
    price: 69.99,
    stripePriceEnvKey: "STRIPE_PRICE_SMART",
    limits: {
      messagesPerDay: 980,
      tokensPerMonth: 29_400_000,
      maxResponseTokens: 7_840,
      concurrentRequests: 3,
      requestsPerMinute: 29,
      smartMessagesPerDay: 30, // Hard cap: 30 cloud calls/day (costs ~$1.80/day max)
    },
    perks: {
      contextMessages: 60,
      autoRouting: true,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: false,
      commercialLicense: false,
      earlyAccess: false,
      agentBuilder: false,
      referralMultiplier: 1,
      maxBesties: 3,
    },
    allowedModes: ["LOCAL", "SMART"],
    priority: 3,
    cloudFallback: true,
  },
  PRO: {
    name: "Pro",
    price: 199,
    stripePriceEnvKey: "STRIPE_PRICE_PRO",
    limits: {
      messagesPerDay: 99_999,
      tokensPerMonth: 999_999_999,
      maxResponseTokens: 32_060,
      concurrentRequests: 10,
      requestsPerMinute: 60,
      smartMessagesPerDay: 100, // Hard cap: 100 cloud calls/day (costs ~$6/day max)
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
      maxBesties: 5,
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

export type BillingPeriod = "monthly" | "semiannual" | "annual";

export const BILLING_PERIODS: { key: BillingPeriod; label: string; discount: number; months: number }[] = [
  { key: "monthly", label: "Monthly", discount: 0, months: 1 },
  { key: "semiannual", label: "6 Months", discount: 10, months: 6 },
  { key: "annual", label: "Annual", discount: 20, months: 12 },
];

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

export function getPriceForPeriod(monthlyPrice: number, period: BillingPeriod): number {
  const info = BILLING_PERIODS.find((p) => p.key === period)!;
  return Math.round(monthlyPrice * info.months * (1 - info.discount / 100) * 100) / 100;
}

export function getMonthlyEquivalent(monthlyPrice: number, period: BillingPeriod): number {
  const info = BILLING_PERIODS.find((p) => p.key === period)!;
  return Math.round(monthlyPrice * (1 - info.discount / 100) * 100) / 100;
}

// Map a Stripe price ID back to a tier (checks monthly, 6-month, and annual prices)
export function mapPriceToTier(priceId: string): Tier | null {
  for (const tier of TIER_ORDER) {
    const baseKey = TIER_CONFIG[tier].stripePriceEnvKey;
    if (!baseKey) continue;
    // Check monthly price
    if (process.env[baseKey] === priceId) return tier;
    // Check 6-month price (e.g., STRIPE_PRICE_STARTER_6MO)
    const sixMoKey = `STRIPE_PRICE_${tier}_6MO`;
    if (process.env[sixMoKey] === priceId) return tier;
    // Check annual price (e.g., STRIPE_PRICE_STARTER_ANNUAL)
    const annualKey = `STRIPE_PRICE_${tier}_ANNUAL`;
    if (process.env[annualKey] === priceId) return tier;
  }
  return null;
}

// Display config for frontend
export const TIER_DISPLAY = [
  { key: "FREE" as Tier, name: "Free", price: 0, badge: "zinc", popular: false },
  { key: "STARTER" as Tier, name: "Starter", price: 9.99, badge: "blue", popular: false },
  { key: "PLUS" as Tier, name: "Plus", price: 29.99, badge: "indigo", popular: false },
  { key: "SMART" as Tier, name: "Smart", price: 69.99, badge: "purple", popular: false },
  { key: "PRO" as Tier, name: "Pro", price: 199, badge: "amber", popular: true },
] as const;
