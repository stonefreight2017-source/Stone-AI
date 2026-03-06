import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { AGENT_CAPABILITIES } from "@/lib/agent-capabilities";
import { canAccessAgent, TIER_CONFIG } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";

// GET /api/agents — list all available agents with tier access info
export async function GET() {
  try {
    const user = await getOrCreateUser();
    const userTier = user.tier as Tier;

    // Hidden agent slugs — internal use only, not shown in marketplace
    const HIDDEN_AGENTS = ["stone"];

    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(user.email.toLowerCase());

    const agents = await db.agent.findMany({
      where: {
        isActive: true,
        // Hide internal agents from non-admin users
        ...(!isAdmin && { slug: { notIn: HIDDEN_AGENTS } }),
      },
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
      const unlocked = canAccessAgent(userTier, agent.requiredTier as Tier);

      // Locked agents: show only name, category, tier requirement — no details
      if (!unlocked) {
        return {
          id: agent.id,
          slug: agent.slug,
          name: agent.name,
          description: `Upgrade to ${TIER_CONFIG[agent.requiredTier as Tier]?.name ?? agent.requiredTier} to unlock this agent.`,
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
