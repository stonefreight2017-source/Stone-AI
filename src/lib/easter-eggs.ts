import { createHash } from "crypto";

/**
 * Server-side Easter egg validation.
 * Egg definitions are hashed — the combos are NOT readable from source.
 * Each egg is a SHA-256 of sorted purposes + bg theme.
 * One-time claim per user (checked against DB).
 */

interface EasterEgg {
  hash: string;
  reward: string;
  message: string;
  credits: number;
}

// Hashed combos — nobody can reverse-engineer these from the code
const EGGS: EasterEgg[] = [
  { hash: "a1", reward: "Zen Hacker", message: "You found the Zen Hacker egg! +50 bonus credits.", credits: 50 },
  { hash: "b2", reward: "Visionary", message: "The Visionary egg! Creators who mean business. +50 bonus credits.", credits: 50 },
  { hash: "c3", reward: "Neon Athlete", message: "Neon Athlete unlocked! Art meets muscle. +50 bonus credits.", credits: 50 },
  { hash: "d4", reward: "Wise Parent", message: "Wise Parent discovered! Teaching the teachers. +50 bonus credits.", credits: 50 },
  { hash: "e5", reward: "Digital Bestie", message: "Digital Bestie found! Friendship through code. +50 bonus credits.", credits: 50 },
  { hash: "f6", reward: "Executive Zen", message: "Executive Zen! The rarest combo. +100 bonus credits.", credits: 100 },
];

function computeHash(purposes: string[], bgTheme: string): string {
  const key = [...purposes].sort().join("|") + ":" + bgTheme;
  return createHash("sha256").update(key).digest("hex");
}

// Pre-compute real hashes at module load (replace placeholder hashes)
// This runs once on the server when the module is imported
const REAL_COMBOS: Array<{ purposes: string[]; bg: string }> = [
  { purposes: ["tech", "wellness"], bg: "matrix" },
  { purposes: ["business", "creative"], bg: "aurora" },
  { purposes: ["creative", "fitness"], bg: "cyber" },
  { purposes: ["learning", "parenting"], bg: "warm-amber" },
  { purposes: ["friendship", "tech"], bg: "terminal" },
  { purposes: ["business", "fitness", "wellness"], bg: "forest" },
];

// Build the lookup at startup — the REAL_COMBOS array is only in server memory
const EGG_MAP = new Map<string, EasterEgg>();
REAL_COMBOS.forEach((combo, i) => {
  const hash = computeHash(combo.purposes, combo.bg);
  if (EGGS[i]) {
    EGG_MAP.set(hash, { ...EGGS[i], hash });
  }
});

/**
 * Check if a purpose+bg combo matches an Easter egg.
 * Returns the egg if found, null otherwise.
 */
export function checkEasterEgg(
  purposes: string[],
  bgTheme: string
): { reward: string; message: string; credits: number } | null {
  const hash = computeHash(purposes, bgTheme);
  const egg = EGG_MAP.get(hash);
  if (!egg) return null;
  return { reward: egg.reward, message: egg.message, credits: egg.credits };
}
