import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logAuditEvent, getClientIp } from "@/lib/audit";

const TIER_RANK: Record<string, number> = {
  FREE: 0, STARTER: 1, PLUS: 2, SMART: 3, PRO: 4,
};

const redeemSchema = z.object({
  code: z.string().min(1).max(50),
});

// POST /api/invite/redeem — redeem an invite code
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    // Rate limit: 5 attempts per minute to prevent brute force
    const rateCheck = checkRateLimit(`invite:${user.id}`, 5);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait before trying again." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { code } = parsed.data;
    const previousTier = user.tier;

    // Use interactive transaction to prevent race conditions
    const result = await db.$transaction(async (tx) => {
      // Find and lock the invite code within the transaction
      const invite = await tx.inviteCode.findUnique({
        where: { code: code.toUpperCase() },
        include: { redemptions: { where: { userId: user.id } } },
      });

      if (!invite) {
        return { error: "Invalid invite code", status: 404 };
      }

      // Check if expired
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return { error: "This invite code has expired", status: 410 };
      }

      // Check if maxed out (inside transaction = race-safe)
      if (invite.usedCount >= invite.maxUses) {
        return { error: "This invite code has been fully used", status: 410 };
      }

      // Check if user already redeemed this code
      if (invite.redemptions.length > 0) {
        return { error: "You've already redeemed this code", status: 409 };
      }

      // Prevent tier downgrade — only allow upgrades
      const inviteTierRank = TIER_RANK[invite.tier] ?? 0;
      const currentTierRank = TIER_RANK[previousTier] ?? 0;
      if (inviteTierRank <= currentTierRank) {
        return {
          error: "This code would not upgrade your current tier",
          status: 400,
        };
      }

      // Apply the upgrade atomically
      await tx.user.update({
        where: { id: user.id },
        data: { tier: invite.tier },
      });

      await tx.inviteRedemption.create({
        data: {
          inviteCodeId: invite.id,
          userId: user.id,
          previousTier: previousTier as any,
          newTier: invite.tier,
        },
      });

      // Atomic increment with conditional check (second layer of race protection)
      const updated = await tx.inviteCode.updateMany({
        where: {
          id: invite.id,
          usedCount: { lt: invite.maxUses },
        },
        data: { usedCount: { increment: 1 } },
      });

      if (updated.count === 0) {
        throw new Error("Code already fully used");
      }

      return {
        success: true,
        previousTier,
        newTier: invite.tier,
      };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    logAuditEvent({
      event: "invite.redeemed",
      userId: user.id,
      ip: getClientIp(req.headers),
      metadata: {
        previousTier: result.previousTier as string,
        newTier: result.newTier as string,
      },
    });

    return NextResponse.json({
      success: true,
      previousTier: result.previousTier,
      newTier: result.newTier,
      message: `Upgraded to ${result.newTier}!`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Invite redeem:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
