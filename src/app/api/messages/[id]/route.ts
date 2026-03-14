/**
 * Messages API — Edit, Regenerate, Get with Versions
 *
 * PATCH /api/messages/[id]  — edit a user message
 * POST  /api/messages/[id]  — regenerate an assistant message
 * GET   /api/messages/[id]  — get message with version history
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import {
  editMessage,
  regenerateResponse,
  getMessageVersions,
} from "@/lib/message-actions";
import { logAuditEvent, getClientIp } from "@/lib/audit";

// ═══════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════

const editSchema = z
  .object({
    content: z
      .string()
      .min(1, "Content cannot be empty")
      .max(32000, "Content is too long (max 32,000 characters)")
      .refine((val) => val.trim().length > 0, "Content cannot be only whitespace"),
  })
  .strict();

const regenerateSchema = z
  .object({
    action: z.literal("regenerate"),
  })
  .strict();

type RouteParams = { params: Promise<{ id: string }> };

// ═══════════════════════════════════════════
// GET — Message with version history
// ═══════════════════════════════════════════

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    const versions = await getMessageVersions(id, user.id);

    return NextResponse.json({ versions });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (
        error.message === "Message not found" ||
        error.message.startsWith("Unauthorized:")
      ) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    console.error("GET /api/messages/[id]:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// PATCH — Edit a user message
// ═══════════════════════════════════════════

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = editSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await editMessage(id, parsed.data.content, user.id);

    logAuditEvent({
      event: "message.edited",
      userId: user.id,
      ip: getClientIp(req.headers),
      metadata: {
        messageId: id,
        staleCount: result.staleCount,
      },
    });

    return NextResponse.json({
      message: {
        id: result.message.id,
        content: result.message.content,
        role: result.message.role,
        createdAt: result.message.createdAt,
      },
      staleCount: result.staleCount,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Message not found") {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }
      if (error.message.startsWith("Unauthorized:")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Only user messages can be edited") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Message content cannot be empty") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error("PATCH /api/messages/[id]:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════
// POST — Regenerate an assistant message
// ═══════════════════════════════════════════

export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = regenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input. Expected { action: \"regenerate\" }" },
        { status: 400 }
      );
    }

    const result = await regenerateResponse(id, user.id);

    logAuditEvent({
      event: "message.regenerated",
      userId: user.id,
      ip: getClientIp(req.headers),
      metadata: { messageId: id },
    });

    return NextResponse.json({
      precedingUserMessage: result.precedingUserMessage,
      conversationId: result.conversationId,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Message not found") {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }
      if (error.message.startsWith("Unauthorized:")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Only assistant messages can be regenerated") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "No preceding user message found for regeneration") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error("POST /api/messages/[id]:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
