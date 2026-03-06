import { db } from "./db";
import { getTierConfig, SMART_COST_MULTIPLIER, FREE_SMART_CREDITS } from "./tier-config";
import type { Tier } from "./tier-config";

interface QuotaCheck {
  allowed: boolean;
  messagesSentToday: number;
  tokensUsedThisMonth: number;
  messagesPerDay: number;
  tokensPerMonth: number;
}

interface SmartQuotaCheck {
  allowed: boolean;
  smartMessagesSentToday: number;
  smartMessagesPerDay: number;
  costMultiplier: number;
  /** For FREE tier: remaining lifetime credits */
  lifetimeCreditsRemaining?: number;
}

/**
 * Check if a user has remaining quota for their tier.
 * Checks both daily message count and monthly token usage.
 */
export async function checkQuota(
  userId: string,
  tier: Tier
): Promise<QuotaCheck> {
  const config = getTierConfig(tier);
  const now = new Date();

  // Get today's usage
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dailyUsage = await db.dailyUsage.findUnique({
    where: {
      userId_date: {
        userId,
        date: todayStart,
      },
    },
  });

  const messagesSentToday = dailyUsage?.messagesSent ?? 0;

  // Get current billing cycle usage (monthly)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const usageRecord = await db.usageRecord.findFirst({
    where: {
      userId,
      billingCycleStart: { gte: monthStart },
      billingCycleEnd: { lte: monthEnd },
    },
  });

  const tokensUsedThisMonth =
    (usageRecord?.tokensIn ?? 0) + (usageRecord?.tokensOut ?? 0);

  const allowed =
    messagesSentToday < config.limits.messagesPerDay &&
    tokensUsedThisMonth < config.limits.tokensPerMonth;

  return {
    allowed,
    messagesSentToday,
    tokensUsedThisMonth,
    messagesPerDay: config.limits.messagesPerDay,
    tokensPerMonth: config.limits.tokensPerMonth,
  };
}

/**
 * Increment daily message count. Creates the record if it doesn't exist.
 */
export async function incrementDailyUsage(userId: string): Promise<void> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await db.dailyUsage.upsert({
    where: {
      userId_date: {
        userId,
        date: todayStart,
      },
    },
    update: {
      messagesSent: { increment: 1 },
    },
    create: {
      userId,
      date: todayStart,
      messagesSent: 1,
    },
  });
}

/**
 * Record token usage for billing cycle tracking.
 */
/**
 * Check if a user has remaining SMART (cloud) quota for the day.
 * SMART mode has a separate hard cap to protect company margins.
 */
export async function checkSmartQuota(
  userId: string,
  tier: Tier
): Promise<SmartQuotaCheck> {
  const config = getTierConfig(tier);
  const smartLimit = config.limits.smartMessagesPerDay;

  // FREE tier: uses one-time lifetime credits instead of daily cap
  if (tier === "FREE") {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { smartCreditsRemaining: true },
    });
    const remaining = user?.smartCreditsRemaining ?? 0;
    return {
      allowed: remaining > 0,
      smartMessagesSentToday: FREE_SMART_CREDITS - remaining,
      smartMessagesPerDay: 0,
      costMultiplier: SMART_COST_MULTIPLIER,
      lifetimeCreditsRemaining: remaining,
    };
  }

  // If tier has no SMART access, deny
  if (smartLimit === 0) {
    return {
      allowed: false,
      smartMessagesSentToday: 0,
      smartMessagesPerDay: 0,
      costMultiplier: SMART_COST_MULTIPLIER,
    };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dailyUsage = await db.dailyUsage.findUnique({
    where: { userId_date: { userId, date: todayStart } },
  });

  const smartSentToday = dailyUsage?.smartMessagesSent ?? 0;

  // Check monthly Smart token budget (prevents runaway API costs)
  const smartTokenCap = config.limits.smartTokensPerMonth;
  let withinTokenBudget = true;
  if (smartTokenCap > 0) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const usageRecord = await db.usageRecord.findFirst({
      where: {
        userId,
        billingCycleStart: { gte: monthStart },
      },
    });
    const smartTokensUsed = (usageRecord?.smartRequests ?? 0) * 3000;
    withinTokenBudget = smartTokensUsed < smartTokenCap;
  }

  return {
    allowed: smartSentToday < smartLimit && withinTokenBudget,
    smartMessagesSentToday: smartSentToday,
    smartMessagesPerDay: smartLimit,
    costMultiplier: SMART_COST_MULTIPLIER,
  };
}

/**
 * Decrement a FREE user's lifetime SMART credits.
 * Returns the new remaining count.
 */
export async function decrementFreeSmartCredits(userId: string): Promise<number> {
  const user = await db.user.update({
    where: { id: userId },
    data: { smartCreditsRemaining: { decrement: 1 } },
    select: { smartCreditsRemaining: true },
  });
  return user.smartCreditsRemaining;
}

/**
 * Increment SMART daily usage. Also increments total messagesSent
 * by SMART_COST_MULTIPLIER (3x) to reflect real cloud costs.
 */
export async function incrementSmartUsage(userId: string): Promise<void> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await db.dailyUsage.upsert({
    where: { userId_date: { userId, date: todayStart } },
    update: {
      messagesSent: { increment: SMART_COST_MULTIPLIER },
      smartMessagesSent: { increment: 1 },
    },
    create: {
      userId,
      date: todayStart,
      messagesSent: SMART_COST_MULTIPLIER,
      smartMessagesSent: 1,
    },
  });
}

export async function recordTokenUsage(
  userId: string,
  tokensIn: number,
  tokensOut: number,
  mode: "LOCAL" | "SMART"
): Promise<void> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await db.usageRecord.upsert({
    where: {
      userId_billingCycleStart: {
        userId,
        billingCycleStart: monthStart,
      },
    },
    update: {
      messagesSent: { increment: 1 },
      tokensIn: { increment: tokensIn },
      tokensOut: { increment: tokensOut },
      ...(mode === "LOCAL"
        ? { localRequests: { increment: 1 } }
        : { smartRequests: { increment: 1 } }),
    },
    create: {
      userId,
      billingCycleStart: monthStart,
      billingCycleEnd: monthEnd,
      messagesSent: 1,
      tokensIn,
      tokensOut,
      ...(mode === "LOCAL"
        ? { localRequests: 1 }
        : { smartRequests: 1 }),
    },
  });
}
