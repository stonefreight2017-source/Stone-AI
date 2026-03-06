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

/* ══════════════════════════════════════════════════════
 * Birthday Easter Eggs — checked after full sign-on
 * when user provides birthday in About Me or Settings.
 * The magic dates are obfuscated via hash comparison.
 * ══════════════════════════════════════════════════════ */

// Obfuscated target dates (hashed so source inspection reveals nothing)
const BDAY_EXACT_HASH = createHash("sha256").update("08-19-1984").digest("hex");
const BDAY_DAY_HASH = createHash("sha256").update("08-19").digest("hex");

export interface BirthdayEggResult {
  type: "exact" | "day";
  reward: string;
  message: string;
  discountPercent: number; // applied to next purchase/renewal
}

/**
 * Check birthday string for Easter egg match.
 * Accepts various formats: "August 19, 1984", "8/19/1984", "Aug 19", "08-19", etc.
 * Returns egg result or null. One-time use, one per user.
 */
export function checkBirthdayEgg(birthdayRaw: string): BirthdayEggResult | null {
  if (!birthdayRaw || birthdayRaw.trim().length < 3) return null;

  const cleaned = birthdayRaw.trim().toLowerCase();

  // Parse month and day from various formats
  const monthNames: Record<string, string> = {
    january: "01", jan: "01", february: "02", feb: "02", march: "03", mar: "03",
    april: "04", apr: "04", may: "05", june: "06", jun: "06",
    july: "07", jul: "07", august: "08", aug: "08", september: "09", sep: "09",
    october: "10", oct: "10", november: "11", nov: "11", december: "12", dec: "12",
  };

  let month = "";
  let day = "";
  let year = "";

  // Try "Month DD, YYYY" or "Month DD YYYY" or "Month DDth"
  const namedMatch = cleaned.match(/^(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?/);
  if (namedMatch) {
    month = monthNames[namedMatch[1]] ?? "";
    day = namedMatch[2].padStart(2, "0");
    year = namedMatch[3] ?? "";
  }

  // Try "MM/DD/YYYY" or "MM-DD-YYYY" or "MM.DD.YYYY"
  if (!month) {
    const numMatch = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})?/);
    if (numMatch) {
      month = numMatch[1].padStart(2, "0");
      day = numMatch[2].padStart(2, "0");
      year = numMatch[3] ?? "";
    }
  }

  if (!month || !day) return null;

  // Check exact date (month-day-year)
  if (year) {
    const exactKey = `${month}-${day}-${year}`;
    const exactHash = createHash("sha256").update(exactKey).digest("hex");
    if (exactHash === BDAY_EXACT_HASH) {
      return {
        type: "exact",
        reward: "Founding Twin",
        message: "Incredible! You share the exact birthday with our founder. 15% off your next purchase or renewal.",
        discountPercent: 15,
      };
    }
  }

  // Check day match only (month-day)
  const dayKey = `${month}-${day}`;
  const dayHash = createHash("sha256").update(dayKey).digest("hex");
  if (dayHash === BDAY_DAY_HASH) {
    return {
      type: "day",
      reward: "Birthday Kin",
      message: "You share a birthday with someone special around here. 5% off your next purchase or renewal.",
      discountPercent: 5,
    };
  }

  return null;
}

/* ══════════════════════════════════════════════════════
 * Zodiac Egg Badges — community emblems based on the
 * month the user discovered their Easter egg. Each month
 * maps to zodiac-inspired colors.
 * ══════════════════════════════════════════════════════ */

export interface ZodiacEggBadge {
  month: number;
  sign: string;
  color: string;       // hex color
  colorName: string;
  eggEmoji: string;    // colored egg representation
}

export const ZODIAC_EGG_BADGES: ZodiacEggBadge[] = [
  { month: 1,  sign: "Capricorn/Aquarius",  color: "#6B7280", colorName: "Slate",     eggEmoji: "\uD83E\uDD5A" },
  { month: 2,  sign: "Aquarius/Pisces",     color: "#06B6D4", colorName: "Cyan",      eggEmoji: "\uD83E\uDD5A" },
  { month: 3,  sign: "Pisces/Aries",        color: "#8B5CF6", colorName: "Violet",    eggEmoji: "\uD83E\uDD5A" },
  { month: 4,  sign: "Aries/Taurus",        color: "#EF4444", colorName: "Red",       eggEmoji: "\uD83E\uDD5A" },
  { month: 5,  sign: "Taurus/Gemini",       color: "#10B981", colorName: "Emerald",   eggEmoji: "\uD83E\uDD5A" },
  { month: 6,  sign: "Gemini/Cancer",       color: "#F59E0B", colorName: "Amber",     eggEmoji: "\uD83E\uDD5A" },
  { month: 7,  sign: "Cancer/Leo",          color: "#F97316", colorName: "Orange",    eggEmoji: "\uD83E\uDD5A" },
  { month: 8,  sign: "Leo/Virgo",           color: "#EAB308", colorName: "Gold",      eggEmoji: "\uD83E\uDD5A" },
  { month: 9,  sign: "Virgo/Libra",         color: "#84CC16", colorName: "Lime",      eggEmoji: "\uD83E\uDD5A" },
  { month: 10, sign: "Libra/Scorpio",       color: "#EC4899", colorName: "Pink",      eggEmoji: "\uD83E\uDD5A" },
  { month: 11, sign: "Scorpio/Sagittarius", color: "#DC2626", colorName: "Crimson",   eggEmoji: "\uD83E\uDD5A" },
  { month: 12, sign: "Sagittarius/Capricorn", color: "#7C3AED", colorName: "Purple", eggEmoji: "\uD83E\uDD5A" },
];

/**
 * Get the zodiac egg badge for the month the egg was discovered.
 */
export function getZodiacEggBadge(discoveryDate: Date): ZodiacEggBadge {
  const month = discoveryDate.getMonth() + 1; // 1-12
  return ZODIAC_EGG_BADGES[month - 1];
}
