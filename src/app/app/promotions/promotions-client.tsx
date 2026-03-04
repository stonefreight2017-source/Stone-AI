"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gift,
  Zap,
  Clock,
  CreditCard,
  MessageSquare,
  Brain,
  Check,
  ArrowRight,
  Loader2,
  Percent,
  Users,
  Star,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/billing/TierBadge";

interface TierInfo {
  key: string;
  name: string;
  price: number;
  badge: string;
  popular: boolean;
  limits: {
    messagesPerDay: number;
    tokensPerMonth: number;
    maxResponseTokens: number;
    concurrentRequests: number;
    requestsPerMinute: number;
  };
  perks: {
    contextMessages: number;
    autoRouting: boolean;
    conversationExport: boolean;
    priorityQueue: boolean;
  };
  allowedModes: string[];
}

interface PromotionsClientProps {
  currentTier: string;
  tierName: string;
  freeTrialUsed: boolean;
  enhancedTrialUsed: boolean;
  trialActive: boolean;
  trialEndsAt: string | null;
  hasSubscription: boolean;
  tiers: TierInfo[];
}

export function PromotionsClient({
  currentTier,
  tierName,
  freeTrialUsed,
  enhancedTrialUsed,
  trialActive,
  trialEndsAt,
  hasSubscription,
  tiers,
}: PromotionsClientProps) {
  const router = useRouter();
  const [loadingTrial, setLoadingTrial] = useState(false);
  const [loadingEnhanced, setLoadingEnhanced] = useState<string | null>(null);
  const [trialSuccess, setTrialSuccess] = useState(false);

  async function handleBasicTrial() {
    setLoadingTrial(true);
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "basic" }),
      });
      const data = await res.json();
      if (data.success) {
        setTrialSuccess(true);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        alert(data.error || "Could not activate trial");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoadingTrial(false);
    }
  }

  async function handleEnhancedTrial(tier: string) {
    setLoadingEnhanced(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, period: "monthly", trial: true }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch {
      alert("Failed to start trial checkout");
    } finally {
      setLoadingEnhanced(null);
    }
  }

  function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  }

  const daysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-400" />
          Promotions & Deals
        </h1>
        <p className="text-zinc-400">
          Exclusive offers, free trials, and ways to save on Stone AI
        </p>
      </div>

      {/* Trial Success Banner */}
      {trialSuccess && (
        <div className="bg-emerald-900/40 border border-emerald-700 rounded-lg p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-emerald-300 font-medium">Trial activated!</p>
            <p className="text-emerald-400/70 text-sm">Refreshing your account...</p>
          </div>
        </div>
      )}

      {/* Active Trial Banner */}
      {trialActive && !trialSuccess && (
        <div className="bg-blue-900/40 border border-blue-700 rounded-lg p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-400 shrink-0" />
          <div>
            <p className="text-blue-300 font-medium">
              Free trial active — {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
            </p>
            <p className="text-blue-400/70 text-sm">
              Subscribe before it ends to keep your upgraded features.
            </p>
          </div>
          <Button
            size="sm"
            className="ml-auto bg-white text-black hover:bg-zinc-200"
            onClick={() => router.push("/app/billing")}
          >
            Subscribe Now
          </Button>
        </div>
      )}

      {/* ═══ SECTION 1: FREE TRIALS ═══ */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-emerald-400" />
          Free Trials
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Basic Trial — No Credit Card */}
          <Card className={`bg-zinc-900 border ${!freeTrialUsed && currentTier === "FREE" ? "border-emerald-600" : "border-zinc-800"}`}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Basic Trial</h3>
                <Badge className="bg-emerald-900/50 text-emerald-300 text-xs">No Credit Card</Badge>
              </div>

              <p className="text-sm text-zinc-400">
                Try Starter features free for 7 days. No credit card needed.
                Get a taste of what Stone AI can really do.
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3 w-3 text-emerald-400" />
                  150 messages/day (5x more than Free)
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3 w-3 text-emerald-400" />
                  2M tokens/month
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3 w-3 text-emerald-400" />
                  Access to Starter-tier agents
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Clock className="h-3 w-3 text-blue-400" />
                  7 days, then reverts to Free
                </div>
              </div>

              {freeTrialUsed ? (
                <Button disabled className="w-full" variant="outline">
                  <Check className="h-4 w-4 mr-2" />
                  Trial Used
                </Button>
              ) : currentTier !== "FREE" || hasSubscription ? (
                <Button disabled className="w-full" variant="outline">
                  Not eligible (already upgraded)
                </Button>
              ) : (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleBasicTrial}
                  disabled={loadingTrial}
                >
                  {loadingTrial ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Gift className="h-4 w-4 mr-2" />
                  )}
                  Start Free Trial
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Trial — Credit Card Required */}
          <Card className={`bg-zinc-900 border ${!enhancedTrialUsed ? "border-purple-600" : "border-zinc-800"}`}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Enhanced Trial</h3>
                <Badge className="bg-purple-900/50 text-purple-300 text-xs">7 Days Free</Badge>
              </div>

              <p className="text-sm text-zinc-400">
                Experience the <strong className="text-white">full power</strong> of any tier for 7 days.
                Credit card required — auto-subscribes after trial ends.
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3 w-3 text-purple-400" />
                  Full access to your chosen tier
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3 w-3 text-purple-400" />
                  All agents, all features unlocked
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3 w-3 text-purple-400" />
                  Cancel anytime during trial — no charge
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <CreditCard className="h-3 w-3 text-amber-400" />
                  Auto-subscribes after 7 days
                </div>
              </div>

              {enhancedTrialUsed ? (
                <Button disabled className="w-full" variant="outline">
                  <Check className="h-4 w-4 mr-2" />
                  Enhanced Trial Used
                </Button>
              ) : hasSubscription ? (
                <Button disabled className="w-full" variant="outline">
                  Already subscribed
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {tiers.filter((t) => t.key !== "FREE").map((t) => (
                    <Button
                      key={t.key}
                      size="sm"
                      variant="outline"
                      className="border-purple-700 text-purple-300 hover:bg-purple-900/30"
                      onClick={() => handleEnhancedTrial(t.key)}
                      disabled={loadingEnhanced === t.key}
                    >
                      {loadingEnhanced === t.key ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <ArrowRight className="h-3 w-3 mr-1" />
                      )}
                      Try {t.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ SECTION 2: BILLING PERIOD SAVINGS ═══ */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Percent className="h-5 w-5 text-blue-400" />
          Save with Longer Plans
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 text-center space-y-2">
              <p className="text-zinc-400 text-sm">Monthly</p>
              <p className="text-3xl font-bold text-white">$0 off</p>
              <p className="text-xs text-zinc-500">Pay as you go</p>
              <p className="text-zinc-400 text-sm">Cancel anytime</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-blue-600">
            <CardContent className="pt-6 text-center space-y-2">
              <Badge className="bg-blue-900/50 text-blue-300 text-xs mb-1">Save 10%</Badge>
              <p className="text-zinc-400 text-sm">6-Month Plan</p>
              <p className="text-3xl font-bold text-white">10% off</p>
              <p className="text-xs text-zinc-500">Billed every 6 months</p>
              <div className="text-sm text-emerald-400 space-y-1 pt-2">
                <p>Starter: $8.99/mo (save $6)</p>
                <p>Plus: $26.99/mo (save $18)</p>
                <p>Smart: $62.99/mo (save $42)</p>
                <p>Pro: $179.10/mo (save $119)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-amber-600">
            <CardContent className="pt-6 text-center space-y-2">
              <Badge className="bg-amber-900/50 text-amber-300 text-xs mb-1">Best Value</Badge>
              <p className="text-zinc-400 text-sm">Annual Plan</p>
              <p className="text-3xl font-bold text-white">20% off</p>
              <p className="text-xs text-zinc-500">Billed yearly</p>
              <div className="text-sm text-emerald-400 space-y-1 pt-2">
                <p>Starter: $7.99/mo (save $24/yr)</p>
                <p>Plus: $23.99/mo (save $72/yr)</p>
                <p>Smart: $55.99/mo (save $168/yr)</p>
                <p>Pro: $159.20/mo (save $478/yr)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-4">
          <Button
            className="bg-white text-black hover:bg-zinc-200"
            onClick={() => router.push("/app/billing")}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            View Plans & Subscribe
          </Button>
        </div>
      </div>

      {/* ═══ SECTION 3: REFERRAL PROGRAM ═══ */}
      <Card className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-700">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-emerald-400" />
            <div>
              <h3 className="font-semibold text-white text-lg">Refer Friends, Earn Rewards</h3>
              <p className="text-emerald-400/70 text-sm">
                Share your referral link and earn bonus messages when friends sign up
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bg-zinc-900/60 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">1</p>
              <p className="text-xs text-zinc-400 mt-1">Share your unique link</p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">2</p>
              <p className="text-xs text-zinc-400 mt-1">Friend signs up & subscribes</p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-xs text-zinc-400 mt-1">You both get rewarded</p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-emerald-700 text-emerald-300 hover:bg-emerald-900/30"
            onClick={() => router.push("/app/settings")}
          >
            <Gift className="h-4 w-4 mr-2" />
            Get Your Referral Link
          </Button>
        </CardContent>
      </Card>

      {/* ═══ SECTION 4: TIER COMPARISON ═══ */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-400" />
          Tier Comparison
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-400 py-3 px-2 font-medium">Feature</th>
                {tiers.map((t) => (
                  <th key={t.key} className="text-center text-zinc-300 py-3 px-2 font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <TierBadge tier={t.key} />
                      {t.price === 0 ? "Free" : `$${t.price}/mo`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 px-2 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Messages/Day
                </td>
                {tiers.map((t) => (
                  <td key={t.key} className="text-center py-2 px-2 text-zinc-300">
                    {t.limits.messagesPerDay.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 px-2 flex items-center gap-1">
                  <Brain className="h-3 w-3" /> Tokens/Month
                </td>
                {tiers.map((t) => (
                  <td key={t.key} className="text-center py-2 px-2 text-zinc-300">
                    {formatTokens(t.limits.tokensPerMonth)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 px-2">Max Response</td>
                {tiers.map((t) => (
                  <td key={t.key} className="text-center py-2 px-2 text-zinc-300">
                    {formatTokens(t.limits.maxResponseTokens)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 px-2">Concurrent Requests</td>
                {tiers.map((t) => (
                  <td key={t.key} className="text-center py-2 px-2 text-zinc-300">
                    {t.limits.concurrentRequests}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 px-2">Context Window</td>
                {tiers.map((t) => (
                  <td key={t.key} className="text-center py-2 px-2 text-zinc-300">
                    {t.perks.contextMessages} msgs
                  </td>
                ))}
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 px-2">AI Modes</td>
                {tiers.map((t) => (
                  <td key={t.key} className="text-center py-2 px-2">
                    {t.allowedModes.map((m) => (
                      <Badge key={m} variant="outline" className="text-[10px] border-zinc-700 text-zinc-400 mx-0.5">
                        {m}
                      </Badge>
                    ))}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 px-2">Auto-Routing</td>
                {tiers.map((t) => (
                  <td key={t.key} className="text-center py-2 px-2">
                    {t.perks.autoRouting ? (
                      <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 px-2">Export Conversations</td>
                {tiers.map((t) => (
                  <td key={t.key} className="text-center py-2 px-2">
                    {t.perks.conversationExport ? (
                      <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-2 px-2">Priority Queue</td>
                {tiers.map((t) => (
                  <td key={t.key} className="text-center py-2 px-2">
                    {t.perks.priorityQueue ? (
                      <Check className="h-4 w-4 text-amber-400 mx-auto" />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-2">API Access</td>
                {tiers.map((t) => (
                  <td key={t.key} className="text-center py-2 px-2">
                    {t.key === "PRO" ? (
                      <Check className="h-4 w-4 text-amber-400 mx-auto" />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ SECTION 5: SECURITY & TRUST ═══ */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Your Data, Your Privacy
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              AES-256-GCM encryption at rest
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              TLS 1.3 encryption in transit
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              No data sold to third parties
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              Cancel anytime, no questions asked
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              Prompt injection protection
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              Full audit logging
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
