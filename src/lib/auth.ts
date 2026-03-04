import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
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
