import { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { mapPriceToTier, PROMO_PRICES, type PromoKey } from "@/lib/tier-config";
import { logAuditEvent } from "@/lib/audit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// POST /api/stripe/webhook — handle Stripe events with signature verification
export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  // CRITICAL: Read raw body for HMAC-SHA256 signature verification (Stripe pattern)
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    logAuditEvent({
      event: "admin.action",
      metadata: { action: "webhook_invalid_signature" },
    });
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook handler:", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

/** Check if a Stripe price ID matches a promotional price. Returns the promo key or null. */
function matchPromoKey(priceId: string): PromoKey | null {
  for (const [key, promo] of Object.entries(PROMO_PRICES)) {
    if (process.env[promo.stripePriceEnvKey] === priceId) {
      return key as PromoKey;
    }
  }
  return null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!subscriptionId || !customerId) return;

  // Retrieve subscription to get the price and determine tier
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const newTier = mapPriceToTier(priceId);
  if (!newTier) return;

  // Check if this is a promotional price — award OG badge
  const promoKey = matchPromoKey(priceId);
  const promoData: Record<string, unknown> = {};
  if (promoKey) {
    promoData.promoSubscribedAt = new Date();
    promoData.promoKey = promoKey;
    // Fetch existing user to check if "og" is already in badges
    const existing = await db.user.findUnique({ where: { id: userId }, select: { badges: true } });
    if (existing && !existing.badges.includes("og")) {
      promoData.badges = { push: "og" };
    }
  }

  await db.user.update({
    where: { id: userId },
    data: {
      tier: newTier,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: "ACTIVE",
      ...promoData,
    },
  });

  logAuditEvent({
    event: "tier.upgraded",
    userId,
    metadata: { newTier, priceId, promoKey: promoKey ?? "none", source: "checkout" },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) return;

  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!user) return;

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const newTier = mapPriceToTier(priceId);

  // Map Stripe status to our SubscriptionStatus
  const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "INACTIVE"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "PAST_DUE",
    incomplete: "INACTIVE",
    incomplete_expired: "INACTIVE",
    trialing: "ACTIVE",
    paused: "INACTIVE",
  };

  const subscriptionStatus = statusMap[subscription.status] ?? "INACTIVE";

  await db.user.update({
    where: { id: user.id },
    data: {
      ...(newTier ? { tier: newTier } : {}),
      subscriptionStatus,
      stripeSubscriptionId: subscription.id,
    },
  });

  logAuditEvent({
    event: "tier.upgraded",
    userId: user.id,
    metadata: { newTier: newTier ?? user.tier, status: subscription.status },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) return;

  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!user) return;

  // Downgrade to FREE on cancellation
  await db.user.update({
    where: { id: user.id },
    data: {
      tier: "FREE",
      subscriptionStatus: "CANCELED",
    },
  });

  logAuditEvent({
    event: "tier.downgraded",
    userId: user.id,
    metadata: { newTier: "FREE", reason: "subscription_deleted" },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  if (!customerId) return;

  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!user) return;

  await db.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "PAST_DUE" },
  });
}
