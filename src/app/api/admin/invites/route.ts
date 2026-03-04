import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import crypto from "crypto";

const createInviteSchema = z.object({
  tier: z.enum(["FREE", "STARTER", "PLUS", "SMART", "PRO"]),
  maxUses: z.number().int().min(1).max(1000).default(1),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

function generateCode(): string {
  // 8 bytes = 64-bit entropy (vs previous 4 bytes = 32-bit)
  return "STONE-" + crypto.randomBytes(8).toString("hex").toUpperCase();
}

// GET /api/admin/invites — list all invite codes
export async function GET() {
  try {
    await requireAdmin();

    const invites = await db.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        redemptions: {
          select: { userId: true, newTier: true, redeemedAt: true },
        },
      },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "Forbidden")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/invites — create a new invite code
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { tier, maxUses, expiresInDays } = parsed.data;
    const code = generateCode();

    const invite = await db.inviteCode.create({
      data: {
        code,
        tier: tier as any,
        maxUses,
        expiresAt: expiresInDays
          ? new Date(Date.now() + expiresInDays * 86400000)
          : null,
        createdBy: admin.id,
      },
    });

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "Forbidden")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
