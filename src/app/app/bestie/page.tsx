"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Plus, Loader2, Sparkles, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BestieCard } from "@/components/bestie/BestieCard";

interface BestieData {
  besties: Array<{
    id: string;
    name: string;
    avatarEmoji: string;
    personality: {
      traits: string[];
      style: string;
      expertise: string[];
    };
    conversationCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  maxBesties: number;
  tier: string;
}

export default function BestieHubPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<BestieData>({
    queryKey: ["besties"],
    queryFn: async () => {
      const res = await fetch("/api/bestie");
      if (!res.ok) throw new Error("Failed to load besties");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400">
        <p>Failed to load your besties</p>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["besties"] })}>
          Try Again
        </Button>
      </div>
    );
  }

  const { besties, maxBesties, tier } = data;
  const canCreate = besties.length < maxBesties;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Early access banner */}
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg p-4 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
        <div>
          <p className="text-zinc-300 text-sm font-medium">
            Early Access — Best AI is live on web
          </p>
          <p className="text-zinc-500 text-xs">
            Mobile app coming soon. Share stone-ai.net with friends.
          </p>
        </div>
      </div>

      {/* Coming Soon — wearable & safety highlight */}
      <div className="bg-gradient-to-r from-cyan-950/30 via-zinc-900/60 to-cyan-950/30 border border-cyan-800/30 rounded-lg p-5">
        <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">Coming to Mobile</p>
        <p className="text-zinc-300 text-sm font-medium mb-2">
          Your Bestie never leaves your side. Not when it matters most.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-500">
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 mt-0.5 shrink-0">&#128205;</span>
            <span><span className="text-zinc-300 font-medium">Silent safety net</span> — &quot;If I&apos;m not home by 8, text Mom my last location.&quot; Make it home? Bestie stands down via GPS. Don&apos;t? Bestie sends the alert. Your secret is always safe with your Bestie.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 mt-0.5 shrink-0">&#128172;</span>
            <span><span className="text-zinc-300 font-medium">Auto-text</span> — hands full? Stuck in traffic? Your Bestie texts the right person in your voice — not a robotic &quot;I&apos;m busy.&quot; Because she actually knows how you talk.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 mt-0.5 shrink-0">&#9201;</span>
            <span><span className="text-zinc-300 font-medium">On your wrist</span> — a quiet &quot;you&apos;ve got this&quot; before your interview. A breathing reminder when your heart rate spikes. Apple Watch. Galaxy Watch. Your Bestie never forgets about you.</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-400" />
            My Bestie
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Up to 43 expert agents. One best friend. Career strategy, fitness plans, creative ideas, financial advice — the more you upgrade, the smarter she gets.
          </p>
        </div>
        {canCreate && besties.length > 0 && (
          <Button
            onClick={() => router.push("/app/bestie/create")}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Bestie
          </Button>
        )}
      </div>

      {/* Bestie list or empty state */}
      {besties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="h-20 w-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-4xl">
            {"\u2728"}
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-white">Build Your Genius Best Friend</h2>
            <p className="text-zinc-400 max-w-md">
              Your Bestie carries the combined knowledge of up to 43 specialized AI agents — career coach,
              financial advisor, creative director, wellness guide, and more. Upgrade your plan to unlock even more brilliance.
            </p>
          </div>
          <Button
            onClick={() => router.push("/app/bestie/create")}
            className="bg-white text-black hover:bg-zinc-200 font-semibold text-lg px-8 py-6"
          >
            <Heart className="h-5 w-5 mr-2" />
            Get Started
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {besties.map((bestie) => (
            <BestieCard
              key={bestie.id}
              bestie={bestie}
              onDelete={() => queryClient.invalidateQueries({ queryKey: ["besties"] })}
            />
          ))}
        </div>
      )}

      {/* Tier limit notice */}
      {!canCreate && besties.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-300 text-sm">
              You&apos;ve reached your bestie limit ({maxBesties} on {tier} tier)
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">
              Upgrade your plan to create more besties
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            onClick={() => router.push("/app/billing")}
          >
            <ArrowUp className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        </div>
      )}
    </div>
  );
}
