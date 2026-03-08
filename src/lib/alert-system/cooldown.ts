/**
 * In-memory cooldown tracker for alert deduplication.
 * Prevents the same alert type from the same agent flooding the inbox.
 *
 * NOTE: This is per-instance (serverless). For cross-instance dedup,
 * migrate to Redis keys (same pattern as rate-limiter.ts).
 */

const cooldowns = new Map<string, number>();

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, expiresAt] of cooldowns) {
    if (now >= expiresAt) cooldowns.delete(key);
  }
}, 10 * 60_000);

function makeKey(agent: string, alertType: string): string {
  return `alert-cd:${agent}:${alertType}`;
}

/**
 * Returns true if the alert is ON cooldown (should be suppressed).
 */
export function checkCooldown(agent: string, alertType: string): boolean {
  const key = makeKey(agent, alertType);
  const expiresAt = cooldowns.get(key);
  if (!expiresAt) return false;
  if (Date.now() >= expiresAt) {
    cooldowns.delete(key);
    return false;
  }
  return true;
}

/**
 * Set a cooldown for this agent+alertType combo.
 * @param cooldownMs - How long to suppress duplicates (default: 5 minutes)
 */
export function setCooldown(
  agent: string,
  alertType: string,
  cooldownMs: number = 5 * 60_000
): void {
  const key = makeKey(agent, alertType);
  cooldowns.set(key, Date.now() + cooldownMs);
}
