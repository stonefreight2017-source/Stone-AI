import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { checkRateLimitAsync } from "@/lib/rate-limiter";

// ─── FREE TRIAL CONFIG ───────────────────────────────────
// Enhanced trial: credit card required, 7 days, full tier experience, auto-converts

const trialSchema = z.object({
  type: z.literal("enhanced"),
  tier: z.enum(["STARTER", "PLUS", "SMART", "PRO", "ENTERPRISE"]).optional(),
}).strict();

// GET /api/trial — check trial eligibility and status
export async function GET() {
  try {
    const user = await getOrCreateUser();

    const now = new Date();
    const trialActive = user.freeTrialEndsAt && user.freeTrialEndsAt > now;

    return NextResponse.json({
      enhancedTrialUsed: user.enhancedTrialUsed,
      trialActive,
      trialTier: trialActive ? user.freeTrialTier : null,
      trialEndsAt: trialActive ? user.freeTrialEndsAt : null,
      daysRemaining: trialActive
        ? Math.ceil((user.freeTrialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      eligible: {
        basic: false,
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

// POST /api/trial — validate enhanced trial eligibility (credit card required via Stripe)
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
    console.error("Trial:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
