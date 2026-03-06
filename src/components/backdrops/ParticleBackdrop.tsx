"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { particleConfigs, type ParticleTheme } from "./particleConfigs";
import type { ISourceOptions } from "@tsparticles/engine";

interface ParticleBackdropProps {
  theme: ParticleTheme;
}

/** Deep-clone a config and scale particle counts for mobile. */
function scaleForMobile(
  config: ISourceOptions,
  isMobile: boolean
): ISourceOptions {
  if (!isMobile) return config;

  const cloned = JSON.parse(JSON.stringify(config)) as ISourceOptions;
  const particles = cloned.particles as Record<string, unknown> | undefined;
  if (particles?.number && typeof particles.number === "object") {
    const num = particles.number as Record<string, unknown>;
    if (typeof num.value === "number") {
      num.value = Math.round(num.value * 0.4);
    }
  }
  return cloned;
}

/** Disable all movement for users who prefer reduced motion. */
function applyReducedMotion(config: ISourceOptions): ISourceOptions {
  const cloned = JSON.parse(JSON.stringify(config)) as ISourceOptions;
  const particles = cloned.particles as Record<string, unknown> | undefined;

  if (particles?.move && typeof particles.move === "object") {
    (particles.move as Record<string, unknown>).enable = false;
  }
  if (particles?.opacity && typeof particles.opacity === "object") {
    const op = particles.opacity as Record<string, unknown>;
    if (op.animation && typeof op.animation === "object") {
      (op.animation as Record<string, unknown>).enable = false;
    }
  }
  if (particles?.size && typeof particles.size === "object") {
    const sz = particles.size as Record<string, unknown>;
    if (sz.animation && typeof sz.animation === "object") {
      (sz.animation as Record<string, unknown>).enable = false;
    }
  }
  if (particles?.wobble && typeof particles.wobble === "object") {
    (particles.wobble as Record<string, unknown>).enable = false;
  }

  // Disable hover interactivity
  const interactivity = cloned.interactivity as
    | Record<string, unknown>
    | undefined;
  if (interactivity?.events && typeof interactivity.events === "object") {
    const events = interactivity.events as Record<string, unknown>;
    if (events.onHover && typeof events.onHover === "object") {
      (events.onHover as Record<string, unknown>).enable = false;
    }
  }

  return cloned;
}

export default function ParticleBackdrop({ theme }: ParticleBackdropProps) {
  const [engineReady, setEngineReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Initialize the tsparticles engine once
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setEngineReady(true));
  }, []);

  // Detect mobile and reduced-motion preferences
  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setIsMobile(mobileQuery.matches);
    setReducedMotion(motionQuery.matches);

    const handleMobile = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    const handleMotion = (e: MediaQueryListEvent) =>
      setReducedMotion(e.matches);

    mobileQuery.addEventListener("change", handleMobile);
    motionQuery.addEventListener("change", handleMotion);

    return () => {
      mobileQuery.removeEventListener("change", handleMobile);
      motionQuery.removeEventListener("change", handleMotion);
    };
  }, []);

  const options = useMemo(() => {
    const baseTheme = (theme in particleConfigs ? theme : "stars") as ParticleTheme;
    let config = particleConfigs[baseTheme];
    config = scaleForMobile(config, isMobile);
    if (reducedMotion) {
      config = applyReducedMotion(config);
    }
    return config;
  }, [theme, isMobile, reducedMotion]);

  if (!engineReady) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    >
      <Particles
        id={`tsparticles-${theme}`}
        options={options}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
