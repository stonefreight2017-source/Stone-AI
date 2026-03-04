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
    const priceId = getStripePriceId(targetTier, billingPeriod);

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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app/billing?success=true&tier=${targetTier}`,
      cancel_url: `${appUrl}/app/billing?canceled=true`,
      metadata: { userId: user.id, targetTier, billingPeriod },
      subscription_data: {
        metadata: { userId: user.id },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Checkout:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
