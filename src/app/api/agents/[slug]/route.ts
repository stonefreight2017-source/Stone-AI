import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { AGENT_CAPABILITIES } from "@/lib/agent-capabilities";

const TIER_RANK: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  PLUS: 2,
  SMART: 3,
  PRO: 4,
};

// GET /api/agents/[slug] — get agent details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { slug } = await params;

    const agent = await db.agent.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        icon: true,
        requiredTier: true,
        sortOrder: true,
        _count: { select: { knowledgeChunks: true } },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const userTierRank = TIER_RANK[user.tier] ?? 0;
    const requiredRank = TIER_RANK[agent.requiredTier] ?? 0;
    const unlocked = userTierRank >= requiredRank;

    const caps = AGENT_CAPABILITIES[agent.slug];

    // Get user's memory count with this agent
    const memoryCount = await db.agentMemory.count({
      where: { agentId: agent.id, userId: user.id },
    });

    return NextResponse.json({
      agent: {
        ...agent,
        knowledgeChunks: agent._count.knowledgeChunks,
        unlocked,
        capabilities: caps?.capabilities ?? [],
        businessUse: caps?.businessUse ?? "",
        memoryCount,
      },
    });
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
