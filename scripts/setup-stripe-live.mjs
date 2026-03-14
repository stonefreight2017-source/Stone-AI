/**
 * Stone AI — Create all Stripe products, prices, and coupons for LIVE mode.
 * Run once: node scripts/setup-stripe-live.mjs
 */
import Stripe from "stripe";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const sk = process.env.STRIPE_SECRET_KEY;
if (!sk || !sk.startsWith("sk_live_")) {
  console.error("ERROR: STRIPE_SECRET_KEY must be a live key (sk_live_...)");
  process.exit(1);
}

const stripe = new Stripe(sk);

// ── helpers ──────────────────────────────────────────────────────────────────
async function createProduct(name, description) {
  const product = await stripe.products.create({ name, description });
  console.log(`  Created product: ${name} (${product.id})`);
  return product.id;
}

async function createRecurringPrice(productId, label, unitAmountCents, interval, intervalCount = 1) {
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmountCents,
    currency: "usd",
    recurring: { interval, interval_count: intervalCount },
    nickname: label,
  });
  console.log(`    ${label}: ${price.id} ($${(unitAmountCents / 100).toFixed(2)} / ${intervalCount > 1 ? intervalCount + " " : ""}${interval}${intervalCount > 1 ? "s" : ""})`);
  return price.id;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n=== Stone AI — Stripe Live Setup ===\n");

  const ids = {};

  // ─── 1. Builder ────────────────────────────────────────────────────────────
  console.log("1/5  Builder");
  const builderProd = await createProduct("Builder Plan", "Plan and start your business — 16 AI agents, 10 Smart Mode/day");
  ids.STRIPE_PRICE_STARTER          = await createRecurringPrice(builderProd, "Builder Monthly",       1999, "month");
  ids.STRIPE_PRICE_STARTER_6MO      = await createRecurringPrice(builderProd, "Builder 6-Month",     10794, "month", 6);
  ids.STRIPE_PRICE_STARTER_ANNUAL   = await createRecurringPrice(builderProd, "Builder Annual",      19188, "year");
  ids.STRIPE_PRICE_TRIAL            = await createRecurringPrice(builderProd, "Builder Founder $14.99/mo forever", 1499, "month");

  // ─── 2. Growth ─────────────────────────────────────────────────────────────
  console.log("2/5  Growth");
  const growthProd = await createProduct("Growth Plan", "Plan, start, and maintain your business — 30 AI agents, 15 Smart Mode/day");
  ids.STRIPE_PRICE_PLUS             = await createRecurringPrice(growthProd, "Growth Monthly",        4999, "month");
  ids.STRIPE_PRICE_PLUS_6MO         = await createRecurringPrice(growthProd, "Growth 6-Month",      26994, "month", 6);
  ids.STRIPE_PRICE_PLUS_ANNUAL      = await createRecurringPrice(growthProd, "Growth Annual",       47988, "year");
  ids.STRIPE_PRICE_GROWTH_SIGNUP    = await createRecurringPrice(growthProd, "Growth Early Adopter $39.99/mo forever", 3999, "month");

  // ─── 3. Executive ──────────────────────────────────────────────────────────
  console.log("3/5  Executive");
  const execProd = await createProduct("Executive Plan", "Run your business — 39 AI agents, 30 Smart Mode/day, team workspace");
  ids.STRIPE_PRICE_SMART            = await createRecurringPrice(execProd, "Executive Monthly",       9999, "month");
  ids.STRIPE_PRICE_SMART_ANNUAL     = await createRecurringPrice(execProd, "Executive Annual",      95988, "year");

  // ─── 4. Reseller ───────────────────────────────────────────────────────────
  console.log("4/5  Reseller");
  const resellerProd = await createProduct("Reseller Plan", "Full platform access with reseller capabilities — 42 AI agents, API access");
  ids.STRIPE_PRICE_PRO              = await createRecurringPrice(resellerProd, "Reseller Monthly",   20000, "month");
  ids.STRIPE_PRICE_PRO_ANNUAL       = await createRecurringPrice(resellerProd, "Reseller Annual",  204000, "year");

  // ─── 5. Enterprise ─────────────────────────────────────────────────────────
  console.log("5/5  Enterprise");
  const enterpriseProd = await createProduct("Enterprise Plan", "Custom engagement — dedicated infrastructure, team seats, SLA");
  ids.STRIPE_PRICE_ENTERPRISE       = await createRecurringPrice(enterpriseProd, "Enterprise Monthly", 50000, "month");
  ids.STRIPE_PRICE_ENTERPRISE_ANNUAL = await createRecurringPrice(enterpriseProd, "Enterprise Annual", 570000, "year");

  // ─── 6. First Month Coupon ($10 off, once) ────────────────────────────────
  console.log("\nCoupon: First Month Deal");
  const coupon = await stripe.coupons.create({
    name: "First Month Deal — $10 off Builder",
    amount_off: 1000,
    currency: "usd",
    duration: "once",
  });
  console.log(`  Coupon ID: ${coupon.id}`);
  ids.STRIPE_FIRST_MONTH_COUPON_ID = coupon.id;

  // ─── 7. Write results ─────────────────────────────────────────────────────
  console.log("\n=== All Price IDs ===\n");
  for (const [key, val] of Object.entries(ids)) {
    console.log(`${key}=${val}`);
  }

  // Save to a file for reference
  const outPath = resolve("scripts/stripe-live-ids.txt");
  const lines = Object.entries(ids).map(([k, v]) => `${k}=${v}`).join("\n");
  writeFileSync(outPath, lines + "\n");
  console.log(`\nSaved to ${outPath}`);

  return ids;
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
