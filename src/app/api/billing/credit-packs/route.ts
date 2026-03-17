import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CREDIT_PACK_PRICES, type CreditPackTier } from "@/lib/tier-config";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { logAuditEvent } from "@/lib/audit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const purchaseSchema = z.object({
  packTier: z.enum(["STARTER", "STANDARD", "POWER", "BULK"]),
}).strict();

/**
 * POST /api/billing/credit-packs — purchase a credit pack (one-time payment)
 *
 * Creates a Stripe Checkout session in 'payment' mode (not subscription).
 * On successful payment, the webhook handler credits smartCreditsBonus.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    // FREE users cannot purchase credit packs — they need a subscription first
    if (user.tier === "FREE") {
      return NextResponse.json(
        { error: "Credit packs are available for paid subscribers only. Upgrade to a plan first." },
        { status: 403 }
      );
    }

    // Rate limit: 5 purchase attempts per minute
    const rateCheck = await checkRateLimitAsync(`credit-pack:${user.id}`, 5);
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

    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const packTier = parsed.data.packTier as CreditPackTier;
    const pack = CREDIT_PACK_PRICES[packTier];
    const priceId = process.env[pack.stripePriceEnvKey];

    if (!priceId) {
      return NextResponse.json(
        { error: "Credit packs are not yet available for purchase. Check back soon." },
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

      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app/billing?credits=success&pack=${packTier}&credits_added=${pack.credits}`,
      cancel_url: `${appUrl}/app/billing?credits=canceled`,
      metadata: {
        userId: user.id,
        packTier,
        credits: String(pack.credits),
        type: "credit_pack",
      },
    });

    logAuditEvent({
      event: "admin.action",
      userId: user.id,
      metadata: { action: "credit_pack_checkout_created", packTier, credits: pack.credits },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Credit pack checkout:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/billing/credit-packs — list available packs and user's current bonus credits
 */
export async function GET() {
  try {
    const user = await getOrCreateUser();

    const packs = Object.entries(CREDIT_PACK_PRICES).map(([key, pack]) => ({
      id: key,
      credits: pack.credits,
      price: pack.price / 100,  // Convert cents to dollars
      priceFormatted: `$${(pack.price / 100).toFixed(2)}`,
    }));

    return NextResponse.json({
      packs,
      balance: {
        smartCreditsBonus: user.smartCreditsBonus,
      },
      eligible: user.tier !== "FREE",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
