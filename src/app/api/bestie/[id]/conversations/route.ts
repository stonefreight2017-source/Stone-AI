import { NextRequest } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET — List conversations for a bestie
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await getOrCreateUser();
    if (user.banned) {
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }

    const { id: bestieId } = await context.params;

    // Verify bestie ownership
    const bestie = await db.bestieProfile.findFirst({
      where: { id: bestieId, userId: user.id, isActive: true },
    });
    if (!bestie) {
      return Response.json({ error: "Bestie not found" }, { status: 404 });
    }

    const conversations = await db.conversation.findMany({
      where: { bestieId, userId: user.id, archived: false },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    });

    return Response.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        lastMessage: c.messages[0]?.content.slice(0, 100) ?? null,
        lastMessageRole: c.messages[0]?.role ?? null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/bestie/[id]/conversations:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST — Create a new conversation with a bestie
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await getOrCreateUser();
    if (user.banned) {
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }

    const { id: bestieId } = await context.params;

    // Verify bestie ownership
    const bestie = await db.bestieProfile.findFirst({
      where: { id: bestieId, userId: user.id, isActive: true },
    });
    if (!bestie) {
      return Response.json({ error: "Bestie not found" }, { status: 404 });
    }

    const conversation = await db.conversation.create({
      data: {
        userId: user.id,
        bestieId,
        title: `Chat with ${bestie.name}`,
      },
    });

    return Response.json({ conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/bestie/[id]/conversations:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE — Archive a conversation
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await getOrCreateUser();
    if (user.banned) {
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }

    const { id: bestieId } = await context.params;
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return Response.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, bestieId, userId: user.id },
    });
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    await db.conversation.update({
      where: { id: conversationId },
      data: { archived: true },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/bestie/[id]/conversations:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
