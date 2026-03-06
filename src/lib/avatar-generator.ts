import type { AvatarConfig } from "@/components/avatars/avatar-parts";
import {
  SHAPE_OPTIONS,
  COLOR_PALETTES,
  PATTERN_OPTIONS,
  EYES_OPTIONS,
  MOUTH_OPTIONS,
  ACCESSORY_OPTIONS,
  EXPRESSION_OPTIONS,
} from "@/components/avatars/avatar-parts";

/**
 * Deterministic avatar generation from a name string.
 * Same name always produces the same avatar configuration.
 */

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickFrom<T>(arr: readonly T[], hash: number, offset: number): T {
  return arr[((hash >>> offset) ^ (hash >>> (offset + 8))) % arr.length];
}

export function generateAvatarFromName(name: string): AvatarConfig {
  const normalized = name.trim().toLowerCase();
  const hash = hashString(normalized);

  const palette = pickFrom(COLOR_PALETTES, hash, 0);

  return {
    shape: pickFrom(SHAPE_OPTIONS, hash, 3),
    baseColor: palette.base,
    accentColor: palette.accent,
    pattern: pickFrom(PATTERN_OPTIONS, hash, 6),
    eyes: pickFrom(EYES_OPTIONS, hash, 9),
    mouth: pickFrom(MOUTH_OPTIONS, hash, 12),
    accessory: pickFrom(ACCESSORY_OPTIONS, hash, 15),
    expression: pickFrom(EXPRESSION_OPTIONS, hash, 18),
  };
}

/**
 * Generate a random avatar config (for "randomize" buttons).
 */
export function generateRandomAvatar(): AvatarConfig {
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const palette = pick(COLOR_PALETTES);

  return {
    shape: pick(SHAPE_OPTIONS),
    baseColor: palette.base,
    accentColor: palette.accent,
    pattern: pick(PATTERN_OPTIONS),
    eyes: pick(EYES_OPTIONS),
    mouth: pick(MOUTH_OPTIONS),
    accessory: pick(ACCESSORY_OPTIONS),
    expression: pick(EXPRESSION_OPTIONS),
  };
}
