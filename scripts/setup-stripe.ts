/**
 * Create all Stone AI Stripe products, prices, and coupon.
 * Run with: npx tsx scripts/setup-stripe.ts
 */

import "dotenv/config";
import Stripe from "stripe";
import fs from "fs";
import path from "path";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface PlanDef {
  tier: string;
  name: string;
  price: number; // cents
  description: string;
  features: string[];
  agentCount: number;
  envKey: string;
}

const PLANS: PlanDef[] = [
  {
    tier: "STARTER",
    name: "Stone AI Starter",
    price: 999, // $9.99
    description: "For daily AI users. Faster throughput, longer responses, extended usage.",
    features: [
      "Extended daily usage",
      "2M tokens/month",
      "20-message context window",
      "Local AI inference",
      "4x faster throughput",
    ],
    agentCount: 0,
    envKey: "STRIPE_PRICE_STARTER",
  },
  {
    tier: "PLUS",
    name: "Stone AI Plus",
    price: 2999, // $29.99
    description: "Unlock AI Expert Agents. 11 premium agents for content, marketing, and branding.",
    features: [
      "11 AI Expert Agents",
      "Generous daily limits",
      "9.8M tokens/month",
      "40-message context window",
      "Conversation export",
      "2 concurrent requests",
    ],
    agentCount: 11,
    envKey: "STRIPE_PRICE_PLUS",
  },
  {
    tier: "SMART",
    name: "Stone AI Smart",
    price: 6999, // $69.99
    description: "Full agency toolkit. 26 AI agents, cloud AI fallback, auto-routing for business operators.",
    features: [
      "26 AI Expert Agents",
      "GPT-4o Smart mode",
      "High-volume daily usage",
      "29.4M tokens/month",
      "Cloud fallback (never down)",
      "Auto-routing",
      "3 concurrent requests",
    ],
    agentCount: 26,
    envKey: "STRIPE_PRICE_SMART",
  },
  {
    tier: "PRO",
    name: "Stone AI Pro",
    price: 19900, // $199
    description: "All 30 agents, API access, priority queue. Maximum speed and intelligence.",
    features: [
      "All 30 AI Expert Agents",
      "API access (build on Stone AI)",
      "Priority inference queue",
      "Unlimited-feel daily usage",
      "100M+ tokens/month",
      "10 concurrent requests",
      "32K token responses",
    ],
    agentCount: 30,
    envKey: "STRIPE_PRICE_PRO",
  },
];

async function main() {
  console.log("Setting up Stripe products and prices...\n");

  const priceIds: Record<string, string> = {};

  for (const plan of PLANS) {
    // Check if product already exists
    const existing = await stripe.products.search({
      query: `metadata["tier"]:"${plan.tier}"`,
    });

    let product: Stripe.Product;

    if (existing.data.length > 0) {
      product = existing.data[0];
      console.log(`  Found existing product: ${product.name} (${product.id})`);

      // Update product details
      product = await stripe.products.update(product.id, {
        name: plan.name,
        description: plan.description,
        metadata: {
          tier: plan.tier,
          agentCount: plan.agentCount.toString(),
        },
        marketing_features: plan.features.map((f) => ({ name: f })),
      });
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          tier: plan.tier,
          agentCount: plan.agentCount.toString(),
        },
        marketing_features: plan.features.map((f) => ({ name: f })),
      });
      console.log(`  Created product: ${product.name} (${product.id})`);
    }

    // Check for existing active price
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: "recurring",
    });

    let price: Stripe.Price;

    const matchingPrice = existingPrices.data.find(
      (p) => p.unit_amount === plan.price && p.recurring?.interval === "month"
    );

    if (matchingPrice) {
      price = matchingPrice;
      console.log(`  Found existing price: $${(price.unit_amount! / 100).toFixed(2)}/mo (${price.id})`);
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { tier: plan.tier },
      });
      console.log(`  Created price: $${(price.unit_amount! / 100).toFixed(2)}/mo (${price.id})`);
    }

    priceIds[plan.envKey] = price.id;
  }

  // Create upgrade coupon (15% off first month)
  console.log("\nSetting up upgrade coupon...");
  let couponId: string;

  const existingCoupons = await stripe.coupons.list({ limit: 10 });
  const existingCoupon = existingCoupons.data.find(
    (c) => c.metadata?.purpose === "stone_ai_upgrade"
  );

  if (existingCoupon) {
    couponId = existingCoupon.id;
    console.log(`  Found existing coupon: ${couponId} (${existingCoupon.percent_off}% off)`);
  } else {
    const coupon = await stripe.coupons.create({
      percent_off: 15,
      duration: "once",
      name: "Stone AI Upgrade - 15% Off",
      metadata: { purpose: "stone_ai_upgrade" },
    });
    couponId = coupon.id;
    console.log(`  Created coupon: ${couponId} (15% off first month)`);
  }

  // Update .env file
  console.log("\nUpdating .env file...");
  const envPath = path.join(process.cwd(), ".env");
  let envContent = fs.readFileSync(envPath, "utf-8");

  for (const [key, value] of Object.entries(priceIds)) {
    envContent = envContent.replace(
      new RegExp(`${key}=.*`),
      `${key}=${value}`
    );
  }

  envContent = envContent.replace(
    /STRIPE_UPGRADE_COUPON_ID=.*/,
    `STRIPE_UPGRADE_COUPON_ID=${couponId}`
  );

  fs.writeFileSync(envPath, envContent);
  console.log("  .env updated with all price IDs and coupon ID");

  // Summary
  console.log("\n=== Stripe Setup Complete ===\n");
  console.log("Products & Prices:");
  for (const plan of PLANS) {
    console.log(`  ${plan.tier.padEnd(8)} $${(plan.price / 100).toFixed(2).padStart(7)}/mo  ${priceIds[plan.envKey]}`);
  }
  console.log(`\nUpgrade Coupon: ${couponId}`);
  console.log("\nAll IDs have been written to .env");
  console.log("\nNext: Set up webhook with:");
  console.log("  stripe listen --forward-to localhost:3000/api/stripe/webhook");
}

main().catch((e) => {
  console.error("Stripe setup failed:", e.message);
  process.exit(1);
});
