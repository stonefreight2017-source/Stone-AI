import { db } from "./db";
import { getTierConfig, SMART_COST_MULTIPLIER } from "./tier-config";
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

  return {
    allowed: smartSentToday < smartLimit,
    smartMessagesSentToday: smartSentToday,
    smartMessagesPerDay: smartLimit,
    costMultiplier: SMART_COST_MULTIPLIER,
  };
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
