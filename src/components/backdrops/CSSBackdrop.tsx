"use client";

import { useEffect, useState } from "react";

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
