import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { TIER_CONFIG, type Tier } from "@/lib/tier-config";
import {
  exportAsMarkdown,
  exportAsText,
  exportAsJSON,
} from "@/lib/conversation-export";

// GET /api/conversations/[id]/export?format=markdown|text|json
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

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json";

    if (!["markdown", "text", "json"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use: markdown, text, or json" },
        { status: 400 }
      );
    }

    if (format === "markdown") {
      const markdown = await exportAsMarkdown(id, user.id);
      if (!markdown) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="conversation-${id}.md"`,
        },
      });
    }

    if (format === "text") {
      const text = await exportAsText(id, user.id);
      if (!text) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="conversation-${id}.txt"`,
        },
      });
    }

    // JSON export (default)
    const exporterName = user.name || user.email;
    const exportData = await exportAsJSON(id, user.id, exporterName);
    if (!exportData) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="conversation-${id}.json"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to export conversation" },
      { status: 500 }
    );
  }
}
