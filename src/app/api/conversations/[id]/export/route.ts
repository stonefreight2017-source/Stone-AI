import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { TIER_CONFIG, type Tier } from "@/lib/tier-config";

// GET /api/conversations/[id]/export — export conversation as JSON
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getOrCreateUser();

    // Check tier allows export
    const config = TIER_CONFIG[user.tier as Tier];
    if (!config.perks.conversationExport) {
      return NextResponse.json(
        { error: "Conversation export requires Plus plan or above" },
        { status: 403 }
      );
    }

    const conversation = await db.conversation.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            role: true,
            content: true,
            model: true,
            mode: true,
            createdAt: true,
          },
        },
        agent: {
          select: { name: true, slug: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json";

    if (format === "text") {
      // Plain text export
      const lines: string[] = [
        `Conversation: ${conversation.title}`,
        `Date: ${conversation.createdAt.toISOString()}`,
        conversation.agent ? `Agent: ${conversation.agent.name}` : "",
        "---",
        "",
      ].filter(Boolean);

      for (const msg of conversation.messages) {
        const role = msg.role === "USER" ? "You" : msg.role === "ASSISTANT" ? "AI" : "System";
        const time = new Date(msg.createdAt).toLocaleString();
        lines.push(`[${role}] (${time})`);
        lines.push(msg.content);
        lines.push("");
      }

      const text = lines.join("\n");
      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="conversation-${id}.txt"`,
        },
      });
    }

    // JSON export (default)
    const exportData = {
      title: conversation.title,
      agent: conversation.agent?.name || null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messageCount: conversation.messages.length,
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        model: m.model,
        mode: m.mode,
        timestamp: m.createdAt,
      })),
      exportedAt: new Date().toISOString(),
      exportedBy: user.name || user.email,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="conversation-${id}.json"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export conversation" }, { status: 500 });
  }
}
