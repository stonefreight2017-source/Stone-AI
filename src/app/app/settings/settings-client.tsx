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
  Palette,
  Lock,
  Unlock,
  Sparkles,
  Diamond,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { TierBadge } from "@/components/billing/TierBadge";
import { UserBadges } from "@/components/badges/UserBadges";

interface SettingsClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier: string;
    tierName: string;
    createdAt: string;
    backdropTheme: string;
    nameKey: string;
    badges: string[];
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
                <UserBadges badges={user.badges} />
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

      {/* Backdrop Theme */}
      <BackdropPicker
        currentTheme={user.backdropTheme}
        initialNameKey={user.nameKey}
      />

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

      {/* Security & Privacy */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-300 text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security &amp; Privacy
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
          <PrivacyChoicesInline />
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

// ─── Backdrop Theme Picker ─────────────────────────────────

import {
  BACKDROP_PRESETS,
  type BackdropCategory,
} from "@/components/backdrops/backdrop-presets";
import { getUnlockedBackdrops, validateNameKey } from "@/lib/backdrop-seed";
import type { PoolBackdrop } from "@/components/backdrops/backdrop-pool";

const CATEGORY_LABELS: Record<BackdropCategory, string> = {
  css: "Gradients",
  particles: "Particles",
  vanta: "3D Effects",
};

const CATEGORY_ORDER: BackdropCategory[] = ["css", "particles", "vanta"];

function BackdropPicker({
  currentTheme,
  initialNameKey,
}: {
  currentTheme: string;
  initialNameKey: string;
}) {
  const [selected, setSelected] = useState(currentTheme || "none");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nameKey, setNameKey] = useState(initialNameKey || "");
  const [nameKeyInput, setNameKeyInput] = useState(initialNameKey || "");
  const [unlockedBackdrops, setUnlockedBackdrops] = useState<PoolBackdrop[]>([]);
  const [nameKeySaving, setNameKeySaving] = useState(false);
  const [nameKeySaved, setNameKeySaved] = useState(false);
  const [nameKeyError, setNameKeyError] = useState("");

  // Compute unlocked backdrops whenever nameKey changes
  useEffect(() => {
    if (nameKey) {
      try {
        const unlocked = getUnlockedBackdrops(nameKey);
        setUnlockedBackdrops(unlocked);
      } catch {
        setUnlockedBackdrops([]);
      }
    } else {
      setUnlockedBackdrops([]);
    }
  }, [nameKey]);

  function handleNameKeyInput(value: string) {
    // Strip non-alpha and enforce max 8
    const cleaned = value.toLowerCase().replace(/[^a-z]/g, "").slice(0, 8);
    setNameKeyInput(cleaned);
    setNameKeyError("");

    if (cleaned) {
      const validation = validateNameKey(cleaned);
      if (validation.valid) {
        setNameKey(validation.normalized);
      } else {
        setNameKeyError(validation.error || "Invalid key");
      }
    } else {
      setNameKey("");
    }
  }

  async function handleSaveNameKey() {
    if (!nameKey && !nameKeyInput) return;
    setNameKeySaving(true);
    setNameKeySaved(false);

    try {
      const res = await fetch("/api/settings/backdrop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameKey: nameKey }),
      });

      if (res.ok) {
        setNameKeySaved(true);
        setTimeout(() => setNameKeySaved(false), 2000);
      }
    } catch {
      // silent fail
    } finally {
      setNameKeySaving(false);
    }
  }

  async function handleSelect(themeId: string) {
    if (themeId === selected) return;
    setSelected(themeId);
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings/backdrop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backdropTheme: themeId }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        // Reload to apply new backdrop in AppShell
        window.location.reload();
      } else {
        setSelected(currentTheme || "none");
      }
    } catch {
      setSelected(currentTheme || "none");
    } finally {
      setSaving(false);
    }
  }

  // Group presets by category, with "none" at the start of the css group
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    presets: BACKDROP_PRESETS.filter((p) =>
      cat === "css" ? p.category === "css" : p.category === cat
    ),
  }));

  const isUnlocked = nameKey.length > 0 && unlockedBackdrops.length > 0;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-zinc-300 text-sm font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Backdrop Theme
          {saving && <Loader2 className="h-3 w-3 animate-spin text-zinc-500 ml-2" />}
          {saved && (
            <span className="text-xs text-emerald-400 ml-2 flex items-center gap-1">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ── Name Key Unlock Section ──────────────────────── */}
        <div className="relative rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/80 via-zinc-900 to-zinc-800/80 p-4 overflow-hidden">
          {/* Subtle gradient border glow */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <div className={`transition-all duration-300 ${isUnlocked ? "text-cyan-400" : "text-zinc-500"}`}>
                {isUnlocked ? (
                  <Unlock className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              <h3 className="text-sm font-medium text-zinc-200">Unlock Your Backdrops</h3>
              {isUnlocked && (
                <Badge className="bg-cyan-900/40 text-cyan-300 text-[10px] px-1.5 py-0 ml-auto">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  {unlockedBackdrops.length} unlocked
                </Badge>
              )}
            </div>

            <p className="text-xs text-zinc-500">
              Enter 1-8 characters from your name to unlock your personal backdrop collection
            </p>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={nameKeyInput}
                  onChange={(e) => handleNameKeyInput(e.target.value)}
                  onBlur={handleSaveNameKey}
                  placeholder="e.g. alex, jm, stone"
                  maxLength={8}
                  className="bg-zinc-800/80 border-zinc-700 text-white font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-sans h-9"
                />
                {nameKeyInput && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">
                    {nameKeyInput.length}/8
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveNameKey}
                disabled={nameKeySaving || !nameKeyInput}
                className="h-9 border-zinc-700 text-zinc-300"
              >
                {nameKeySaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : nameKeySaved ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>

            {nameKeyError && (
              <p className="text-xs text-red-400">{nameKeyError}</p>
            )}

            {nameKey && !nameKeyError && (
              <p className="text-[11px] text-zinc-500">
                Key: <span className="text-zinc-300 font-mono">{nameKey.toUpperCase()}</span>
              </p>
            )}
          </div>
        </div>

        {/* ── Standard Presets ─────────────────────────────── */}
        {grouped.map(({ category, label, presets }) => (
          <div key={category}>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              {label}
              {category === "vanta" && (
                <Badge className="bg-amber-900/40 text-amber-400 text-[10px] px-1.5 py-0">
                  Premium
                </Badge>
              )}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelect(preset.id)}
                  disabled={saving}
                  className={`group relative rounded-lg aspect-[4/3] transition-all duration-150 ${
                    preset.previewClass
                  } ${
                    selected === preset.id
                      ? "ring-2 ring-cyan-400 ring-offset-1 ring-offset-zinc-900"
                      : "ring-1 ring-zinc-700 hover:ring-zinc-500"
                  }`}
                  title={preset.description}
                >
                  {/* Theme name label */}
                  <span className="absolute inset-x-0 bottom-0 text-[10px] text-zinc-300 text-center pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent rounded-b-lg">
                    {preset.name}
                  </span>
                  {/* Selected checkmark */}
                  {selected === preset.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-cyan-400/90 rounded-full p-0.5">
                        <Check className="h-3 w-3 text-zinc-900" />
                      </div>
                    </div>
                  )}
                  {/* Lock icon for particle/vanta placeholders */}
                  {category === "vanta" && (
                    <div className="absolute top-0.5 right-0.5">
                      <Lock className="h-2.5 w-2.5 text-amber-400/60" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* ── Personal Collection (Name-Unlocked) ─────────── */}
        <Separator className="bg-zinc-800" />

        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-purple-400" />
            Your Personal Collection
            {isUnlocked && (
              <span className="text-zinc-400 normal-case">
                ({unlockedBackdrops.length} backdrops)
              </span>
            )}
          </p>

          {isUnlocked ? (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {unlockedBackdrops.map((backdrop) => (
                <button
                  key={backdrop.id}
                  type="button"
                  onClick={() => handleSelect(backdrop.id)}
                  disabled={saving}
                  className={`group relative rounded-lg aspect-[4/3] transition-all duration-150 ${
                    backdrop.previewClass
                  } ${
                    selected === backdrop.id
                      ? "ring-2 ring-purple-400 ring-offset-1 ring-offset-zinc-900"
                      : "ring-1 ring-zinc-700/50 hover:ring-zinc-500"
                  }`}
                  title={backdrop.name}
                >
                  {/* Shimmer overlay for personal backdrops */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
                  {/* Diamond icon overlay */}
                  <div className="absolute top-0.5 right-0.5">
                    <Diamond className="h-2.5 w-2.5 text-purple-400/60" />
                  </div>
                  {/* Theme name label */}
                  <span className="absolute inset-x-0 bottom-0 text-[10px] text-zinc-300 text-center pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent rounded-b-lg">
                    {backdrop.name}
                  </span>
                  {/* Selected checkmark */}
                  {selected === backdrop.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-purple-400/90 rounded-full p-0.5">
                        <Check className="h-3 w-3 text-zinc-900" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="relative rounded-lg border border-zinc-800/50 bg-zinc-800/20 p-8 text-center overflow-hidden">
              {/* Blurred backdrop preview */}
              <div className="absolute inset-0 opacity-20 blur-md bg-gradient-to-br from-purple-900/30 via-zinc-900 to-cyan-900/30 pointer-events-none" />
              <div className="relative">
                <Lock className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">
                  Enter your name key above to unlock personal backdrops
                </p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Each name key reveals a unique set of backdrops from a pool of 100
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-zinc-600">
          Choose a backdrop that appears behind your workspace. All backdrops respect reduced-motion preferences.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Privacy Choices (inline within Security card) ───────

function PrivacyChoicesInline() {
  const [optedOut, setOptedOut] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
    <div className="pt-2 mt-2 border-t border-zinc-800">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors w-full"
      >
        <span>{expanded ? "\u25BC" : "\u25B6"}</span>
        <span>Data &amp; Privacy Preferences</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
            <div>
              <p className="text-zinc-300 font-medium text-xs">Ad Personalization</p>
              <p className="text-[10px] text-zinc-600">
                {optedOut ? "Opted out." : "Contextual relevance enabled."}
              </p>
            </div>
            {optedOut ? (
              <Button size="sm" variant="outline" onClick={handleOptIn} className="text-[10px] h-7 px-2">
                Re-enable
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={handleOptOut} className="text-[10px] h-7 px-2 text-zinc-600">
                Opt Out
              </Button>
            )}
          </div>
          <p className="text-[10px] text-zinc-700">
            Per CCPA/CPRA, you may opt out of personalized advertising.{" "}
            <a href="/privacy" className="text-zinc-600 hover:text-zinc-500 underline">Privacy Policy</a>
          </p>
        </div>
      )}
    </div>
  );
}
