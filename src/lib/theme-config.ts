"use client";

// ---------------------------------------------------------------------------
// Theme configuration for Stone AI
//
// Built on top of the existing `next-themes` dependency (v0.4.6).
// The root layout already ships a hardcoded `dark` class — this module adds
// proper light / dark / system toggling while keeping full compatibility
// with Tailwind's `dark:` variant and Clerk's dark theme.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThemePreference = "light" | "dark" | "system";

export interface ThemeColors {
  /** Page / app background */
  background: string;
  /** Default text color */
  foreground: string;
  /** Card / panel background */
  card: string;
  /** Card text */
  cardForeground: string;
  /** Primary brand color */
  primary: string;
  /** Text on primary surfaces */
  primaryForeground: string;
  /** Secondary surfaces */
  secondary: string;
  /** Text on secondary surfaces */
  secondaryForeground: string;
  /** Muted / disabled surfaces */
  muted: string;
  /** Muted text */
  mutedForeground: string;
  /** Borders */
  border: string;
  /** Input field borders */
  input: string;
  /** Focus ring color */
  ring: string;
  /** Destructive / error */
  destructive: string;
  /** Text on destructive surfaces */
  destructiveForeground: string;
}

// ---------------------------------------------------------------------------
// Color palettes — maps to CSS variables consumed by shadcn/ui + Tailwind
// ---------------------------------------------------------------------------

export const DARK_THEME: ThemeColors = {
  background: "09 09 11",           // zinc-950
  foreground: "250 250 250",        // zinc-50
  card: "24 24 27",                 // zinc-900
  cardForeground: "250 250 250",    // zinc-50
  primary: "250 250 250",           // zinc-50
  primaryForeground: "24 24 27",    // zinc-900
  secondary: "39 39 42",            // zinc-800
  secondaryForeground: "250 250 250",
  muted: "39 39 42",               // zinc-800
  mutedForeground: "161 161 170",   // zinc-400
  border: "39 39 42",              // zinc-800
  input: "39 39 42",
  ring: "212 212 216",             // zinc-300
  destructive: "127 29 29",        // red-900
  destructiveForeground: "250 250 250",
};

export const LIGHT_THEME: ThemeColors = {
  background: "255 255 255",        // white
  foreground: "9 9 11",             // zinc-950
  card: "255 255 255",
  cardForeground: "9 9 11",
  primary: "24 24 27",              // zinc-900
  primaryForeground: "250 250 250",
  secondary: "244 244 245",         // zinc-100
  secondaryForeground: "24 24 27",
  muted: "244 244 245",
  mutedForeground: "113 113 122",   // zinc-500
  border: "228 228 231",            // zinc-200
  input: "228 228 231",
  ring: "24 24 27",
  destructive: "239 68 68",         // red-500
  destructiveForeground: "250 250 250",
};

// ---------------------------------------------------------------------------
// Local-storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "stone-ai-theme";

/**
 * Read the stored theme preference. Falls back to `"dark"` if nothing is
 * saved or if running on the server.
 */
export function getThemePreference(userId?: string): ThemePreference {
  if (typeof window === "undefined") return "dark";

  const key = userId ? `${STORAGE_KEY}-${userId}` : STORAGE_KEY;
  const stored = localStorage.getItem(key);

  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "dark";
}

/**
 * Persist the user's theme preference to localStorage.
 *
 * This intentionally does NOT apply the theme — that responsibility belongs
 * to the `<ThemeProvider>` from `next-themes`. Call `setTheme()` from the
 * `useTheme()` hook after calling this helper if you need the change to
 * take effect immediately.
 */
export function setThemePreference(
  userId: string,
  theme: ThemePreference,
): void {
  if (typeof window === "undefined") return;

  const key = `${STORAGE_KEY}-${userId}`;
  localStorage.setItem(key, theme);

  // Also set the generic key so unauthenticated reads still work.
  localStorage.setItem(STORAGE_KEY, theme);
}

// ---------------------------------------------------------------------------
// CSS variable helpers
// ---------------------------------------------------------------------------

/**
 * Returns a flat object mapping CSS custom-property names to values for the
 * given theme. Useful if you need to apply theme colors programmatically
 * (e.g. canvas, Three.js backgrounds, Vanta.js).
 */
export function getThemeCSSVariables(
  theme: "light" | "dark",
): Record<string, string> {
  const colors = theme === "light" ? LIGHT_THEME : DARK_THEME;
  const vars: Record<string, string> = {};

  for (const [token, value] of Object.entries(colors)) {
    // Convert camelCase to kebab-case: cardForeground -> card-foreground
    const kebab = token.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    vars[`--${kebab}`] = value;
  }

  return vars;
}

/**
 * Resolve "system" to the actual effective theme based on the user's OS
 * preference. Safe to call on the server (returns "dark").
 */
export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "dark";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// ---------------------------------------------------------------------------
// next-themes integration notes
// ---------------------------------------------------------------------------
//
// To wire this up, wrap the app with the next-themes <ThemeProvider>:
//
//   import { ThemeProvider } from "next-themes";
//
//   <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
//     {children}
//   </ThemeProvider>
//
// Then use the `useTheme()` hook from next-themes for toggling. The helpers
// in this file (getThemePreference / setThemePreference) provide an
// additional persistence layer keyed by user ID so preferences survive
// across devices once server-sync is added.
// ---------------------------------------------------------------------------
