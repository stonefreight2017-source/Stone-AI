"use client";

import dynamic from "next/dynamic";
import { getCategory } from "./backdrop-presets";
import { CSSBackdrop } from "./CSSBackdrop";
import type { ParticleTheme } from "./particleConfigs";
import type { VantaTheme } from "./VantaBackdrop";

// Lazy-load particle and vanta backdrops
const ParticleBackdrop = dynamic(
  () => import("./ParticleBackdrop"),
  { ssr: false }
);

const VantaBackdrop = dynamic(
  () => import("./VantaBackdrop"),
  { ssr: false }
);

interface BackdropManagerProps {
  theme: string;
}

/**
 * Strips the "vanta-" prefix from preset IDs to match VantaBackdrop's expected theme names.
 * Preset IDs: "vanta-waves" -> VantaTheme: "waves"
 */
function toVantaTheme(id: string): VantaTheme {
  return id.replace("vanta-", "") as VantaTheme;
}

export function BackdropManager({ theme }: BackdropManagerProps) {
  if (!theme || theme === "none") return null;

  const category = getCategory(theme);

  switch (category) {
    case "css":
      return <CSSBackdrop theme={theme} />;
    case "particles":
      return <ParticleBackdrop theme={theme as ParticleTheme} />;
    case "vanta":
      return <VantaBackdrop theme={toVantaTheme(theme)} />;
    default:
      return null;
  }
}
