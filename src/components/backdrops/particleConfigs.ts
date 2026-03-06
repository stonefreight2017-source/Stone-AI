import type { ISourceOptions } from "@tsparticles/engine";

/**
 * Particle theme configurations for ParticleBackdrop.
 * Each config is designed to be subtle and professional — low opacity, slow movement.
 * Desktop particle counts are listed; mobile gets ~40% of these values.
 */

const stars: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  particles: {
    number: { value: 120, density: { enable: true } },
    color: { value: "#ffffff" },
    opacity: {
      value: { min: 0.15, max: 0.45 },
      animation: {
        enable: true,
        speed: 0.4,
        sync: false,
      },
    },
    size: {
      value: { min: 1, max: 2.5 },
    },
    move: {
      enable: true,
      speed: 0.3,
      direction: "none",
      random: true,
      straight: false,
      outModes: { default: "out" },
    },
    links: { enable: false },
  },
  detectRetina: true,
};

const network: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  particles: {
    number: { value: 80, density: { enable: true } },
    color: { value: "#22d3ee" },
    opacity: { value: 0.35 },
    size: { value: { min: 1.5, max: 3 } },
    move: {
      enable: true,
      speed: 0.6,
      direction: "none",
      random: false,
      straight: false,
      outModes: { default: "bounce" },
    },
    links: {
      enable: true,
      distance: 140,
      color: "#0d9488",
      opacity: 0.2,
      width: 1,
    },
  },
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "repulse",
      },
    },
    modes: {
      repulse: {
        distance: 120,
        duration: 0.4,
        speed: 0.5,
      },
    },
  },
  detectRetina: true,
};

const fireflies: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: ["#f59e0b", "#d97706", "#fbbf24"] },
    opacity: {
      value: { min: 0.15, max: 0.5 },
      animation: {
        enable: true,
        speed: 0.6,
        sync: false,
      },
    },
    size: {
      value: { min: 1.5, max: 4 },
      animation: {
        enable: true,
        speed: 1.5,
        sync: false,
      },
    },
    move: {
      enable: true,
      speed: 0.5,
      direction: "none",
      random: true,
      straight: false,
      outModes: { default: "out" },
      path: {
        enable: false,
      },
    },
    links: { enable: false },
    shadow: {
      enable: true,
      color: "#f59e0b",
      blur: 8,
    },
  },
  detectRetina: true,
};

const auroraStream: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  particles: {
    number: { value: 90, density: { enable: true } },
    color: { value: ["#22d3ee", "#a855f7", "#10b981"] },
    opacity: {
      value: { min: 0.15, max: 0.4 },
      animation: {
        enable: true,
        speed: 0.3,
        sync: false,
      },
    },
    size: {
      value: { min: 2, max: 5 },
      animation: {
        enable: true,
        speed: 1,
        sync: false,
      },
    },
    move: {
      enable: true,
      speed: 1.2,
      direction: "right",
      random: false,
      straight: false,
      outModes: { default: "out" },
      gravity: {
        enable: true,
        acceleration: 0,
      },
      drift: 0,
      trail: {
        enable: false,
      },
    },
    wobble: {
      enable: true,
      distance: 15,
      speed: { min: -2, max: 2 },
    },
    links: { enable: false },
  },
  detectRetina: true,
};

export type ParticleTheme = "stars" | "network" | "fireflies" | "aurora-stream";

export const particleConfigs: Record<ParticleTheme, ISourceOptions> = {
  stars,
  network,
  fireflies,
  "aurora-stream": auroraStream,
};
