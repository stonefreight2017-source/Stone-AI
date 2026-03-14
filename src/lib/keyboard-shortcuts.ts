"use client";

import { useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShortcutDefinition {
  /** Primary key (lowercase, e.g. "k", "/", "enter", "escape") */
  key: string;
  /** Modifier keys required — use "mod" for Cmd (mac) / Ctrl (win/linux) */
  modifiers: string[];
  /** Unique action identifier */
  action: string;
  /** Human-readable description shown in the shortcuts help panel */
  description: string;
  /** Optional: restrict to a specific area of the app */
  scope?: "global" | "chat" | "modal";
}

export type ShortcutHandler = (action: string, event: KeyboardEvent) => void;

// ---------------------------------------------------------------------------
// Registry — single source of truth for every shortcut in the app
// ---------------------------------------------------------------------------

const SHORTCUTS: ShortcutDefinition[] = [
  {
    key: "k",
    modifiers: ["mod"],
    action: "open-agent-search",
    description: "Open agent search",
    scope: "global",
  },
  {
    key: "n",
    modifiers: ["mod"],
    action: "new-conversation",
    description: "New conversation",
    scope: "global",
  },
  {
    key: "s",
    modifiers: ["mod", "shift"],
    action: "toggle-sidebar",
    description: "Toggle sidebar",
    scope: "global",
  },
  {
    key: "/",
    modifiers: ["mod"],
    action: "show-shortcuts-help",
    description: "Show keyboard shortcuts",
    scope: "global",
  },
  {
    key: "Escape",
    modifiers: [],
    action: "close-modal",
    description: "Close modal / dialog",
    scope: "modal",
  },
  {
    key: "Enter",
    modifiers: ["mod"],
    action: "send-message",
    description: "Send message",
    scope: "chat",
  },
  {
    key: "c",
    modifiers: ["mod", "shift"],
    action: "copy-last-response",
    description: "Copy last response",
    scope: "chat",
  },
];

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** Return a read-only copy of the full shortcut registry. */
export function getShortcuts(): Readonly<ShortcutDefinition[]> {
  return SHORTCUTS;
}

/**
 * Given a native KeyboardEvent, return the matching ShortcutDefinition
 * (if any). Returns `null` when no shortcut matches.
 */
export function matchShortcut(
  event: KeyboardEvent,
): ShortcutDefinition | null {
  const isMac =
    typeof navigator !== "undefined" &&
    /mac/i.test(navigator.platform);

  for (const shortcut of SHORTCUTS) {
    if (!keysMatch(shortcut.key, event.key)) continue;

    const modifiersOk = shortcut.modifiers.every((mod) => {
      switch (mod) {
        case "mod":
          return isMac ? event.metaKey : event.ctrlKey;
        case "shift":
          return event.shiftKey;
        case "alt":
          return event.altKey;
        default:
          return false;
      }
    });

    if (!modifiersOk) continue;

    // Guard against false positives — make sure no *extra* modifiers are
    // pressed that the shortcut doesn't call for.
    const expectsMod = shortcut.modifiers.includes("mod");
    const expectsShift = shortcut.modifiers.includes("shift");
    const expectsAlt = shortcut.modifiers.includes("alt");

    const modPressed = isMac ? event.metaKey : event.ctrlKey;
    if (modPressed && !expectsMod) continue;
    if (event.shiftKey && !expectsShift) continue;
    if (event.altKey && !expectsAlt) continue;

    return shortcut;
  }

  return null;
}

/**
 * Format a shortcut for display (e.g. "Cmd+K" or "Ctrl+K").
 */
export function formatShortcut(shortcut: ShortcutDefinition): string {
  const isMac =
    typeof navigator !== "undefined" &&
    /mac/i.test(navigator.platform);

  const parts = shortcut.modifiers.map((mod) => {
    switch (mod) {
      case "mod":
        return isMac ? "\u2318" : "Ctrl";
      case "shift":
        return isMac ? "\u21E7" : "Shift";
      case "alt":
        return isMac ? "\u2325" : "Alt";
      default:
        return mod;
    }
  });

  const keyLabel =
    shortcut.key === "Enter"
      ? "\u23CE"
      : shortcut.key === "Escape"
        ? "Esc"
        : shortcut.key.toUpperCase();

  parts.push(keyLabel);
  return parts.join(isMac ? "" : "+");
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * Register all keyboard shortcuts and invoke `handler` when one fires.
 *
 * ```tsx
 * useKeyboardShortcuts((action) => {
 *   if (action === "open-agent-search") openSearch();
 * });
 * ```
 */
export function useKeyboardShortcuts(handler: ShortcutHandler): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't intercept when user is typing in an input / textarea / contentEditable
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable)
    ) {
      // Still allow Escape and Cmd+Enter inside inputs
      const matched = matchShortcut(event);
      if (
        matched &&
        (matched.action === "close-modal" ||
          matched.action === "send-message")
      ) {
        event.preventDefault();
        handlerRef.current(matched.action, event);
      }
      return;
    }

    const matched = matchShortcut(event);
    if (matched) {
      event.preventDefault();
      handlerRef.current(matched.action, event);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function keysMatch(expected: string, actual: string): boolean {
  return expected.toLowerCase() === actual.toLowerCase();
}
