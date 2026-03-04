"use client";

import { useState, useEffect } from "react";
import {
  User,
  Shield,
  Key,
  Zap,
  Copy,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  MessageSquare,
  Brain,
  Clock,
  Loader2,
  Gift,
  Share2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { TierBadge } from "@/components/billing/TierBadge";

interface SettingsClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier: string;
    tierName: string;
    createdAt: string;
  };
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
    apiAccess: boolean;
    commercialLicense: boolean;
    earlyAccess: boolean;
    agentBuilder: boolean;
    referralMultiplier: number;
  };
  allowedModes: string[];
  apiKeys: {
    id: string;
    name: string;
    keyPrefix: string;
    lastUsedAt: string | null;
    createdAt: string;
  }[];
}

export function SettingsClient({
  user,
  limits,
  perks,
  allowedModes,
  apiKeys: initialKeys,
}: SettingsClientProps) {
  const [apiKeys, setApiKeys] = useState(initialKeys);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreateKey() {
    setCreating(true);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "Default" }),
      });
      const data = await res.json();
      if (data.key) {
        setNewKeyRaw(data.key);
        setApiKeys((prev) => [
          {
            id: Date.now().toString(),
            name: data.name,
            keyPrefix: data.prefix,
            lastUsedAt: null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setNewKeyName("");
      } else {
        alert(data.error || "Failed to create key");
      }
    } catch {
      alert("Failed to create API key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    setRevoking(id);
    try {
      const res = await fetch(`/api/user/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
      }
    } catch {
      alert("Failed to revoke key");
    } finally {
      setRevoking(null);
    }
  }

  function copyKey() {
    if (newKeyRaw) {
      navigator.clipboard.writeText(newKeyRaw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-zinc-400">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-300 text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wide">Name</label>
              <p className="text-white mt-1">{user.name || "Not set"}</p>
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wide">Email</label>
              <p className="text-white mt-1">{user.email}</p>
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wide">Plan</label>
              <div className="mt-1 flex items-center gap-2">
                <TierBadge tier={user.tier} />
                <span className="text-zinc-400 text-sm">{user.tierName}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wide">Member Since</label>
              <p className="text-white mt-1">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Limits */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-300 text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Plan Limits & Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <MessageSquare className="h-3 w-3" />
                Messages/Day
              </div>
              <p className="text-white font-semibold">
                {limits.messagesPerDay >= 99_999 ? "Unlimited" : limits.messagesPerDay.toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Brain className="h-3 w-3" />
                Tokens/Month
              </div>
              <p className="text-white font-semibold">
                {limits.tokensPerMonth >= 999_999_999 ? "Unlimited" : formatTokens(limits.tokensPerMonth)}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Zap className="h-3 w-3" />
                Max Response
              </div>
              <p className="text-white font-semibold">{formatTokens(limits.maxResponseTokens)} tokens</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Clock className="h-3 w-3" />
                Requests/Min
              </div>
              <p className="text-white font-semibold">{limits.requestsPerMinute}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                Context Window
              </div>
              <p className="text-white font-semibold">{perks.contextMessages} messages</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                AI Modes
              </div>
              <div className="flex gap-1 mt-1">
                {allowedModes.map((m) => (
                  <Badge key={m} variant="outline" className="text-xs border-zinc-600 text-zinc-300">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            {perks.autoRouting && (
              <Badge className="bg-purple-900/50 text-purple-300">
                <Check className="h-3 w-3 mr-1" /> Auto-Routing
              </Badge>
            )}
            {perks.conversationExport && (
              <Badge className="bg-blue-900/50 text-blue-300">
                <Check className="h-3 w-3 mr-1" /> Export Conversations
              </Badge>
            )}
            {perks.priorityQueue && (
              <Badge className="bg-amber-900/50 text-amber-300">
                <Check className="h-3 w-3 mr-1" /> Priority Queue
              </Badge>
            )}
            {perks.apiAccess && (
              <Badge className="bg-amber-900/50 text-amber-300">
                <Check className="h-3 w-3 mr-1" /> API Access
              </Badge>
            )}
            {perks.commercialLicense && (
              <Badge className="bg-amber-900/50 text-amber-300">
                <Check className="h-3 w-3 mr-1" /> Commercial License
              </Badge>
            )}
            {perks.earlyAccess && (
              <Badge className="bg-amber-900/50 text-amber-300">
                <Check className="h-3 w-3 mr-1" /> Early Access
              </Badge>
            )}
            {perks.agentBuilder && (
              <Badge className="bg-amber-900/50 text-amber-300">
                <Check className="h-3 w-3 mr-1" /> Agent Builder
              </Badge>
            )}
            {perks.referralMultiplier > 1 && (
              <Badge className="bg-amber-900/50 text-amber-300">
                <Check className="h-3 w-3 mr-1" /> {perks.referralMultiplier}x Referral Rewards
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Keys — Pro only */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-300 text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
            {user.tier !== "PRO" && (
              <Badge className="bg-zinc-800 text-zinc-500 text-xs ml-2">Pro Only</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.tier !== "PRO" ? (
            <div className="text-center py-8">
              <Shield className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">
                API access is available on the Pro plan.
              </p>
              <Button
                variant="outline"
                className="mt-3 border-zinc-700 text-zinc-300"
                onClick={() => (window.location.href = "/app/billing")}
              >
                View Plans
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* New key creation */}
              {newKeyRaw && (
                <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <p className="text-amber-300 text-sm font-medium">
                      Save this key now — it won't be shown again
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-zinc-800 px-3 py-2 rounded text-xs text-green-400 font-mono overflow-x-auto">
                      {newKeyRaw}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyKey}>
                      {copied ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 text-zinc-400 text-xs"
                    onClick={() => setNewKeyRaw(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Key name (e.g., Production)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button
                  onClick={handleCreateKey}
                  disabled={creating || apiKeys.length >= 5}
                  className="shrink-0"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  Create
                </Button>
              </div>

              {apiKeys.length >= 5 && (
                <p className="text-xs text-zinc-500">Maximum 5 active keys. Revoke one to create a new one.</p>
              )}

              <Separator className="bg-zinc-800" />

              {/* Key list */}
              {apiKeys.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">
                  No API keys yet. Create one to access the API.
                </p>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="text-sm text-white font-medium">{key.name}</p>
                        <p className="text-xs text-zinc-500 font-mono">{key.keyPrefix}</p>
                        <p className="text-xs text-zinc-600">
                          Created {new Date(key.createdAt).toLocaleDateString()}
                          {key.lastUsedAt &&
                            ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => handleRevokeKey(key.id)}
                        disabled={revoking === key.id}
                      >
                        {revoking === key.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-zinc-800/30 rounded-lg p-3 text-xs text-zinc-500">
                <p className="font-medium text-zinc-400 mb-1">API Usage</p>
                <p>
                  Use your API key as a Bearer token:{" "}
                  <code className="text-zinc-300">Authorization: Bearer sk_stone_...</code>
                </p>
                <p className="mt-1">
                  Endpoint: <code className="text-zinc-300">POST /api/v1/chat</code>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Program */}
      <ReferralCard />

      {/* Privacy Choices (CCPA Compliance) */}
      <PrivacyChoicesCard />

      {/* Security */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-300 text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>All data encrypted in transit (TLS 1.3)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>AES-256-GCM encryption at rest</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>Prompt injection protection active</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>Rate limiting and abuse prevention</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>Full audit logging for security events</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Referral Program Card ───────────────────────────────

interface ReferralData {
  referralCode: string;
  referralLink: string;
  referralMultiplier?: number;
  stats: { total: number; pending: number; qualified: number; rewarded: number };
  referrals: {
    id: string;
    status: string;
    name: string | null;
    email: string;
    tier: string;
    joinedAt: string;
  }[];
}

function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copyLink() {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-300 text-sm font-medium flex items-center gap-2">
          <Gift className="h-4 w-4 text-emerald-400" />
          Referral Program
          <Badge className="bg-emerald-900/50 text-emerald-300 text-xs ml-2">
            Earn Rewards
          </Badge>
          {data?.referralMultiplier && data.referralMultiplier > 1 && (
            <Badge className="bg-amber-900/50 text-amber-300 text-xs">
              {data.referralMultiplier}x PRO Bonus
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : data ? (
          <>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
                Your Referral Link
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-zinc-800 px-3 py-2 rounded text-xs text-emerald-400 font-mono overflow-x-auto">
                  {data.referralLink}
                </code>
                <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
                  {copied ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Code: <span className="text-zinc-300 font-mono">{data.referralCode}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">{data.stats.total}</p>
                <p className="text-xs text-zinc-500">Total Referrals</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">{data.stats.qualified}</p>
                <p className="text-xs text-zinc-500">Qualified</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-amber-400">{data.stats.rewarded}</p>
                <p className="text-xs text-zinc-500">Rewarded</p>
              </div>
            </div>

            {data.referrals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Recent Referrals</p>
                {data.referrals.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-zinc-800/30 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-zinc-500" />
                      <span className="text-sm text-zinc-300">{r.name || r.email}</span>
                    </div>
                    <Badge
                      className={
                        r.status === "REWARDED"
                          ? "bg-amber-900/50 text-amber-300"
                          : r.status === "QUALIFIED"
                          ? "bg-emerald-900/50 text-emerald-300"
                          : "bg-zinc-800 text-zinc-400"
                      }
                    >
                      {r.status.toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-zinc-800/30 rounded-lg p-3 text-xs text-zinc-500">
              <p className="font-medium text-zinc-400 mb-1 flex items-center gap-1">
                <Share2 className="h-3 w-3" /> How it works
              </p>
              <p>Share your link with friends. When they sign up and subscribe to any paid plan, you both get rewarded with bonus messages and a discount on your next billing cycle.</p>
            </div>
          </>
        ) : (
          <p className="text-zinc-500 text-sm text-center py-4">
            Unable to load referral data. Please try again later.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Privacy Choices (CCPA Compliance) ───────────────────

function PrivacyChoicesCard() {
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => {
    setOptedOut(localStorage.getItem("stone_ccpa_optout") === "true");
  }, []);

  function handleOptOut() {
    localStorage.setItem("stone_ccpa_optout", "true");
    setOptedOut(true);
  }

  function handleOptIn() {
    localStorage.removeItem("stone_ccpa_optout");
    setOptedOut(false);
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-300 text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Privacy Choices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-zinc-400">
        <p>
          We use anonymized interest segments to display relevant content on ad-supported tiers.
          Your conversation content is never shared with advertisers.
        </p>
        <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
          <div>
            <p className="text-zinc-300 font-medium">Personalized Ads</p>
            <p className="text-xs text-zinc-500">
              {optedOut
                ? "You have opted out of personalized advertising."
                : "Contextual ads based on usage patterns."}
            </p>
          </div>
          {optedOut ? (
            <Button size="sm" variant="outline" onClick={handleOptIn} className="text-xs">
              Opt Back In
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handleOptOut} className="text-xs text-zinc-500">
              Do Not Sell My Info
            </Button>
          )}
        </div>
        <p className="text-xs text-zinc-600">
          Under the California Consumer Privacy Act (CCPA), you have the right to opt out of the
          sale or sharing of personal information.{" "}
          <a href="/privacy" className="text-zinc-500 hover:text-zinc-400 underline">
            Read our Privacy Policy
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
