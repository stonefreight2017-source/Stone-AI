import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { checkQuota, checkSmartQuota } from "@/lib/quota";
import { db } from "@/lib/db";
import { getTierConfig } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";

// GET /api/user/usage — get current usage stats for billing page
export async function GET() {
  try {
    const user = await getOrCreateUser();
    const tier = user.tier as Tier;
    const config = getTierConfig(tier);
    const quota = await checkQuota(user.id, tier);
    const smartQuota = await checkSmartQuota(user.id, tier);

    // Get this month's usage record for detailed stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const usageRecord = await db.usageRecord.findFirst({
      where: {
        userId: user.id,
        billingCycleStart: { gte: monthStart },
      },
    });

    // Count conversations and agent sessions
    const [conversationCount, agentSessionCount] = await Promise.all([
      db.conversation.count({ where: { userId: user.id } }),
      db.conversation.count({ where: { userId: user.id, agentId: { not: null } } }),
    ]);

    return NextResponse.json({
      tier,
      tierName: config.name,
      usage: {
        messagesToday: quota.messagesSentToday,
        messagesLimit: quota.messagesPerDay,
        tokensThisMonth: quota.tokensUsedThisMonth,
        tokensLimit: quota.tokensPerMonth,
        localRequests: usageRecord?.localRequests ?? 0,
        smartRequests: usageRecord?.smartRequests ?? 0,
        totalMessages: usageRecord?.messagesSent ?? 0,
        smartToday: smartQuota.smartMessagesSentToday,
        smartDailyLimit: smartQuota.smartMessagesPerDay,
        smartCostMultiplier: smartQuota.costMultiplier,
      },
      stats: {
        conversations: conversationCount,
        agentSessions: agentSessionCount,
      },
      limits: config.limits,
      perks: config.perks,
      subscriptionStatus: user.subscriptionStatus,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/user/usage:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
