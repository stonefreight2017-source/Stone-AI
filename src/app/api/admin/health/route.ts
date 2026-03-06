import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  SCALING_THRESHOLDS,
  SECURITY_CHECKS,
  PERFORMANCE_REMINDERS,
} from "@/lib/scaling-thresholds";

/**
 * GET /api/admin/health — Comprehensive system health, scaling alerts,
 * security audit, and performance reminders.
 *
 * ═══════════════════════════════════════════════════════════════
 * SCALING REMINDER: This endpoint is your early warning system.
 * Check it weekly. When you see "critical" alerts, act immediately.
 * ═══════════════════════════════════════════════════════════════
 */
export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yesterday = new Date(todayStart.getTime() - 86_400_000);
    const lastHour = new Date(now.getTime() - 3_600_000);
    const last24h = new Date(now.getTime() - 86_400_000);

    // ═══ GATHER METRICS ═══
    const [
      totalUsers,
      activeUsersToday,
      activeUsersYesterday,
      totalMessages,
      messagesToday,
      messagesYesterday,
      totalBesties,
      totalConversations,
      totalAgentMemories,
      usageThisMonth,
      tierBreakdown,
      recentErrors,
      injectionAttempts,
      bannedAccessAttempts,
      rateLimitHits,
      concurrentBlocks,
    ] = await Promise.all([
      // User counts
      db.user.count(),
      db.dailyUsage.count({ where: { date: todayStart } }),
      db.dailyUsage.count({ where: { date: yesterday } }),

      // Message counts
      db.message.count(),
      db.dailyUsage.aggregate({
        _sum: { messagesSent: true },
        where: { date: todayStart },
      }),
      db.dailyUsage.aggregate({
        _sum: { messagesSent: true },
        where: { date: yesterday },
      }),

      // Bestie metrics
      db.bestieProfile.count({ where: { isActive: true } }),
      db.conversation.count({ where: { archived: false } }),
      db.agentMemory.count(),

      // Monthly token usage
      db.usageRecord.aggregate({
        _sum: { tokensIn: true, tokensOut: true, messagesSent: true, localRequests: true, smartRequests: true },
        where: { billingCycleStart: { gte: monthStart } },
      }),

      // Tier distribution
      db.user.groupBy({
        by: ["tier"],
        _count: { tier: true },
      }),

      // Recent errors (from audit log) - wrapped in try/catch since table may not exist
      safeAuditCountSince("error", last24h, true),

      // Security: injection attempts
      safeAuditCountSince("injection.detected", last24h),

      // Security: banned access
      safeAuditCountSince("auth.banned_access", last24h),

      // Security: rate limit hits
      safeAuditCountSince("rate_limit.hit", last24h),

      // Security: concurrency blocks
      safeAuditCountSince("concurrent.blocked", last24h),
    ]);

    // ═══ BUILD METRICS MAP ═══
    const dailyMessagesTotal = messagesToday._sum.messagesSent ?? 0;
    const monthlyTokens = (usageThisMonth._sum.tokensIn ?? 0) + (usageThisMonth._sum.tokensOut ?? 0);
    // Rough cost estimate: $0.01 per 1K tokens for SMART, ~$0.002 for LOCAL
    const smartRequests = usageThisMonth._sum.smartRequests ?? 0;
    const localRequests = usageThisMonth._sum.localRequests ?? 0;
    const estimatedSmartCost = (smartRequests * 1500 * 0.01) / 1000; // avg 1500 tokens * $0.01/1K
    const estimatedLocalCost = (localRequests * 1500 * 0.002) / 1000;
    const estimatedMonthlyCost = estimatedSmartCost + estimatedLocalCost;

    const metrics: Record<string, number> = {
      daily_active_users: activeUsersToday,
      daily_messages_total: dailyMessagesTotal,
      bestie_profiles_total: totalBesties,
      monthly_token_spend_usd: Math.round(estimatedMonthlyCost),
      db_connections: 0, // Can't easily query this from Prisma, placeholder
      error_rate_percent: 0, // Would need request count baseline
    };

    // ═══ EVALUATE SCALING THRESHOLDS ═══
    const scalingAlerts: Array<{
      metric: string;
      value: number;
      level: "ok" | "warning" | "critical";
      threshold: number;
      action: string;
    }> = [];

    for (const threshold of SCALING_THRESHOLDS) {
      const value = metrics[threshold.metric];
      if (value === undefined) continue;

      let level: "ok" | "warning" | "critical" = "ok";
      let triggerThreshold = 0;

      if (value >= threshold.criticalAt) {
        level = "critical";
        triggerThreshold = threshold.criticalAt;
      } else if (value >= threshold.warningAt) {
        level = "warning";
        triggerThreshold = threshold.warningAt;
      }

      scalingAlerts.push({
        metric: threshold.metric,
        value,
        level,
        threshold: triggerThreshold || threshold.warningAt,
        action: level !== "ok" ? threshold.action : "",
      });
    }

    // ═══ EVALUATE SECURITY CHECKS ═══
    const securityReport = [
      {
        ...SECURITY_CHECKS.find((c) => c.id === "injection_attempts")!,
        value: injectionAttempts,
        status: injectionAttempts > 10 ? "alert" : injectionAttempts > 0 ? "monitor" : "clear",
      },
      {
        ...SECURITY_CHECKS.find((c) => c.id === "banned_access_attempts")!,
        value: bannedAccessAttempts,
        status: bannedAccessAttempts > 5 ? "alert" : bannedAccessAttempts > 0 ? "monitor" : "clear",
      },
      {
        ...SECURITY_CHECKS.find((c) => c.id === "rate_limit_hits")!,
        value: rateLimitHits,
        status: rateLimitHits > 100 ? "alert" : rateLimitHits > 20 ? "monitor" : "clear",
      },
      {
        ...SECURITY_CHECKS.find((c) => c.id === "concurrent_blocks")!,
        value: concurrentBlocks,
        status: concurrentBlocks > 50 ? "alert" : concurrentBlocks > 10 ? "monitor" : "clear",
      },
    ];

    // ═══ EVALUATE PERFORMANCE REMINDERS ═══
    const performanceFlags = PERFORMANCE_REMINDERS
      .filter((r) => r.check())
      .map((r) => ({
        condition: r.condition,
        message: r.message,
        severity: r.severity,
      }));

    // ═══ COMPUTE OVERALL STATUS ═══
    const hasCritical = scalingAlerts.some((a) => a.level === "critical") ||
                        securityReport.some((s) => s.status === "alert") ||
                        performanceFlags.some((f) => f.severity === "critical");
    const hasWarning = scalingAlerts.some((a) => a.level === "warning") ||
                       securityReport.some((s) => s.status === "monitor") ||
                       performanceFlags.some((f) => f.severity === "warning");

    const overallStatus = hasCritical ? "critical" : hasWarning ? "warning" : "healthy";

    return NextResponse.json({
      status: overallStatus,
      checkedAt: now.toISOString(),

      // ─── System Metrics ───
      system: {
        totalUsers,
        activeUsersToday,
        activeUsersYesterday,
        userGrowth: activeUsersYesterday > 0
          ? `${Math.round(((activeUsersToday - activeUsersYesterday) / activeUsersYesterday) * 100)}%`
          : "N/A",
        tierBreakdown: Object.fromEntries(
          tierBreakdown.map((t) => [t.tier, t._count.tier])
        ),
      },

      // ─── Usage Metrics ───
      usage: {
        totalMessages,
        messagesToday: dailyMessagesTotal,
        messagesYesterday: messagesYesterday._sum.messagesSent ?? 0,
        monthlyTokens,
        monthlyLocalRequests: localRequests,
        monthlySmartRequests: smartRequests,
        estimatedMonthlyCostUSD: Math.round(estimatedMonthlyCost),
      },

      // ─── Bestie Metrics ───
      bestie: {
        totalProfiles: totalBesties,
        totalConversations,
        totalMemoryEntries: totalAgentMemories,
      },

      // ─── Scaling Alerts ───
      scaling: {
        alerts: scalingAlerts.filter((a) => a.level !== "ok"),
        allMetrics: scalingAlerts,
      },

      // ─── Security Report ───
      security: {
        overall: securityReport.some((s) => s.status === "alert") ? "alert" : "clear",
        checks: securityReport,
        recentErrors,
      },

      // ─── Performance Flags ───
      performance: {
        flags: performanceFlags,
        infraStatus: {
          vllmConnected: !!(process.env.VLLM_BASE_URL),
          isLocalVllm: (process.env.VLLM_BASE_URL ?? "").includes("localhost") || !(process.env.VLLM_BASE_URL),
          redisConnected: !!(process.env.REDIS_HOST),
          isLocalRedis: (process.env.REDIS_HOST ?? "127.0.0.1") === "127.0.0.1" || (process.env.REDIS_HOST ?? "localhost") === "localhost",
          clerkMode: (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").startsWith("pk_test_") ? "development" : "production",
          stripeMode: (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_") ? "test" : "live",
          databasePooling: (process.env.DATABASE_URL ?? "").includes("pooler") ? "enabled" : "direct",
        },
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "Forbidden")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/health:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Safely query the AuditLog table (may not exist yet).
 */
async function safeAuditCountSince(event: string, since: Date, useLike = false): Promise<number> {
  try {
    const result = useLike
      ? await db.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM "AuditLog"
          WHERE event LIKE ${`%${event}%`} AND "createdAt" > ${since}`
      : await db.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM "AuditLog"
          WHERE event = ${event} AND "createdAt" > ${since}`;
    return Number(result[0]?.count ?? 0);
  } catch {
    return 0;
  }
}
