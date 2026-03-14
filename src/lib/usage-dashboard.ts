/**
 * Usage Dashboard
 *
 * Aggregates all usage data for an authenticated user into a single
 * dashboard response. Pulls from DailyUsage, UsageRecord, and tier config.
 */

import { db } from "./db";
import { getTierConfig } from "./tier-config";
import type { Tier } from "./tier-config";

export interface UsageDashboard {
  /** Messages sent today (LOCAL mode count toward daily quota) */
  messagesUsed: number;
  /** Daily message limit for the user's tier */
  messagesLimit: number;
  /** Total tokens used this billing cycle (input + output) */
  tokensUsed: number;
  /** Monthly token limit for the user's tier */
  tokensLimit: number;
  /** User's current tier */
  tier: Tier;
  /** Days remaining in current billing cycle */
  daysRemaining: number;
  /** SMART (cloud) messages sent today */
  smartMessagesUsed: number;
  /** SMART messages per day limit */
  smartMessagesLimit: number;
  /** Web searches used today (0 if feature not yet enabled) */
  webSearches: number;
  /** Web searches per day limit */
  webSearchesLimit: number;
  /** Image generations used (reserved for future use) */
  imageGenerations: number;
  /** Code executions used today (0 if feature not yet enabled) */
  codeExecutions: number;
  /** Code executions per day limit */
  codeExecutionsLimit: number;
  /** Voice minutes used (reserved for future use) */
  voiceMinutes: number;
  /** Whether voice interaction is enabled for this tier */
  voiceEnabled: boolean;
  /** LOCAL requests this billing cycle */
  localRequests: number;
  /** SMART requests this billing cycle */
  smartRequests: number;
}

/**
 * Build the full usage dashboard for a user.
 */
export async function getUserUsage(userId: string, tier: Tier): Promise<UsageDashboard> {
  const config = getTierConfig(tier);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Fetch daily usage and monthly usage record in parallel
  const [dailyUsage, usageRecord] = await Promise.all([
    db.dailyUsage.findUnique({
      where: { userId_date: { userId, date: todayStart } },
    }),
    db.usageRecord.findFirst({
      where: {
        userId,
        billingCycleStart: { gte: monthStart },
        billingCycleEnd: { lte: monthEnd },
      },
    }),
  ]);

  const messagesUsed = dailyUsage?.messagesSent ?? 0;
  const smartMessagesUsed = dailyUsage?.smartMessagesSent ?? 0;
  const tokensIn = usageRecord?.tokensIn ?? 0;
  const tokensOut = usageRecord?.tokensOut ?? 0;
  const tokensUsed = tokensIn + tokensOut;
  const localRequests = usageRecord?.localRequests ?? 0;
  const smartRequests = usageRecord?.smartRequests ?? 0;

  // Calculate days remaining in billing cycle
  const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
  const dayOfMonth = now.getDate();
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);

  return {
    messagesUsed,
    messagesLimit: config.limits.messagesPerDay,
    tokensUsed,
    tokensLimit: config.limits.tokensPerMonth,
    tier,
    daysRemaining,
    smartMessagesUsed,
    smartMessagesLimit: config.limits.smartMessagesPerDay,
    webSearches: 0, // Not yet tracked — feature coming soon
    webSearchesLimit: config.perks.webSearchesPerDay,
    imageGenerations: 0, // Reserved for future use
    codeExecutions: 0, // Not yet tracked — feature coming soon
    codeExecutionsLimit: config.perks.codeExecutionsPerDay,
    voiceMinutes: 0, // Reserved for future use
    voiceEnabled: config.perks.voiceInteraction,
    localRequests,
    smartRequests,
  };
}
