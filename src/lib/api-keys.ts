import crypto from "crypto";
import { db } from "./db";

/**
 * Generate a new API key. Returns the raw key (shown once) and its hash.
 */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = "sk_stone_" + crypto.randomBytes(24).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 14) + "...";
  return { raw, hash, prefix };
}

/**
 * Hash a raw API key for lookup.
 */
export function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Authenticate a request via Bearer token.
 * Returns the user associated with the API key, or null.
 */
export async function authenticateApiKey(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const raw = authHeader.slice(7);
  if (!raw.startsWith("sk_stone_")) return null;

  const keyHash = hashApiKey(raw);

  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKey || apiKey.revokedAt) return null;

  // Update last used timestamp (fire-and-forget)
  db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return apiKey.user;
}
