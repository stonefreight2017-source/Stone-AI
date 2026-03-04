import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateConversationSchema } from "@/lib/validators";
import { logAuditEvent } from "@/lib/audit";

const idSchema = z.string().min(1);

// GET /api/conversations/[id] — get conversation with messages
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;

    const parsed = idSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const conversation = await db.conversation.findFirst({
      where: { id: parsed.data, userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            mode: true,
            tokensIn: true,
            tokensOut: true,
            createdAt: true,
          },
        },
        bestie: {
          select: {
            id: true,
            name: true,
            avatarEmoji: true,
            personality: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        bestie: conversation.bestie ?? null,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        mode: m.mode,
        tokensIn: m.tokensIn,
        tokensOut: m.tokensOut,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/conversations/[id]:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] — rename conversation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;

    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = updateConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Single query with ownership check to prevent race condition
    const existing = await db.conversation.findFirst({
      where: { id: parsedId.data, userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const updated = await db.conversation.update({
      where: { id: existing.id },
      data: { title: parsed.data.title },
      select: { id: true, title: true },
    });

    return NextResponse.json({ conversation: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/conversations/[id]:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] — delete conversation and its messages
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;

    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.conversation.findFirst({
      where: { id: parsedId.data, userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Delete messages first, then conversation — using verified existing.id
    await db.message.deleteMany({ where: { conversationId: existing.id } });
    await db.conversation.delete({ where: { id: existing.id } });

    logAuditEvent({
      event: "conversation.deleted",
      userId: user.id,
      metadata: { conversationId: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/conversations/[id]:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
