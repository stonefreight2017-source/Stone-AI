"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TierErrorModal } from "@/components/modals/TierErrorModal";

interface AppShellWrapperProps {
  children: React.ReactNode;
  userTier: string;
}

export function AppShellWrapper({ children, userTier }: AppShellWrapperProps) {
  // Track referral on first app load
  useEffect(() => {
    const ref = localStorage.getItem("stone_ref");
    if (ref) {
      localStorage.removeItem("stone_ref");
      fetch("/api/referral/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: ref }),
      }).catch(() => {});
    }
  }, []);

  return (
    <AppShell userTier={userTier}>
      {children}
      <TierErrorModal />
    </AppShell>
  );
}
