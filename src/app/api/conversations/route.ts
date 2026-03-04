import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limiter";

const TIER_RANK: Record<string, number> = {
  FREE: 0, STARTER: 1, PLUS: 2, SMART: 3, PRO: 4,
};

// GET /api/conversations — list user's conversations (latest 50)
export async function GET() {
  try {
    const user = await getOrCreateUser();

    const conversations = await db.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        agent: { select: { slug: true, name: true, icon: true } },
      },
    });

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt.toISOString(),
        agent: c.agent ? { slug: c.agent.slug, name: c.agent.name, icon: c.agent.icon } : null,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/conversations — create a new conversation (optionally with an agent)
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    // Rate limit: 30 conversation creations per minute (prevents spam)
    const rateCheck = checkRateLimit(`conv:${user.id}`, 30);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many conversations created. Slow down." },
        { status: 429 }
      );
    }

    let agentId: string | undefined;
    let agentName: string | undefined;
    try {
      const body = await req.json();
      if (body?.agentId) {
        const agent = await db.agent.findUnique({
          where: { id: body.agentId },
          select: { id: true, name: true, requiredTier: true },
        });
        if (agent) {
          // ENFORCE AGENT TIER CHECK at conversation creation
          const agentTierRank = TIER_RANK[agent.requiredTier] ?? 0;
          const userTierRank = TIER_RANK[user.tier] ?? 0;
          if (userTierRank < agentTierRank) {
            return NextResponse.json(
              {
                error: `This agent requires ${agent.requiredTier} tier or higher`,
                requiredTier: agent.requiredTier,
              },
              { status: 403 }
            );
          }
          agentId = agent.id;
          agentName = agent.name;
        }
      }
    } catch {
      // No body or invalid JSON — create without agent
    }

    const conversation = await db.conversation.create({
      data: {
        userId: user.id,
        title: agentName ? `${agentName} Chat` : "New Chat",
        agentId: agentId ?? null,
      },
      select: {
        id: true,
        title: true,
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
