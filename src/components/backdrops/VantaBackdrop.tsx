"use client";

import { useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Vanta.js 3D animated backdrop                                             */
/*  - Client-only (useEffect init, no SSR)                                    */
/*  - Disables on mobile (<768px) and prefers-reduced-motion                  */
/*  - Auto-destroys WebGL context on unmount                                  */
/* -------------------------------------------------------------------------- */

export type VantaTheme = "waves" | "birds" | "fog" | "net";

interface VantaBackdropProps {
  /** Accepts either "waves" or "vanta-waves" format */
  theme: string;
}

/** Strip optional "vanta-" prefix to get the raw Vanta theme key */
function resolveTheme(theme: string): VantaTheme {
  const key = theme.replace(/^vanta-/, "") as VantaTheme;
  if (!["waves", "birds", "fog", "net"].includes(key)) {
    return "waves"; // safe fallback
  }
  return key;
}

/* ── Theme configs ───────────────────────────────────────────────────────── */

function getThemeConfig(theme: VantaTheme, el: HTMLElement, THREE: unknown) {
  const base = { el, THREE, mouseControls: false, touchControls: false, gyroControls: false };

  switch (theme) {
    case "waves":
      return {
        ...base,
        color: 0x0a1628,
        shininess: 15,
        waveHeight: 8,
        waveSpeed: 0.4,
        zoom: 0.85,
        mouseControls: true,
      };
    case "birds":
      return {
        ...base,
        backgroundColor: 0x0a0f1a,
        color1: 0x00bcd4,
        color2: 0xe0e0e0,
        quantity: 3,
        birdSize: 1.2,
        wingSpan: 20,
        speedLimit: 2,
        separation: 60,
        alignment: 40,
        cohesion: 40,
      };
    case "fog":
      return {
        ...base,
        highlightColor: 0x1a1a2e,
        midtoneColor: 0x111111,
        lowlightColor: 0x0d0d0d,
        baseColor: 0x0d0d0d,
        blurFactor: 0.7,
        speed: 0.4,
        zoom: 0.6,
      };
    case "net":
      return {
        ...base,
        color: 0x00bcd4,
        backgroundColor: 0x09101a,
        points: 6,
        maxDistance: 22,
        spacing: 18,
        showDots: true,
        mouseControls: true,
      };
  }
}

/* ── Lazy loaders for each Vanta effect ──────────────────────────────────── */

type VantaInit = (opts: Record<string, unknown>) => { destroy: () => void };

async function loadVantaEffect(theme: VantaTheme): Promise<VantaInit> {
  switch (theme) {
    case "waves": {
      const mod = await import("vanta/dist/vanta.waves.min");
      return mod.default as VantaInit;
    }
    case "birds": {
      const mod = await import("vanta/dist/vanta.birds.min");
      return mod.default as VantaInit;
    }
    case "fog": {
      const mod = await import("vanta/dist/vanta.fog.min");
      return mod.default as VantaInit;
    }
    case "net": {
      const mod = await import("vanta/dist/vanta.net.min");
      return mod.default as VantaInit;
    }
  }
}

/* ── Component ───────────────────────────────────────────────────────────── */

function VantaBackdrop({ theme: rawTheme }: VantaBackdropProps) {
  const theme = resolveTheme(rawTheme);
  const containerRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<{ destroy: () => void } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  /* Detect mobile + reduced-motion on mount */
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setPrefersReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  /* Initialize / tear down Vanta */
  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;
    if (!containerRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const THREE = await import("three");
        const initEffect = await loadVantaEffect(theme);

        if (cancelled || !containerRef.current) return;

        // Destroy previous effect if theme changed
        if (vantaRef.current) {
          vantaRef.current.destroy();
          vantaRef.current = null;
        }

        const config = getThemeConfig(theme, containerRef.current, THREE);
        vantaRef.current = initEffect(config as Record<string, unknown>);
      } catch (err) {
        console.warn("[VantaBackdrop] Failed to initialize:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (vantaRef.current) {
        vantaRef.current.destroy();
        vantaRef.current = null;
      }
    };
  }, [theme, isMobile, prefersReducedMotion]);

  /* Mobile / reduced-motion fallback: subtle CSS gradient */
  if (isMobile || prefersReducedMotion) {
    return (
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(10,22,40,0.5) 0%, transparent 60%), #09090b",
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

export default VantaBackdrop;
