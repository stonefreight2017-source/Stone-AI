import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { shouldAwardGoldenEgg } from "./badges";
import type { User } from "@/generated/prisma/client";

/**
 * Get or create the DB user from the current Clerk session.
 * This is the canonical way to get the current user in any API route.
 * Upserts by clerkId so the DB user is always in sync with Clerk.
 */
export async function getOrCreateUser(): Promise<User> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("User has no email address");
  }

  const user = await db.user.upsert({
    where: { clerkId: userId },
    update: {
      email,
      name: clerkUser.firstName
        ? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ""}`
        : undefined,
    },
    create: {
      clerkId: userId,
      email,
      name: clerkUser.firstName
        ? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ""}`
        : null,
    },
  });

  // Auto-expire free trial: revert to FREE if trial has ended and no active subscription
  if (
    user.freeTrialEndsAt &&
    user.freeTrialEndsAt < new Date() &&
    user.subscriptionStatus !== "ACTIVE" &&
    user.tier !== "FREE"
  ) {
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        tier: "FREE",
        freeTrialTier: null,
        freeTrialEndsAt: null,
      },
    });
    return updated;
  }

  // Auto-award Golden Egg badge: 365+ days on promo price and still active
  if (shouldAwardGoldenEgg(user)) {
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        badges: { push: "golden-egg" },
      },
    });
    return updated;
  }

  return user;
}

/**
 * Quick auth check — just returns the userId or throws.
 * Use when you don't need the full DB user object.
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
