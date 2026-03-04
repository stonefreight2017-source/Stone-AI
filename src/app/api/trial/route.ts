import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { TIER_CONFIG } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";

// ─── FREE TRIAL CONFIG ───────────────────────────────────
// Basic trial: no credit card, 7 days, STARTER-level limits but reduced
// Enhanced trial: credit card required, 7 days, full tier experience, auto-converts
const BASIC_TRIAL_DAYS = 7;
const BASIC_TRIAL_TIER = "STARTER" as Tier; // Give them a taste of STARTER

const trialSchema = z.object({
  type: z.enum(["basic", "enhanced"]),
  tier: z.enum(["STARTER", "PLUS", "SMART", "PRO"]).optional(),
});

// GET /api/trial — check trial eligibility and status
export async function GET() {
  try {
    const user = await getOrCreateUser();

    const now = new Date();
    const trialActive = user.freeTrialEndsAt && user.freeTrialEndsAt > now;

    return NextResponse.json({
      basicTrialUsed: user.freeTrialUsed,
      enhancedTrialUsed: user.enhancedTrialUsed,
      trialActive,
      trialTier: trialActive ? user.freeTrialTier : null,
      trialEndsAt: trialActive ? user.freeTrialEndsAt : null,
      daysRemaining: trialActive
        ? Math.ceil((user.freeTrialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      eligible: {
        basic: !user.freeTrialUsed && user.tier === "FREE",
        enhanced: !user.enhancedTrialUsed && !user.stripeSubscriptionId,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/trial — activate a basic free trial (no credit card)
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    // Rate limit
    const rateCheck = await checkRateLimitAsync(`trial:${user.id}`, 3);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const parsed = trialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { type } = parsed.data;

    if (type === "basic") {
      // ─── BASIC TRIAL (no credit card) ───────────────────
      // One-time only, STARTER taste for 7 days
      if (user.freeTrialUsed) {
        return NextResponse.json(
          { error: "Free trial already used. Each account gets one free trial." },
          { status: 400 }
        );
      }

      if (user.tier !== "FREE") {
        return NextResponse.json(
          { error: "Free trial is only available for Free tier accounts." },
          { status: 400 }
        );
      }

      // Check if already has active subscription
      if (user.subscriptionStatus === "ACTIVE") {
        return NextResponse.json(
          { error: "You already have an active subscription." },
          { status: 400 }
        );
      }

      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + BASIC_TRIAL_DAYS);

      await db.user.update({
        where: { id: user.id },
        data: {
          freeTrialUsed: true,
          freeTrialTier: BASIC_TRIAL_TIER,
          freeTrialStartedAt: new Date(),
          freeTrialEndsAt: trialEnd,
          tier: BASIC_TRIAL_TIER,
        },
      });

      // Send notification
      await db.notification.create({
        data: {
          userId: user.id,
          type: "trial",
          title: "Free Trial Activated!",
          body: `You now have ${BASIC_TRIAL_DAYS}-day access to ${TIER_CONFIG[BASIC_TRIAL_TIER].name} features. Enjoy!`,
          href: "/app/billing",
        },
      });

      return NextResponse.json({
        success: true,
        trialTier: BASIC_TRIAL_TIER,
        trialEndsAt: trialEnd,
        message: `${BASIC_TRIAL_DAYS}-day ${TIER_CONFIG[BASIC_TRIAL_TIER].name} trial activated!`,
      });
    }

    if (type === "enhanced") {
      // ─── ENHANCED TRIAL (credit card required) ──────────
      // Handled via Stripe checkout with trial_period_days
      // This endpoint just validates eligibility — actual checkout
      // is done via /api/stripe/checkout with trial=true
      if (user.enhancedTrialUsed) {
        return NextResponse.json(
          { error: "Enhanced trial already used. Each account gets one enhanced trial." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        eligible: true,
        message: "Use /api/stripe/checkout with trial=true to start enhanced trial.",
      });
    }

    return NextResponse.json({ error: "Invalid trial type" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Trial:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
