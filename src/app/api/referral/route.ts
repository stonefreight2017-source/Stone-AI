import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getTierConfig } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";

// GET /api/referral — get user's referral code, stats, and referral list
export async function GET() {
  try {
    const user = await getOrCreateUser();

    // Rate limit: 10 reads per minute
    const rateCheck = checkRateLimit(`referral:${user.id}`, 10);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Generate referral code if user doesn't have one
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = nanoid(8).toUpperCase();
      await db.user.update({
        where: { id: user.id },
        data: { referralCode },
      });
    }

    // Get referral stats
    const referrals = await db.referral.findMany({
      where: { referrerId: user.id },
      include: {
        referredUser: {
          select: { name: true, email: true, tier: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: referrals.length,
      pending: referrals.filter((r) => r.status === "PENDING").length,
      qualified: referrals.filter((r) => r.status === "QUALIFIED").length,
      rewarded: referrals.filter((r) => r.status === "REWARDED").length,
    };

    const tierConfig = getTierConfig(user.tier as Tier);

    return NextResponse.json({
      referralCode,
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?ref=${referralCode}`,
      referralMultiplier: tierConfig.perks.referralMultiplier,
      stats,
      referrals: referrals.map((r) => ({
        id: r.id,
        status: r.status,
        name: r.referredUser.name,
        email: r.referredUser.email?.replace(/(.{2}).*(@.*)/, "$1***$2"),
        tier: r.referredUser.tier,
        joinedAt: r.referredUser.createdAt,
        rewardType: r.rewardType,
        rewardAmount: r.rewardAmount,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Referral GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
