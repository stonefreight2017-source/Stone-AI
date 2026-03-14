/**
 * Agent Favorites / Pinning
 *
 * Allows authenticated users to favorite/pin up to 10 agents
 * for quick access. Stored via raw SQL since the User model
 * does not have a dedicated favorites field.
 */

import { db } from "./db";

const MAX_FAVORITES = 10;

/**
 * Get the list of favorited agent IDs for a user.
 */
export async function getFavorites(userId: string): Promise<string[]> {
  const rows = await db.$queryRaw<{ agentId: string }[]>`
    SELECT "agentId" FROM "agent_favorites"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" ASC
  `;
  return rows.map((r) => r.agentId);
}

/**
 * Add an agent to the user's favorites.
 * No-op if already favorited. Throws if at max capacity.
 */
export async function addFavorite(userId: string, agentId: string): Promise<void> {
  // Check current count
  const countResult = await db.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "agent_favorites"
    WHERE "userId" = ${userId}
  `;
  const currentCount = Number(countResult[0]?.count ?? 0);

  if (currentCount >= MAX_FAVORITES) {
    throw new Error(`Maximum of ${MAX_FAVORITES} favorites allowed`);
  }

  // Upsert — ignore if already exists
  await db.$executeRaw`
    INSERT INTO "agent_favorites" ("userId", "agentId", "createdAt")
    VALUES (${userId}, ${agentId}, NOW())
    ON CONFLICT ("userId", "agentId") DO NOTHING
  `;
}

/**
 * Remove an agent from the user's favorites.
 */
export async function removeFavorite(userId: string, agentId: string): Promise<void> {
  await db.$executeRaw`
    DELETE FROM "agent_favorites"
    WHERE "userId" = ${userId} AND "agentId" = ${agentId}
  `;
}

/**
 * Check if a specific agent is favorited by a user.
 */
export async function isFavorited(userId: string, agentId: string): Promise<boolean> {
  const rows = await db.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "agent_favorites"
    WHERE "userId" = ${userId} AND "agentId" = ${agentId}
  `;
  return Number(rows[0]?.count ?? 0) > 0;
}

/*
 * ═══ DATABASE TABLE ═══
 * This feature requires the following table. Create it with a migration:
 *
 * CREATE TABLE "agent_favorites" (
 *   "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 *   "agentId"   TEXT NOT NULL REFERENCES "Agent"("id") ON DELETE CASCADE,
 *   "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 *   PRIMARY KEY ("userId", "agentId")
 * );
 *
 * CREATE INDEX "idx_agent_favorites_user" ON "agent_favorites"("userId");
 */
