"use client";

import { AppShell } from "@/components/layout/AppShell";
import { TierErrorModal } from "@/components/modals/TierErrorModal";

interface AppShellWrapperProps {
  children: React.ReactNode;
  userTier: string;
}

export function AppShellWrapper({ children, userTier }: AppShellWrapperProps) {
  return (
    <AppShell userTier={userTier}>
      {children}
      <TierErrorModal />
    </AppShell>
  );
}
