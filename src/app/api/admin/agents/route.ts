import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { seedAgents } from "@/lib/agent-seed";
import { db } from "@/lib/db";

/**
 * GET /api/admin/agents — Agent usage analytics.
 * Returns per-agent conversation counts, unique users, and recent activity.
 */
export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const last7d = new Date(now.getTime() - 7 * 86_400_000);
    const last30d = new Date(now.getTime() - 30 * 86_400_000);

    // Per-agent conversation counts (all time)
    const agentStats = await db.conversation.groupBy({
      by: ["agentId"],
      _count: { id: true },
      where: { agentId: { not: null } },
      orderBy: { _count: { id: "desc" } },
    });

    // Per-agent last 7 days
    const recentStats = await db.conversation.groupBy({
      by: ["agentId"],
      _count: { id: true },
      where: { agentId: { not: null }, createdAt: { gte: last7d } },
    });

    // Per-agent last 30 days
    const monthlyStats = await db.conversation.groupBy({
      by: ["agentId"],
      _count: { id: true },
      where: { agentId: { not: null }, createdAt: { gte: last30d } },
    });

    // Per-agent unique users (all time)
    const uniqueUsers = await db.conversation.groupBy({
      by: ["agentId"],
      _count: { userId: true },
      where: { agentId: { not: null } },
    });

    // Get agent details for name resolution
    const agents = await db.agent.findMany({
      select: { id: true, slug: true, name: true, requiredTier: true, category: true },
    });

    const agentMap = new Map(agents.map((a) => [a.id, a]));
    const recentMap = new Map(recentStats.map((r) => [r.agentId, r._count.id]));
    const monthlyMap = new Map(monthlyStats.map((r) => [r.agentId, r._count.id]));
    const userMap = new Map(uniqueUsers.map((r) => [r.agentId, r._count.userId]));

    // Total conversations with agents
    const totalAgentConversations = agentStats.reduce((sum, s) => sum + s._count.id, 0);

    // Build per-agent results
    const agentUsage = agentStats.map((stat) => {
      const agent = agentMap.get(stat.agentId!);
      return {
        agentId: stat.agentId,
        slug: agent?.slug ?? "unknown",
        name: agent?.name ?? "Unknown Agent",
        tier: agent?.requiredTier ?? "UNKNOWN",
        category: agent?.category ?? "UNKNOWN",
        totalConversations: stat._count.id,
        last7dConversations: recentMap.get(stat.agentId!) ?? 0,
        last30dConversations: monthlyMap.get(stat.agentId!) ?? 0,
        uniqueUsers: userMap.get(stat.agentId!) ?? 0,
      };
    });

    // Agents with zero usage
    const usedAgentIds = new Set(agentStats.map((s) => s.agentId));
    const unusedAgents = agents
      .filter((a) => !usedAgentIds.has(a.id))
      .map((a) => ({
        agentId: a.id,
        slug: a.slug,
        name: a.name,
        tier: a.requiredTier,
        category: a.category,
        totalConversations: 0,
        last7dConversations: 0,
        last30dConversations: 0,
        uniqueUsers: 0,
      }));

    return NextResponse.json({
      totalAgentConversations,
      totalAgents: agents.length,
      activeAgents: agentStats.length,
      unusedAgents: unusedAgents.length,
      agentUsage: [...agentUsage, ...unusedAgents],
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }
    console.error("Agent analytics:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/agents — seed all agents into database
export async function POST() {
  try {
    await requireAdmin();
    await seedAgents();
    return NextResponse.json({ success: true, message: "Agents seeded" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }
    console.error("Seed agents:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
