export type BackdropCategory = "css" | "particles" | "vanta";

export interface BackdropPreset {
  id: string;
  name: string;
  category: BackdropCategory;
  description: string;
  previewClass: string; // Tailwind classes for settings preview thumbnail
}

export const BACKDROP_PRESETS: BackdropPreset[] = [
  // ── None (default) ──────────────────────────────────────
  {
    id: "none",
    name: "None",
    category: "css",
    description: "Default dark background",
    previewClass: "bg-zinc-950",
  },

  // ── CSS Gradient Themes ─────────────────────────────────
  {
    id: "aurora",
    name: "Aurora",
    category: "css",
    description: "Cyan and purple shifting gradient",
    previewClass: "bg-gradient-to-br from-cyan-900/60 via-purple-900/40 to-teal-900/60",
  },
  {
    id: "sunset",
    name: "Sunset",
    category: "css",
    description: "Warm orange, pink, and red gradient",
    previewClass: "bg-gradient-to-br from-orange-900/50 via-pink-900/40 to-red-900/50",
  },
  {
    id: "ocean",
    name: "Ocean",
    category: "css",
    description: "Deep blue and teal wave-like animation",
    previewClass: "bg-gradient-to-br from-blue-950/70 via-cyan-900/40 to-blue-900/60",
  },
  {
    id: "cosmic",
    name: "Cosmic",
    category: "css",
    description: "Deep purple and indigo with subtle pulse",
    previewClass: "bg-gradient-to-br from-purple-950/60 via-indigo-900/40 to-pink-900/30",
  },
  {
    id: "emerald-pulse",
    name: "Emerald Pulse",
    category: "css",
    description: "Green and emerald breathing gradient",
    previewClass: "bg-gradient-to-br from-emerald-950/60 via-green-900/40 to-teal-900/50",
  },
  {
    id: "midnight-fire",
    name: "Midnight Fire",
    category: "css",
    description: "Dark red and orange flickering effect",
    previewClass: "bg-gradient-to-br from-red-950/60 via-orange-950/40 to-zinc-950",
  },

  // ── Premium CSS Themes ─────────────────────────────────
  {
    id: "nebula",
    name: "Nebula",
    category: "css",
    description: "Multi-layered cosmic nebula — our richest CSS effect",
    previewClass: "bg-gradient-to-br from-purple-950/60 via-pink-900/30 to-cyan-950/40",
  },
  {
    id: "glass-aurora",
    name: "Glass Aurora",
    category: "css",
    description: "Aurora borealis with glass morphism depth",
    previewClass: "bg-gradient-to-br from-emerald-950/50 via-cyan-900/30 to-purple-950/40",
  },
  {
    id: "prismatic",
    name: "Prismatic",
    category: "css",
    description: "Slow-shifting holographic rainbow mesh",
    previewClass: "bg-gradient-to-br from-red-950/30 via-yellow-900/20 to-blue-950/30",
  },

  // ── Particle Themes (placeholder — built by another agent) ──
  {
    id: "stars",
    name: "Stars",
    category: "particles",
    description: "Floating star particles on dark sky",
    previewClass: "bg-gradient-to-b from-zinc-950 via-indigo-950/30 to-zinc-950",
  },
  {
    id: "network",
    name: "Network",
    category: "particles",
    description: "Connected nodes forming a network",
    previewClass: "bg-gradient-to-br from-zinc-950 via-cyan-950/20 to-zinc-950",
  },
  {
    id: "fireflies",
    name: "Fireflies",
    category: "particles",
    description: "Warm glowing firefly particles",
    previewClass: "bg-gradient-to-b from-zinc-950 via-amber-950/20 to-zinc-950",
  },
  {
    id: "aurora-stream",
    name: "Aurora Stream",
    category: "particles",
    description: "Flowing aurora particle streams",
    previewClass: "bg-gradient-to-b from-zinc-950 via-emerald-950/20 to-zinc-950",
  },

  // ── Vanta 3D Themes (placeholder — built by another agent) ──
  {
    id: "vanta-waves",
    name: "Waves",
    category: "vanta",
    description: "Animated 3D wave surface",
    previewClass: "bg-gradient-to-br from-blue-950/50 via-zinc-950 to-cyan-950/40",
  },
  {
    id: "vanta-birds",
    name: "Birds",
    category: "vanta",
    description: "Flocking bird simulation",
    previewClass: "bg-gradient-to-br from-zinc-950 via-sky-950/20 to-zinc-950",
  },
  {
    id: "vanta-fog",
    name: "Fog",
    category: "vanta",
    description: "Volumetric fog effect",
    previewClass: "bg-gradient-to-br from-zinc-900/80 via-slate-900/60 to-zinc-950",
  },
  {
    id: "vanta-net",
    name: "Net",
    category: "vanta",
    description: "3D connected network mesh",
    previewClass: "bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950",
  },
];

export const CSS_THEME_IDS = BACKDROP_PRESETS.filter(
  (p) => p.category === "css" && p.id !== "none"
).map((p) => p.id);

export const PARTICLE_THEME_IDS = BACKDROP_PRESETS.filter(
  (p) => p.category === "particles"
).map((p) => p.id);

export const VANTA_THEME_IDS = BACKDROP_PRESETS.filter(
  (p) => p.category === "vanta"
).map((p) => p.id);

export function getPreset(id: string): BackdropPreset | undefined {
  return BACKDROP_PRESETS.find((p) => p.id === id);
}

export function getCategory(id: string): BackdropCategory | null {
  const preset = getPreset(id);
  if (preset) return preset.category;
  if (isPoolBackdrop(id)) return "css";
  return null;
}

import { BACKDROP_POOL } from "./backdrop-pool";

export function isPoolBackdrop(id: string): boolean {
  return id.startsWith("pool-") && BACKDROP_POOL.some(b => b.id === id);
}
