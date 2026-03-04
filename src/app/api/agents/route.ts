import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { AGENT_CAPABILITIES } from "@/lib/agent-capabilities";
import type { Tier } from "@/lib/tier-config";

const TIER_RANK: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  PLUS: 2,
  SMART: 3,
  PRO: 4,
};

// GET /api/agents — list all available agents with tier access info
export async function GET() {
  try {
    const user = await getOrCreateUser();
    const userTierRank = TIER_RANK[user.tier] ?? 0;

    const agents = await db.agent.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        icon: true,
        requiredTier: true,
        sortOrder: true,
      },
    });

    const enriched = agents.map((agent) => {
      const caps = AGENT_CAPABILITIES[agent.slug];
      const requiredRank = TIER_RANK[agent.requiredTier] ?? 0;
      const unlocked = userTierRank >= requiredRank;

      // Locked agents: show only name, category, tier requirement — no details
      if (!unlocked) {
        return {
          id: agent.id,
          slug: agent.slug,
          name: agent.name,
          description: `Upgrade to ${agent.requiredTier} to unlock this agent.`,
          category: agent.category,
          icon: agent.icon,
          requiredTier: agent.requiredTier,
          sortOrder: agent.sortOrder,
          unlocked: false,
          capabilities: [],
          businessUse: "",
        };
      }

      return {
        ...agent,
        unlocked: true,
        capabilities: caps?.capabilities ?? [],
        businessUse: caps?.businessUse ?? "",
      };
    });

    return NextResponse.json({ agents: enriched });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
