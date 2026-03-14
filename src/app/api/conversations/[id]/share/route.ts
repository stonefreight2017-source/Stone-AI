import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

/**
 * NOTE: This route uses raw SQL to manage a `share_id` column on the Conversation table.
 * A proper Prisma schema migration should be added:
 *   shareId  String?  @unique
 * Then replace the raw SQL below with Prisma client calls.
 */

// Ensure the share_id column exists (idempotent)
async function ensureShareColumn(): Promise<void> {
  try {
    await db.$executeRawUnsafe(`
      ALTER TABLE "Conversation"
      ADD COLUMN IF NOT EXISTS "share_id" TEXT UNIQUE
    `);
  } catch {
    // Column likely already exists or DB doesn't support IF NOT EXISTS —
    // the queries below will still work if the column is present.
  }
}

/**
 * Generate a URL-safe share ID (16 bytes = 32 hex chars).
 */
function generateShareId(): string {
  return randomBytes(16).toString("hex");
}

// POST /api/conversations/[id]/share — create a share link
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getOrCreateUser();

    // Verify ownership
    const conversation = await db.conversation.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    await ensureShareColumn();

    // Check if already shared
    const existing = await db.$queryRawUnsafe<
      { share_id: string | null }[]
    >(
      `SELECT "share_id" FROM "Conversation" WHERE "id" = $1`,
      conversation.id
    );

    if (existing[0]?.share_id) {
      // Already shared — return existing link
      return NextResponse.json({
        shared: true,
        shareId: existing[0].share_id,
        shareUrl: `/shared/${existing[0].share_id}`,
      });
    }

    // Create new share link
    const shareId = generateShareId();
    await db.$executeRawUnsafe(
      `UPDATE "Conversation" SET "share_id" = $1 WHERE "id" = $2`,
      shareId,
      conversation.id
    );

    return NextResponse.json(
      {
        shared: true,
        shareId,
        shareUrl: `/shared/${shareId}`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(
      "POST /api/conversations/[id]/share:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}

// GET /api/conversations/[id]/share — get share status
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getOrCreateUser();

    // Verify ownership
    const conversation = await db.conversation.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    await ensureShareColumn();

    const result = await db.$queryRawUnsafe<
      { share_id: string | null }[]
    >(
      `SELECT "share_id" FROM "Conversation" WHERE "id" = $1`,
      conversation.id
    );

    const shareId = result[0]?.share_id ?? null;

    return NextResponse.json({
      shared: shareId !== null,
      shareId,
      shareUrl: shareId ? `/shared/${shareId}` : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(
      "GET /api/conversations/[id]/share:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to get share status" },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id]/share — remove share link
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getOrCreateUser();

    // Verify ownership
    const conversation = await db.conversation.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    await ensureShareColumn();

    await db.$executeRawUnsafe(
      `UPDATE "Conversation" SET "share_id" = NULL WHERE "id" = $1`,
      conversation.id
    );

    return NextResponse.json({ shared: false, shareId: null, shareUrl: null });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(
      "DELETE /api/conversations/[id]/share:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to remove share link" },
      { status: 500 }
    );
  }
}
