/**
 * SVG Avatar Parts — Modular avatar configuration system
 *
 * Zero-cost, zero-dependency avatar system using pure SVG + CSS.
 * Each property maps to SVG elements that compose a stylized character face.
 */

// ── Configuration interface ──

export interface AvatarConfig {
  shape: "circle" | "square" | "hex" | "diamond";
  baseColor: string;
  accentColor: string;
  pattern: "solid" | "gradient" | "dots" | "stripes" | "waves" | "circuit" | "geo";
  eyes: "friendly" | "cool" | "wink" | "stars" | "hearts" | "focus" | "sleepy" | "fierce";
  mouth: "smile" | "grin" | "neutral" | "smirk" | "open" | "cat" | "tongue";
  accessory: "none" | "glasses" | "sunglasses" | "crown" | "halo" | "horns" | "headphones" | "bow" | "hat" | "beanie";
  expression: "happy" | "confident" | "chill" | "excited" | "mysterious" | "warm";
}

// ── Option arrays ──

export const SHAPE_OPTIONS = ["circle", "square", "hex", "diamond"] as const;

export const COLOR_PALETTES: { name: string; base: string; accent: string }[] = [
  { name: "Ocean", base: "#0891b2", accent: "#06b6d4" },
  { name: "Sunset", base: "#ea580c", accent: "#f97316" },
  { name: "Forest", base: "#059669", accent: "#10b981" },
  { name: "Royal", base: "#7c3aed", accent: "#a78bfa" },
  { name: "Rose", base: "#e11d48", accent: "#fb7185" },
  { name: "Gold", base: "#ca8a04", accent: "#eab308" },
  { name: "Storm", base: "#475569", accent: "#94a3b8" },
  { name: "Neon", base: "#d946ef", accent: "#22d3ee" },
  { name: "Earth", base: "#92400e", accent: "#d97706" },
  { name: "Arctic", base: "#0284c7", accent: "#bae6fd" },
  { name: "Ember", base: "#dc2626", accent: "#fbbf24" },
  { name: "Mint", base: "#0d9488", accent: "#5eead4" },
];

export const EYES_OPTIONS = ["friendly", "cool", "wink", "stars", "hearts", "focus", "sleepy", "fierce"] as const;
export const MOUTH_OPTIONS = ["smile", "grin", "neutral", "smirk", "open", "cat", "tongue"] as const;
export const ACCESSORY_OPTIONS = ["none", "glasses", "sunglasses", "crown", "halo", "horns", "headphones", "bow", "hat", "beanie"] as const;
export const PATTERN_OPTIONS = ["solid", "gradient", "dots", "stripes", "waves", "circuit", "geo"] as const;
export const EXPRESSION_OPTIONS = ["happy", "confident", "chill", "excited", "mysterious", "warm"] as const;

// ── Default config ──

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  shape: "circle",
  baseColor: "#7c3aed",
  accentColor: "#a78bfa",
  pattern: "gradient",
  eyes: "friendly",
  mouth: "smile",
  accessory: "none",
  expression: "happy",
};
