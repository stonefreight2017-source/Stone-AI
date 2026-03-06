"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    name: string | null;
    tier: string;
    onboardingCompleted: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((d) => {
        if (d.onboardingCompleted) {
          router.replace("/app");
          return;
        }
        setData({ name: d.name, tier: d.tier, onboardingCompleted: d.onboardingCompleted });
      })
      .catch(() => router.replace("/app"));
  }, [router]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="animate-pulse text-zinc-600 text-sm">Loading...</div>
      </div>
    );
  }

  return <OnboardingWizard userName={data.name} userTier={data.tier} />;
}
