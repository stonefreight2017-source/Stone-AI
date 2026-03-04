"use client";

import { create } from "zustand";
import type { TierMismatchError, QuotaExceededError } from "@/types";

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Active chat
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;

  // Mode selection
  selectedMode: "LOCAL" | "SMART";
  setSelectedMode: (mode: "LOCAL" | "SMART") => void;

  // Enforcement errors (triggers modals)
  tierError: TierMismatchError | QuotaExceededError | null;
  setTierError: (error: TierMismatchError | QuotaExceededError | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Active chat
  activeChatId: null,
  setActiveChatId: (id) => set({ activeChatId: id }),

  // Mode
  selectedMode: "LOCAL",
  setSelectedMode: (mode) => set({ selectedMode: mode }),

  // Enforcement errors
  tierError: null,
  setTierError: (error) => set({ tierError: error }),
}));
