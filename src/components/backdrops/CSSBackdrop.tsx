"use client";

import { useEffect, useState } from "react";
import { getPoolBackdrop } from "./backdrop-pool";

const THEME_STYLES: Record<string, { className: string; animationClass: string }> = {
  aurora: {
    className: "bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.12),transparent_50%),radial-gradient(ellipse_at_center,rgba(20,184,166,0.08),transparent_60%)]",
    animationClass: "animate-backdrop-aurora",
  },
  sunset: {
    className: "bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.10),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.08),transparent_60%)]",
    animationClass: "animate-backdrop-sunset",
  },
  ocean: {
    className: "bg-[radial-gradient(ellipse_at_bottom,rgba(6,78,158,0.18),transparent_55%),radial-gradient(ellipse_at_top_right,rgba(8,145,178,0.10),transparent_50%),radial-gradient(ellipse_at_top_left,rgba(30,64,175,0.12),transparent_60%)]",
    animationClass: "animate-backdrop-ocean",
  },
  cosmic: {
    className: "bg-[radial-gradient(ellipse_at_center,rgba(88,28,135,0.14),transparent_55%),radial-gradient(ellipse_at_top_right,rgba(67,56,202,0.10),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(219,39,119,0.06),transparent_60%)]",
    animationClass: "animate-backdrop-cosmic",
  },
  "emerald-pulse": {
    className: "bg-[radial-gradient(ellipse_at_center,rgba(5,150,105,0.12),transparent_55%),radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(20,184,166,0.10),transparent_60%)]",
    animationClass: "animate-backdrop-emerald",
  },
  "midnight-fire": {
    className: "bg-[radial-gradient(ellipse_at_bottom,rgba(153,27,27,0.14),transparent_50%),radial-gradient(ellipse_at_top_right,rgba(194,65,12,0.08),transparent_50%),radial-gradient(ellipse_at_center,rgba(120,20,20,0.06),transparent_60%)]",
    animationClass: "animate-backdrop-fire",
  },

  // ── Premium CSS Themes ─────────────────────────────────

  nebula: {
    className: "bg-[conic-gradient(from_45deg_at_40%_40%,rgba(88,28,135,0.14),transparent_25%,rgba(219,39,119,0.06),transparent_50%),radial-gradient(ellipse_at_top_left,rgba(88,28,135,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(219,39,119,0.14),transparent_50%),radial-gradient(ellipse_at_center,rgba(6,182,212,0.10),transparent_60%),radial-gradient(ellipse_at_top_right,rgba(30,64,175,0.12),transparent_55%),conic-gradient(from_200deg_at_60%_70%,rgba(219,39,119,0.08),transparent_30%,rgba(6,182,212,0.06),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(88,28,135,0.08),transparent_50%)]",
    animationClass: "animate-backdrop-nebula",
  },
  "glass-aurora": {
    className: "bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.12),transparent_55%),radial-gradient(ellipse_at_center,rgba(147,51,234,0.10),transparent_60%),conic-gradient(from_120deg_at_50%_30%,rgba(20,184,166,0.08),transparent_25%,rgba(16,185,129,0.06),transparent_50%),radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.06),transparent_55%)]",
    animationClass: "animate-backdrop-glass-aurora",
  },
  prismatic: {
    className: "bg-[conic-gradient(from_0deg_at_50%_50%,rgba(239,68,68,0.08),rgba(249,115,22,0.06),rgba(234,179,8,0.08),rgba(34,197,94,0.06),rgba(6,182,212,0.08),rgba(99,102,241,0.06),rgba(168,85,247,0.08),rgba(239,68,68,0.06)),radial-gradient(ellipse_at_top_left,rgba(239,68,68,0.10),transparent_50%),radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.10),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(234,179,8,0.08),transparent_50%),conic-gradient(from_180deg_at_30%_70%,rgba(168,85,247,0.06),transparent_25%,rgba(6,182,212,0.04),transparent_50%),radial-gradient(ellipse_at_center,rgba(249,115,22,0.06),transparent_60%)]",
    animationClass: "animate-backdrop-prismatic",
  },
};

interface CSSBackdropProps {
  theme: string;
}

export function CSSBackdrop({ theme }: CSSBackdropProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (theme.startsWith("pool-")) {
    const poolBackdrop = getPoolBackdrop(theme);
    if (!poolBackdrop) return null;
    return (
      <div
        className={`fixed inset-0 z-0 ${poolBackdrop.gradientCSS} ${reducedMotion ? "" : `animate-${poolBackdrop.animationName}`}`}
        style={{ backgroundSize: "200% 200%" }}
        aria-hidden="true"
      />
    );
  }

  const style = THEME_STYLES[theme];
  if (!style) return null;

  return (
    <div
      className={`fixed inset-0 z-0 ${style.className} ${
        reducedMotion ? "" : style.animationClass
      }`}
      aria-hidden="true"
    />
  );
}
