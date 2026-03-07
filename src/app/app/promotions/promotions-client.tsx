"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gift,
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
  GraduationCap,
  Handshake,
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
                Try Builder features free for 7 days. No credit card needed.
                Get a taste of what Stone AI can really do.
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3 w-3 text-emerald-400" />
                  200 messages/day (6x more than Free)
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3 w-3 text-emerald-400" />
                  16 specialized agents
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="h-3 w-3 text-emerald-400" />
                  10 Smart (GPT-4o) messages/day
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
                <p>Builder: $17.99/mo (save $12 over 6 months)</p>
                <p>Growth: $44.99/mo (save $30 over 6 months)</p>
                <p>Executive: $89.99/mo (save $60 over 6 months)</p>
                <p>Reseller: $200/mo (no 6-month discount)</p>
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
                <p>Builder: $15.99/mo (save $48/yr)</p>
                <p>Growth: $39.99/mo (save $120/yr)</p>
                <p>Executive: $79.99/mo (save $240/yr)</p>
                <p>Reseller: $190/mo (save $120/yr, 5% off)</p>
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

      {/* ═══ SECTION 4: AI BESTIE ═══ */}
      <Card className="bg-zinc-900 border-zinc-700">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-900/30 flex items-center justify-center text-xl">
              {"\u26A1"}
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Your AI Right Hand</h3>
              <p className="text-amber-400/70 text-sm">
                An operator that handles business — available now
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-400">
            Build your own AI Bestie. Not a chatbot — a boss-level operator with custom personality,
            total recall, and real accountability.{" "}
            <span className="text-white font-semibold">
              It remembers everything. It holds you to your word. It gets things done.
            </span>
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bg-zinc-900/60 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-amber-300">{"\uD83C\uDFAF"}</p>
              <p className="text-xs text-zinc-400 mt-1">Custom personality</p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-amber-300">{"\uD83E\uDDE0"}</p>
              <p className="text-xs text-zinc-400 mt-1">Total recall memory</p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-amber-300">{"\uD83D\uDCAA"}</p>
              <p className="text-xs text-zinc-400 mt-1">Accountability built in</p>
            </div>
          </div>

          <Button
            className="w-full bg-white text-black hover:bg-zinc-200 font-semibold"
            onClick={() => router.push("/app/bestie/create")}
          >
            Build My Bestie
          </Button>
        </CardContent>
      </Card>

      {/* ═══ SECTION 5: LOYALTY REWARDS ═══ */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-zinc-900 border-purple-700/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Star className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Loyalty Milestones</h3>
              <p className="text-purple-400/70 text-sm">The longer you stay, the more you earn</p>
            </div>
          </div>

          <p className="text-sm text-zinc-400">
            Hit milestones and unlock <span className="text-purple-300 font-semibold">bonus messages, priority access, and exclusive features</span>. Rewards never expire once earned.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bg-zinc-900/60 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-300">3 mo</p>
              <p className="text-xs text-zinc-400 mt-1">Loyalty badge + 5 bonus premium credits</p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-300">6 mo</p>
              <p className="text-xs text-zinc-400 mt-1">15 bonus premium credits + early access to new agents</p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-300">12 mo</p>
              <p className="text-xs text-zinc-400 mt-1">30 bonus premium credits + priority support</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ HIDDEN EASTER EGGS TEASER ═══ */}
      <Card className="bg-gradient-to-r from-amber-900/20 to-yellow-900/10 border-amber-700/40">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-xl">
              {"\uD83E\uDD5A"}
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Hidden Easter Eggs</h3>
              <p className="text-amber-400/70 text-sm">
                Rare discoveries hidden throughout the platform
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-400">
            Certain combinations of choices throughout Stone AI unlock{" "}
            <span className="text-amber-300 font-semibold">hidden Easter eggs</span> with bonus credits and exclusive profile badges.
            The rarest combos are out there — can you find them?
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bg-zinc-900/60 rounded-lg p-3 text-center">
              <p className="text-lg">{"\uD83C\uDFC6"}</p>
              <p className="text-xs text-zinc-400 mt-1">Exclusive badges</p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-3 text-center">
              <p className="text-lg">{"\uD83D\uDCB0"}</p>
              <p className="text-xs text-zinc-400 mt-1">Bonus credits (50-100)</p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-3 text-center">
              <p className="text-lg">{"\uD83D\uDD12"}</p>
              <p className="text-xs text-zinc-400 mt-1">One-time claim only</p>
            </div>
          </div>

          <p className="text-[10px] text-zinc-600 text-center">
            Easter egg rewards are one-time claims. Each egg can only be discovered once per account.
          </p>
        </CardContent>
      </Card>

      {/* ═══ OUR PROMISE: 100% SUCCESS GUARANTEE ═══ */}
      <Card className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/20 border-emerald-600/50">
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Our Promise: We Get You There. Period.</h3>
              <p className="text-emerald-400/70 text-sm">
                If you pay for a plan, we personally make sure you succeed with it.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 rounded-lg p-4 border border-emerald-800/30 space-y-3">
            <p className="text-sm text-zinc-300 leading-relaxed">
              We don&apos;t just hand you the keys and walk away. <strong className="text-white">Every paying customer</strong> gets
              real human support to make sure they&apos;re actually getting value from what they paid for.
              Whether you bought the $19.99 Builder plan or the $200 Reseller plan — if you need help,
              we help. No ticket queues. No &quot;check the FAQ.&quot; Real guidance until you&apos;re running.
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-zinc-300">Stuck on setup? We walk you through it step by step</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-zinc-300">Not sure which agents to use? We recommend based on your goals</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-zinc-300">Need help building your Bestie? We&apos;ll walk you through the entire setup</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-zinc-300">Business questions? Our team helps you get actual results</span>
              </div>
            </div>

            <p className="text-xs text-emerald-400/80 font-medium pt-1 border-t border-emerald-800/30">
              This is not optional. If you paid for Stone AI, you get our full support until you&apos;re successful. That&apos;s the deal.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => router.push("/app/support")}
            >
              Get Help Now
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-emerald-700 text-emerald-300 hover:bg-emerald-900/30"
              onClick={() => window.location.href = "mailto:support@stone-ai.net"}
            >
              Email Us Directly
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══ SECTION 6: PREMIUM ONBOARDING & RESELLER ═══ */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Handshake className="h-5 w-5 text-emerald-400" />
          Premium Services & Reseller Program
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Premium Onboarding */}
          <Card className="bg-zinc-900 border-zinc-700">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Premium Setup Service</h3>
                  <p className="text-xs text-zinc-400">We do the work. You get the results.</p>
                </div>
              </div>

              <p className="text-sm text-zinc-400">
                Want us to set everything up for you? Just request the service, pay once, and our team
                handles the rest. We study your business, build your workflows, train your team, and
                stay with you until everyone is confident and productive. <strong className="text-white">100% of the way.</strong>
              </p>

              <div className="space-y-3">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Self-Guided (Free)</span>
                    <Badge className="bg-emerald-900/50 text-emerald-300 text-xs">Included with any plan</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Our built-in AI guide walks you through everything at your own pace. Available 24/7.</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Essentials</span>
                    <span className="text-sm font-semibold text-blue-400">$2,500 one-time</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Best for small teams (1-10 people). We set up your agents, create custom workflows
                    for your specific business, do live training calls, and check in weekly for 4 weeks
                    until everyone is fully up and running.
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Professional</span>
                    <span className="text-sm font-semibold text-purple-400">$7,500 one-time</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Best for growing companies (10-50 people). We roll out Stone AI department by
                    department over 8 weeks. Custom agent configurations per team, group training
                    sessions, usage analytics, and measurable ROI tracking so you can see the impact.
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Enterprise Command</span>
                    <span className="text-sm font-semibold text-amber-400">$25,000 one-time</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Best for large organizations (50+ people). 12-month partnership with a dedicated
                    success manager, custom AI workflows built for your industry, on-site training
                    (or virtual), executive reporting, and ongoing optimization.
                  </p>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  <strong>How it works:</strong> Email support@stone-ai.net or use the Help page to request any
                  premium service. We&apos;ll schedule a call to understand your needs, send you a simple
                  invoice, and get started as soon as payment clears. No contracts. No surprises.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full border-blue-700 text-blue-300 hover:bg-blue-900/30"
                onClick={() => router.push("/app/support")}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Request Premium Setup
              </Button>
            </CardContent>
          </Card>

          {/* Reseller Growth Engine */}
          <Card className="bg-zinc-900 border-zinc-700">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Handshake className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Reseller Program</h3>
                  <p className="text-xs text-zinc-400">Build your business on our platform</p>
                </div>
              </div>

              <p className="text-sm text-zinc-400">
                Use our AI agents to build solutions for <strong className="text-white">your</strong> clients.
                You charge them whatever you want. You keep the profit. We pay you referral commissions on top of that.
              </p>

              {/* Plain English: what are seats */}
              <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-3">
                <p className="text-xs text-zinc-300 font-medium mb-1">What are &quot;seats&quot;?</p>
                <p className="text-[11px] text-zinc-500">
                  A seat = one person who can use Stone AI under your reseller account.
                  If you have 10 clients and each client has 1 person using it, that&apos;s 10 seats.
                  If a client has a team of 5 using it, that&apos;s 5 seats for that client alone.
                  You decide how many seats each client gets.
                </p>
              </div>

              <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg p-3">
                <p className="text-xs text-emerald-300 font-medium mb-2">Quick Math — Growth Reseller ($1,500/mo):</p>
                <div className="space-y-1 text-xs text-zinc-400">
                  <p>Set up 10 clients at $300/mo each = <span className="text-emerald-300">$3,000/mo</span></p>
                  <p>Your Stone AI cost = <span className="text-red-400">-$1,500/mo</span></p>
                  <p className="text-emerald-300 font-semibold pt-1 border-t border-emerald-800/50">Your profit = $1,500/mo + referral commissions</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Starter</span>
                    <span className="text-sm font-semibold text-zinc-300">$500/mo</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Up to 10 seats (10 people can use it), your branding on the interface, 10% commission when you refer new paying users</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Growth</span>
                    <span className="text-sm font-semibold text-emerald-400">$1,500/mo</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Up to 50 seats, fully white-labeled (your logo, your colors, your domain), 15% commission, certified partner badge</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Enterprise</span>
                    <span className="text-sm font-semibold text-amber-400">$5,000/mo</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Up to 200 seats, lifetime 20% commission, dedicated success manager, co-marketing support</p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-emerald-700 text-emerald-300 hover:bg-emerald-900/30"
                onClick={() => router.push("/enterprise")}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Start Reselling — Enterprise Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ SECTION 7: TIER COMPARISON (Plain English) ═══ */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-400" />
          Compare Plans — What You Actually Get
        </h2>

        {/* Quick "Who is this for?" guide */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 mb-4 space-y-2 text-sm">
          <p className="text-zinc-300 font-medium text-xs uppercase tracking-wide">Not sure which plan fits?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <p className="text-blue-400 font-medium">Builder ($19.99)</p>
              <p className="text-zinc-500">Just you. Starting out. Need help planning and launching.</p>
            </div>
            <div className="space-y-1">
              <p className="text-indigo-400 font-medium">Growth ($49.99)</p>
              <p className="text-zinc-500">Small team (1-5). Business is running. Need to scale.</p>
            </div>
            <div className="space-y-1">
              <p className="text-purple-400 font-medium">Executive ($99.99)</p>
              <p className="text-zinc-500">Growing team (5-20). Multiple projects. Need custom AI + team tools.</p>
            </div>
            <div className="space-y-1">
              <p className="text-amber-400 font-medium">Reseller ($200)</p>
              <p className="text-zinc-500">Agency or consultant. Reselling AI to your own clients.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-400 py-3 px-2 font-medium min-w-[180px]">What it means</th>
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
                <td className="py-3 px-2">
                  <p className="text-zinc-300 font-medium text-xs">How many times you can talk to AI per day</p>
                  <p className="text-[10px] text-zinc-500">50 = quick questions only. 250 = a couple working sessions. 500 = full workday. 1,000+ = team use all day.</p>
                </td>
                <td className="text-center py-3 px-2 text-zinc-300">50</td>
                <td className="text-center py-3 px-2 text-zinc-300">250</td>
                <td className="text-center py-3 px-2 text-zinc-300">500</td>
                <td className="text-center py-3 px-2 text-zinc-300">1,000</td>
                <td className="text-center py-3 px-2 text-zinc-300">3,000</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-3 px-2">
                  <p className="text-zinc-300 font-medium text-xs">Premium answers (GPT-4o) per day</p>
                  <p className="text-[10px] text-zinc-500">Use these for hard questions (strategy, analysis, long-form writing). Regular AI handles everyday tasks for free.</p>
                </td>
                <td className="text-center py-3 px-2 text-zinc-300">5 total*</td>
                <td className="text-center py-3 px-2 text-zinc-300">10/day</td>
                <td className="text-center py-3 px-2 text-zinc-300">15/day</td>
                <td className="text-center py-3 px-2 text-zinc-300">30/day</td>
                <td className="text-center py-3 px-2 text-zinc-300">50/day</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-3 px-2">
                  <p className="text-zinc-300 font-medium text-xs">AI specialists available to you</p>
                  <p className="text-[10px] text-zinc-500">Each agent is an expert in one thing. 4 covers basics. 16 covers a small business. 30+ covers everything from legal to SEO to coding.</p>
                </td>
                <td className="text-center py-3 px-2 text-zinc-300">4</td>
                <td className="text-center py-3 px-2 text-zinc-300">16</td>
                <td className="text-center py-3 px-2 text-zinc-300">30</td>
                <td className="text-center py-3 px-2 text-zinc-300">38</td>
                <td className="text-center py-3 px-2 text-white font-medium">All 42</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-3 px-2">
                  <p className="text-zinc-300 font-medium text-xs">How long AI remembers your conversation</p>
                  <p className="text-[10px] text-zinc-500">15 msgs = short chats only. 40+ = it can follow long complex discussions without forgetting what you said earlier.</p>
                </td>
                <td className="text-center py-3 px-2 text-zinc-300">15 msgs</td>
                <td className="text-center py-3 px-2 text-zinc-300">25 msgs</td>
                <td className="text-center py-3 px-2 text-zinc-300">40 msgs</td>
                <td className="text-center py-3 px-2 text-zinc-300">60 msgs</td>
                <td className="text-center py-3 px-2 text-zinc-300">80 msgs</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-3 px-2">
                  <p className="text-zinc-300 font-medium text-xs">AI Besties</p>
                  <p className="text-[10px] text-zinc-500">Your AI right hand — remembers everything, keeps you accountable</p>
                </td>
                <td className="text-center py-3 px-2 text-zinc-300">1</td>
                <td className="text-center py-3 px-2 text-zinc-300">1</td>
                <td className="text-center py-3 px-2 text-zinc-300">1</td>
                <td className="text-center py-3 px-2 text-zinc-300">1</td>
                <td className="text-center py-3 px-2 text-zinc-300">1</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-3 px-2">
                  <p className="text-zinc-300 font-medium text-xs">Saved documents AI can reference</p>
                  <p className="text-[10px] text-zinc-500">Upload your business plan, product list, brand guide, etc. AI reads them before answering — like giving your team a shared brain.</p>
                </td>
                <td className="text-center py-3 px-2 text-zinc-600">—</td>
                <td className="text-center py-3 px-2 text-zinc-300">10</td>
                <td className="text-center py-3 px-2 text-zinc-300">30</td>
                <td className="text-center py-3 px-2 text-zinc-300">100</td>
                <td className="text-center py-3 px-2 text-zinc-300">500</td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-3 px-2">
                  <p className="text-zinc-300 font-medium text-xs">Voice chat with AI</p>
                  <p className="text-[10px] text-zinc-500">Hands-free brainstorming. Talk to your AI while driving, cooking, or walking. Great for people who think better out loud.</p>
                </td>
                <td className="text-center py-3 px-2 text-zinc-600">—</td>
                <td className="text-center py-3 px-2 text-zinc-600">—</td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
              </tr>
              <tr className="border-b border-zinc-800/50">
                <td className="py-3 px-2">
                  <p className="text-zinc-300 font-medium text-xs">Skip the line (faster responses)</p>
                  <p className="text-[10px] text-zinc-500">When the platform is busy, your requests jump ahead of everyone else. Matters when speed = money.</p>
                </td>
                <td className="text-center py-3 px-2 text-zinc-600">—</td>
                <td className="text-center py-3 px-2 text-zinc-600">—</td>
                <td className="text-center py-3 px-2 text-zinc-600">—</td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-amber-400 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-amber-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-2">
                  <p className="text-zinc-300 font-medium text-xs">Build your own custom AI agents</p>
                  <p className="text-[10px] text-zinc-500">Train AI on your exact business — your products, your process, your tone. Like hiring someone who already knows everything about your company.</p>
                </td>
                <td className="text-center py-3 px-2 text-zinc-600">—</td>
                <td className="text-center py-3 px-2 text-zinc-600">—</td>
                <td className="text-center py-3 px-2 text-zinc-600">—</td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-amber-400 mx-auto" /></td>
                <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-amber-400 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-zinc-600 mt-2 text-center">
          * Free tier gets 5 premium answers total (lifetime), not daily. All plans include unlimited regular AI messages via our local engine.
        </p>
      </div>

      {/* ═══ SECTION 8: SECURITY & TRUST ═══ */}
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
