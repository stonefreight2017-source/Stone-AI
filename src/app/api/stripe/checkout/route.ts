import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { getOrCreateUser } from "@/lib/auth";
import { getStripePriceId } from "@/lib/tier-config";
import { checkRateLimit } from "@/lib/rate-limiter";
import type { Tier, BillingPeriod } from "@/lib/tier-config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const checkoutSchema = z.object({
  tier: z.enum(["STARTER", "PLUS", "SMART", "PRO"]),
  period: z.enum(["monthly", "semiannual", "annual"]).optional().default("monthly"),
  trial: z.boolean().optional().default(false),
});

// POST /api/stripe/checkout — create a Stripe checkout session
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    // Rate limit: 5 checkout attempts per minute
    const rateCheck = checkRateLimit(`checkout:${user.id}`, 5);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Slow down." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const targetTier = parsed.data.tier as Tier;
    const billingPeriod = parsed.data.period as BillingPeriod;
    const wantsTrial = parsed.data.trial;
    const priceId = getStripePriceId(targetTier, billingPeriod);

    // Enhanced trial: one per account, requires credit card, 7-day free then auto-charges
    if (wantsTrial && user.enhancedTrialUsed) {
      return NextResponse.json(
        { error: "Enhanced trial already used. Each account gets one enhanced trial." },
        { status: 400 }
      );
    }

    if (!priceId || priceId === "price_PASTE_LATER") {
      return NextResponse.json(
        { error: "This plan is not yet available for purchase. Check back soon." },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      // Save customer ID immediately
      await (await import("@/lib/db")).db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app/billing?success=true&tier=${targetTier}${wantsTrial ? "&trial=true" : ""}`,
      cancel_url: `${appUrl}/app/billing?canceled=true`,
      metadata: { userId: user.id, targetTier, billingPeriod, trial: wantsTrial ? "true" : "false" },
      subscription_data: {
        metadata: { userId: user.id },
        ...(wantsTrial ? { trial_period_days: 7 } : {}),
      },
      allow_promotion_codes: !wantsTrial, // No promo codes during trial
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Mark enhanced trial as used after successful session creation
    if (wantsTrial) {
      await (await import("@/lib/db")).db.user.update({
        where: { id: user.id },
        data: { enhancedTrialUsed: true },
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Checkout:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
