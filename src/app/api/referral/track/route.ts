import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimitAsync } from "@/lib/rate-limiter";

// POST /api/referral/track — track that current user was referred by a code
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    // Rate limit: 3 track attempts per minute
    const rateCheck = await checkRateLimitAsync(`referral-track:${user.id}`, 3);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const refCode = body?.referralCode;

    if (!refCode || typeof refCode !== "string") {
      return NextResponse.json({ error: "Missing referral code" }, { status: 400 });
    }

    // Don't allow self-referral
    if (user.referralCode === refCode) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Already referred by someone
    if (user.referredBy) {
      return NextResponse.json({ error: "Already referred" }, { status: 400 });
    }

    // Find referrer
    const referrer = await db.user.findUnique({
      where: { referralCode: refCode },
    });

    if (!referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }

    // Create referral record and update user
    await db.$transaction([
      db.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId: user.id,
          status: "PENDING",
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { referredBy: referrer.id },
      }),
    ]);

    // Notify referrer
    await db.notification.create({
      data: {
        userId: referrer.id,
        type: "referral",
        title: "New Referral!",
        body: `A new user just signed up using your referral link!`,
        href: "/app/settings",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Referral track:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
