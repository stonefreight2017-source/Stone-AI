"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TierErrorModal } from "@/components/modals/TierErrorModal";

interface AppShellWrapperProps {
  children: React.ReactNode;
  userTier: string;
  onboardingCompleted: boolean;
}

export function AppShellWrapper({ children, userTier, onboardingCompleted }: AppShellWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();

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

  // Redirect to onboarding if not completed (skip if already on onboarding page)
  useEffect(() => {
    if (!onboardingCompleted && !pathname.startsWith("/app/onboarding")) {
      router.replace("/app/onboarding");
    }
  }, [onboardingCompleted, pathname, router]);

  // Show onboarding full-screen (no sidebar/shell)
  if (!onboardingCompleted && pathname.startsWith("/app/onboarding")) {
    return <>{children}</>;
  }

  return (
    <AppShell userTier={userTier}>
      {children}
      <TierErrorModal />
    </AppShell>
  );
}
