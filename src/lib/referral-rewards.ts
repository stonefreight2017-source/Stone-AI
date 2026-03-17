/**
 * ═══════════════════════════════════════════
 * REFERRAL REWARD DISTRIBUTION
 * ═══════════════════════════════════════════
 *
 * When a referred user subscribes to ANY paid tier and stays for 30 days,
 * the REFERRER receives bonus SMART credits based on their own tier.
 *
 * Referrer Tier → Base Reward × Multiplier = Total Credits
 * ─────────────────────────────────────────────────────────
 * FREE         →  5  × 1.0 =   5
 * STARTER      → 10  × 1.0 =  10
 * PLUS         → 15  × 1.0 =  15
 * SMART        → 20  × 1.5 =  30
 * PRO          → 25  × 2.0 =  50
 * ENTERPRISE   → 50  × 2.0 = 100
 *
 * Credits are added to `smartCreditsBonus` on the User model.
 */

import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import type { Tier } from "@/lib/tier-config";

// ─── Reward table ────────────────────────────────────────────────────────────

interface ReferralRewardConfig {
  base: number;
  multiplier: number;
}

export const REFERRAL_REWARDS: Record<Tier, ReferralRewardConfig> = {
  FREE:       { base:  5, multiplier: 1.0 },
  STARTER:    { base: 10, multiplier: 1.0 },
  PLUS:       { base: 15, multiplier: 1.0 },
  SMART:      { base: 20, multiplier: 1.5 },
  PRO:        { base: 25, multiplier: 2.0 },
  ENTERPRISE: { base: 50, multiplier: 2.0 },
};

/**
 * Calculate the credit reward for a referrer based on their tier.
 */
export function calculateReferralReward(referrerTier: Tier): number {
  const config = REFERRAL_REWARDS[referrerTier];
  return Math.floor(config.base * config.multiplier);
}

/**
 * Process a referral reward: grant SMART credits to the referrer.
 *
 * Prerequisites:
 *   - Referral status must be QUALIFIED (referred user subscribed to a paid tier)
 *   - The referred user's subscription must have been active for 30+ days
 *     (caller is responsible for this check before invoking)
 *
 * Steps:
 *   1. Load referral — verify status is QUALIFIED
 *   2. Load referrer — determine their tier
 *   3. Calculate reward credits
 *   4. Increment referrer's smartCreditsBonus
 *   5. Update referral status to REWARDED with reward metadata
 *   6. Create a notification for the referrer
 *   7. Audit log the event
 *
 * @returns The number of credits awarded, or 0 if the referral was ineligible.
 */
export async function processReferralReward(referralId: string): Promise<number> {
  // 1. Load referral and verify eligibility
  const referral = await db.referral.findUnique({
    where: { id: referralId },
    include: {
      referrer: { select: { id: true, tier: true, name: true } },
      referredUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (!referral) {
    console.warn(`[referral-rewards] Referral ${referralId} not found`);
    return 0;
  }

  if (referral.status !== "QUALIFIED") {
    console.warn(
      `[referral-rewards] Referral ${referralId} status is ${referral.status}, expected QUALIFIED`
    );
    return 0;
  }

  // 2. Determine referrer's tier and calculate reward
  const referrerTier = referral.referrer.tier as Tier;
  const credits = calculateReferralReward(referrerTier);

  if (credits <= 0) {
    return 0;
  }

  // 3–6. Atomic transaction: credit the referrer, update referral, create notification
  await db.$transaction([
    // 3–4. Increment referrer's bonus credits
    db.user.update({
      where: { id: referral.referrer.id },
      data: {
        smartCreditsBonus: { increment: credits },
      },
    }),

    // 5. Mark referral as REWARDED
    db.referral.update({
      where: { id: referralId },
      data: {
        status: "REWARDED",
        rewardType: "smart_credits",
        rewardAmount: credits,
        rewardedAt: new Date(),
      },
    }),

    // 6. Notify the referrer
    db.notification.create({
      data: {
        userId: referral.referrer.id,
        type: "referral_reward",
        title: "Referral Reward Earned!",
        body: `You earned ${credits} bonus SMART credits because your referral stayed subscribed for 30 days!`,
        href: "/app/settings",
      },
    }),
  ]);

  // 7. Audit
  logAuditEvent({
    event: "admin.action",
    userId: referral.referrer.id,
    metadata: {
      action: "referral_reward_granted",
      referralId,
      referrerId: referral.referrer.id,
      referredUserId: referral.referredUser.id,
      referrerTier,
      creditsAwarded: credits,
    },
  });

  return credits;
}

/**
 * Check all QUALIFIED referrals for a given referred user and process rewards
 * if the user's subscription has been active for 30+ days.
 *
 * Called from the Stripe webhook on subscription.updated events.
 *
 * @param referredUserId - The user ID of the referred user
 * @param subscriptionCreatedAt - The subscription creation date (Unix timestamp or Date)
 */
export async function checkAndProcessReferralRewards(
  referredUserId: string,
  subscriptionCreatedAt: Date
): Promise<void> {
  // Check 30-day threshold
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const elapsed = now.getTime() - subscriptionCreatedAt.getTime();

  if (elapsed < thirtyDaysMs) {
    return; // Not yet 30 days
  }

  // Find QUALIFIED referrals for this referred user
  const qualifiedReferrals = await db.referral.findMany({
    where: {
      referredUserId,
      status: "QUALIFIED",
    },
  });

  for (const referral of qualifiedReferrals) {
    await processReferralReward(referral.id);
  }
}
