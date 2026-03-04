"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  CreditCard,
  Headphones,
  Lock,
  Send,
  Shield,
  Users,
  Zap,
  Brain,
  Server,
  CalendarClock,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SalesWidget } from "@/components/sales/SalesWidget";

// ─── Pricing Constants ───────────────────────────────────────────────

const BASE_PRICE = 500;
const BASE_SEATS = 3;
const BASE_API_REQUESTS = 5_000;
const BASE_CONCURRENT = 5;

const SEAT_TIERS = [
  { min: 4, max: 25, perSeat: 75 },
  { min: 26, max: 50, perSeat: 60 },
] as const;

const API_OPTIONS = [
  { label: "5K/day", value: 5_000, cost: 0 },
  { label: "15K/day", value: 15_000, cost: 250 },
  { label: "30K/day", value: 30_000, cost: 500 },
  { label: "60K/day", value: 60_000, cost: 900 },
] as const;

const CONCURRENT_OPTIONS = [
  { label: "5", value: 5, cost: 0 },
  { label: "15", value: 15, cost: 150 },
  { label: "30", value: 30, cost: 300 },
  { label: "50", value: 50, cost: 500 },
] as const;

const SUPPORT_OPTIONS = [
  {
    label: "Standard",
    value: "standard",
    cost: 0,
    desc: "Email support, 48h response",
  },
  {
    label: "Priority",
    value: "priority",
    cost: 250,
    desc: "8h response, chat support",
  },
  {
    label: "Dedicated",
    value: "dedicated",
    cost: 600,
    desc: "2h response, Slack + phone",
  },
] as const;

const SLA_OPTIONS = [
  { label: "99.5%", value: "99.5", cost: 0 },
  { label: "99.9%", value: "99.9", cost: 150 },
  { label: "99.99%", value: "99.99", cost: 400 },
] as const;

const MODEL_OPTIONS = [
  {
    label: "Standard",
    value: "standard",
    cost: 0,
    desc: "Llama 3.1 70B + GPT-4o",
  },
  {
    label: "Custom Fine-Tuning",
    value: "fine-tuning",
    cost: 600,
    desc: "Fine-tuned models for your domain",
  },
  {
    label: "Dedicated GPU",
    value: "dedicated-gpu",
    cost: 0,
    desc: "Reserved compute — custom quote",
    customQuote: true,
  },
] as const;

const TOKEN_OPTIONS = [
  { label: "32K tokens", value: 32_000, cost: 0 },
  { label: "64K tokens", value: 64_000, cost: 200 },
  { label: "128K tokens", value: 128_000, cost: 400 },
] as const;

const BILLING_PERIODS = [
  { key: "monthly", label: "Monthly", discount: 0, months: 1 },
  { key: "semiannual", label: "6 Months", discount: 10, months: 6 },
  { key: "annual", label: "Annual", discount: 20, months: 12 },
] as const;

const FINANCING_OPTIONS = [
  {
    key: "none",
    label: "Pay Now",
    desc: "Standard billing — pay at start of each period",
    terms: null,
  },
  {
    key: "net-30",
    label: "Net 30",
    desc: "Start today, first invoice due in 30 days",
    terms: "30-day deferred billing. No fees, no interest.",
  },
  {
    key: "net-60",
    label: "Net 60",
    desc: "Start today, first invoice due in 60 days",
    terms: "60-day deferred billing. No fees, no interest.",
  },
  {
    key: "net-90",
    label: "Net 90",
    desc: "Start today, first invoice due in 90 days",
    terms: "90-day deferred billing. No fees, no interest. Annual commitment required.",
  },
] as const;

const STEPS = [
  { label: "Team & Usage", icon: Users },
  { label: "Support & Reliability", icon: Headphones },
  { label: "Security & Models", icon: Shield },
  { label: "Review & Submit", icon: Send },
] as const;

// ─── Types ───────────────────────────────────────────────────────────

interface Config {
  seats: number;
  apiRequests: number;
  concurrent: number;
  support: string;
  sla: string;
  auditLogExport: boolean;
  complianceReports: boolean;
  model: string;
  responseTokens: number;
  billingPeriod: string;
  financing: string;
  companyName: string;
  contactEmail: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function calcSeatCost(seats: number): number {
  if (seats <= BASE_SEATS) return 0;
  let cost = 0;
  const extra = seats - BASE_SEATS;
  for (const tier of SEAT_TIERS) {
    const seatsInTier = Math.min(
      Math.max(0, seats - (tier.min - 1)),
      tier.max - tier.min + 1
    );
    if (seatsInTier > 0 && seats >= tier.min) {
      cost += seatsInTier * tier.perSeat;
    }
  }
  // For seats > 50, use the higher tier rate
  if (extra > 0 && seats <= BASE_SEATS + (SEAT_TIERS[0].max - BASE_SEATS)) {
    cost = Math.min(extra, SEAT_TIERS[0].max - BASE_SEATS) * SEAT_TIERS[0].perSeat;
  }
  // Recalculate properly
  cost = 0;
  for (let s = BASE_SEATS + 1; s <= seats; s++) {
    if (s <= 25) cost += 75;
    else if (s <= 50) cost += 60;
    else cost += 60; // 50+ uses same rate as tier 2
  }
  return cost;
}

function findOption<T extends { value: string | number }>(
  options: readonly T[],
  value: string | number
): T | undefined {
  return options.find((o) => o.value === value);
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Component ───────────────────────────────────────────────────────

export function EnterpriseConfigurator() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [priceOpen, setPriceOpen] = useState(false);

  const [config, setConfig] = useState<Config>({
    seats: 5,
    apiRequests: 5_000,
    concurrent: 5,
    support: "standard",
    sla: "99.5",
    auditLogExport: false,
    complianceReports: false,
    model: "standard",
    responseTokens: 32_000,
    billingPeriod: "monthly",
    financing: "none",
    companyName: "",
    contactEmail: "",
  });

  const update = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      // Net-90 financing requires annual billing
      if (key === "financing" && value === "net-90" && next.billingPeriod !== "annual") {
        next.billingPeriod = "annual";
      }
      return next;
    });

  // ─── Pricing Calculation ─────────────────────────────────

  const pricing = useMemo(() => {
    const seatCost = calcSeatCost(config.seats);
    const apiCost =
      findOption(API_OPTIONS, config.apiRequests)?.cost ?? 0;
    const concurrentCost =
      findOption(CONCURRENT_OPTIONS, config.concurrent)?.cost ?? 0;
    const supportCost =
      findOption(SUPPORT_OPTIONS, config.support)?.cost ?? 0;
    const slaCost = findOption(SLA_OPTIONS, config.sla)?.cost ?? 0;
    const auditCost = config.auditLogExport ? 100 : 0;
    const complianceCost = config.complianceReports ? 250 : 0;
    const modelOpt = findOption(MODEL_OPTIONS, config.model);
    const modelCost = modelOpt?.cost ?? 0;
    const needsCustomQuote =
      "customQuote" in (modelOpt ?? {}) && (modelOpt as { customQuote?: boolean })?.customQuote;
    const tokenCost =
      findOption(TOKEN_OPTIONS, config.responseTokens)?.cost ?? 0;

    const monthly =
      BASE_PRICE +
      seatCost +
      apiCost +
      concurrentCost +
      supportCost +
      slaCost +
      auditCost +
      complianceCost +
      modelCost +
      tokenCost;

    const period = BILLING_PERIODS.find(
      (p) => p.key === config.billingPeriod
    )!;
    const discountedMonthly = monthly * (1 - period.discount / 100);
    const total = discountedMonthly * period.months;

    return {
      base: BASE_PRICE,
      seatCost,
      apiCost,
      concurrentCost,
      supportCost,
      slaCost,
      auditCost,
      complianceCost,
      modelCost,
      tokenCost,
      monthly,
      discountedMonthly,
      total,
      period,
      needsCustomQuote,
      lineItems: [
        { label: "Base plan", cost: BASE_PRICE },
        ...(seatCost > 0
          ? [
              {
                label: `${config.seats} seats (+${config.seats - BASE_SEATS} extra)`,
                cost: seatCost,
              },
            ]
          : []),
        ...(apiCost > 0
          ? [
              {
                label: `${(config.apiRequests / 1000).toFixed(0)}K API requests/day`,
                cost: apiCost,
              },
            ]
          : []),
        ...(concurrentCost > 0
          ? [
              {
                label: `${config.concurrent} concurrent connections`,
                cost: concurrentCost,
              },
            ]
          : []),
        ...(supportCost > 0
          ? [
              {
                label: `${findOption(SUPPORT_OPTIONS, config.support)?.label} support`,
                cost: supportCost,
              },
            ]
          : []),
        ...(slaCost > 0
          ? [{ label: `${config.sla}% SLA`, cost: slaCost }]
          : []),
        ...(auditCost > 0
          ? [{ label: "Audit log export", cost: auditCost }]
          : []),
        ...(complianceCost > 0
          ? [{ label: "Compliance reports", cost: complianceCost }]
          : []),
        ...(modelCost > 0
          ? [
              {
                label: `${findOption(MODEL_OPTIONS, config.model)?.label} models`,
                cost: modelCost,
              },
            ]
          : []),
        ...(tokenCost > 0
          ? [
              {
                label: `${(config.responseTokens / 1000).toFixed(0)}K response tokens`,
                cost: tokenCost,
              },
            ]
          : []),
      ],
    };
  }, [config]);

  // ─── Config Snapshot for Sales Widget ────────────────────

  const configSnapshot = useMemo(() => {
    const lines = [
      `Seats: ${config.seats}`,
      `API Requests: ${(config.apiRequests / 1000).toFixed(0)}K/day`,
      `Concurrent: ${config.concurrent}`,
      `Support: ${config.support}`,
      `SLA: ${config.sla}%`,
      `Model: ${config.model}`,
      `Tokens: ${(config.responseTokens / 1000).toFixed(0)}K`,
      `Billing: ${config.billingPeriod}`,
      config.auditLogExport ? "Audit log export: Yes" : "",
      config.complianceReports ? "Compliance reports: Yes" : "",
      config.financing !== "none" ? `Financing: ${config.financing}` : "",
      `Estimated: ${formatMoney(pricing.discountedMonthly)}/mo`,
    ].filter(Boolean);
    return lines.join("\n");
  }, [config, pricing.discountedMonthly]);

  // ─── Submit ──────────────────────────────────────────────

  async function handleSubmit() {
    if (!config.companyName.trim() || !config.contactEmail.trim()) {
      setError("Company name and contact email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          estimatedMonthly: pricing.discountedMonthly,
          estimatedTotal: pricing.total,
          billingPeriod: config.billingPeriod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setReferenceId(data.referenceId);
      setSubmitted(true);
      // Notify sales widget to log "submitted" outcome
      window.dispatchEvent(new Event("sales-widget-log-submitted"));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Success State ───────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-8 bg-zinc-900 border-zinc-800 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-900/50 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Configuration Submitted</h2>
          <p className="text-zinc-400 mb-4">
            Your enterprise plan request has been received. Our team will review
            your configuration and reach out within 24 hours.
          </p>
          <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-zinc-500 mb-1">Reference ID</p>
            <p className="font-mono text-emerald-400">{referenceId}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-zinc-500 mb-2">Estimated Pricing</p>
            <p className="text-2xl font-bold text-white">
              {formatMoney(pricing.discountedMonthly)}
              <span className="text-sm text-zinc-500 font-normal">/mo</span>
            </p>
            {pricing.period.discount > 0 && (
              <p className="text-sm text-emerald-400 mt-1">
                {pricing.period.discount}% {pricing.period.label.toLowerCase()}{" "}
                discount applied
              </p>
            )}
          </div>
          {config.financing !== "none" && (
            <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-zinc-500 mb-1">AI Spend Financing</p>
              <p className="text-white font-medium">
                {FINANCING_OPTIONS.find((o) => o.key === config.financing)?.label}
              </p>
              <p className="text-sm text-emerald-400 mt-1">
                {FINANCING_OPTIONS.find((o) => o.key === config.financing)?.terms}
              </p>
            </div>
          )}
          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-500">
            <Link href="/">Back to Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // ─── Option Selector Components ──────────────────────────

  function OptionCard({
    selected,
    onClick,
    label,
    desc,
    cost,
    customQuote,
  }: {
    selected: boolean;
    onClick: () => void;
    label: string;
    desc?: string;
    cost: number;
    customQuote?: boolean;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left p-4 rounded-lg border transition-all ${
          selected
            ? "border-emerald-500 bg-emerald-900/20"
            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">{label}</p>
            {desc && <p className="text-sm text-zinc-400 mt-0.5">{desc}</p>}
          </div>
          <div className="text-right">
            {customQuote ? (
              <Badge className="bg-amber-900/50 text-amber-300 border-amber-800">
                Custom Quote
              </Badge>
            ) : cost === 0 ? (
              <span className="text-sm text-zinc-500">Included</span>
            ) : (
              <span className="text-emerald-400 font-medium">
                +{formatMoney(cost)}/mo
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  function CheckboxCard({
    checked,
    onChange,
    label,
    cost,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    cost: number;
  }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-full text-left p-4 rounded-lg border transition-all ${
          checked
            ? "border-emerald-500 bg-emerald-900/20"
            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                checked
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-zinc-600"
              }`}
            >
              {checked && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="text-white">{label}</span>
          </div>
          <span className="text-emerald-400 font-medium">
            +{formatMoney(cost)}/mo
          </span>
        </div>
      </button>
    );
  }

  // ─── Step Content ────────────────────────────────────────

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" /> Team Size
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Base includes {BASE_SEATS} seats. $75/seat for 4-25, $60/seat
                for 26-50.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={3}
                  max={100}
                  value={config.seats}
                  onChange={(e) => update("seats", Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-zinc-700"
                />
                <div className="bg-zinc-800 rounded-lg px-4 py-2 min-w-[80px] text-center">
                  <span className="text-xl font-bold text-white">
                    {config.seats}
                  </span>
                  <span className="text-zinc-500 text-sm ml-1">seats</span>
                </div>
              </div>
              {config.seats > BASE_SEATS && (
                <p className="text-sm text-emerald-400 mt-2">
                  +{formatMoney(pricing.seatCost)}/mo for{" "}
                  {config.seats - BASE_SEATS} extra seats
                </p>
              )}
            </div>

            <Separator className="bg-zinc-800" />

            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" /> API Requests / Day
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Each request consumes GPU cycles and bandwidth.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {API_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={config.apiRequests === opt.value}
                    onClick={() => update("apiRequests", opt.value)}
                    label={opt.label}
                    cost={opt.cost}
                  />
                ))}
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Server className="h-5 w-5 text-emerald-400" /> Concurrent
                Connections
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Concurrency reserves GPU memory for simultaneous requests.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {CONCURRENT_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={config.concurrent === opt.value}
                    onClick={() => update("concurrent", opt.value)}
                    label={`${opt.label} connections`}
                    cost={opt.cost}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Headphones className="h-5 w-5 text-emerald-400" /> Support Tier
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Higher tiers get faster response times and more channels.
              </p>
              <div className="space-y-3">
                {SUPPORT_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={config.support === opt.value}
                    onClick={() => update("support", opt.value)}
                    label={opt.label}
                    desc={opt.desc}
                    cost={opt.cost}
                  />
                ))}
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" /> Uptime SLA
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Higher SLA requires redundant infrastructure investment.
              </p>
              <div className="space-y-3">
                {SLA_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={config.sla === opt.value}
                    onClick={() => update("sla", opt.value)}
                    label={`${opt.label} uptime`}
                    cost={opt.cost}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-400" /> Security Add-ons
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                SSO/SAML is included in all enterprise plans.
              </p>
              <div className="space-y-3">
                <CheckboxCard
                  checked={config.auditLogExport}
                  onChange={(v) => update("auditLogExport", v)}
                  label="Audit Log Export"
                  cost={100}
                />
                <CheckboxCard
                  checked={config.complianceReports}
                  onChange={(v) => update("complianceReports", v)}
                  label="Compliance Reports"
                  cost={250}
                />
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Brain className="h-5 w-5 text-emerald-400" /> Model Options
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Standard includes Llama 3.1 70B + GPT-4o.
              </p>
              <div className="space-y-3">
                {MODEL_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={config.model === opt.value}
                    onClick={() => update("model", opt.value)}
                    label={opt.label}
                    desc={opt.desc}
                    cost={opt.cost}
                    customQuote={"customQuote" in opt && (opt as { customQuote?: boolean }).customQuote}
                  />
                ))}
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" /> Response Token
                Limit
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Longer responses consume more GPU time per request.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {TOKEN_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={config.responseTokens === opt.value}
                    onClick={() => update("responseTokens", opt.value)}
                    label={opt.label}
                    cost={opt.cost}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Line Items */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Plan Summary</h3>
              <div className="space-y-2">
                {pricing.lineItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/50"
                  >
                    <span className="text-zinc-300">{item.label}</span>
                    <span className="text-white font-medium">
                      {formatMoney(item.cost)}/mo
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {pricing.needsCustomQuote && (
              <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
                <p className="text-amber-300 text-sm">
                  Dedicated GPU pricing will be quoted separately based on your
                  workload requirements.
                </p>
              </div>
            )}

            <Separator className="bg-zinc-800" />

            {/* Billing Period */}
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                Billing Period
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {BILLING_PERIODS.map((period) => (
                  <button
                    key={period.key}
                    type="button"
                    onClick={() => update("billingPeriod", period.key)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      config.billingPeriod === period.key
                        ? "border-emerald-500 bg-emerald-900/20"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                    }`}
                  >
                    <p className="font-medium text-white text-sm">
                      {period.label}
                    </p>
                    {period.discount > 0 && (
                      <p className="text-emerald-400 text-xs mt-0.5">
                        Save {period.discount}%
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            {/* AI Spend Financing */}
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2">
                <CalendarClock className="h-4 w-4" /> AI Spend Financing
              </h3>
              <p className="text-xs text-zinc-500 mb-3">
                Start using Stone AI today — pay later. Zero fees, zero interest.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FINANCING_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => update("financing", opt.key)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      config.financing === opt.key
                        ? "border-emerald-500 bg-emerald-900/20"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                    }`}
                  >
                    <p className="font-medium text-white text-sm">
                      {opt.label}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
              {config.financing !== "none" && (
                <div className="mt-3 bg-emerald-900/10 border border-emerald-800/50 rounded-lg p-3">
                  <p className="text-sm text-emerald-300">
                    {FINANCING_OPTIONS.find((o) => o.key === config.financing)?.terms}
                  </p>
                  {config.financing === "net-90" && config.billingPeriod !== "annual" && (
                    <p className="text-xs text-amber-400 mt-1.5">
                      Net 90 requires annual billing commitment. Your billing period will be updated.
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator className="bg-zinc-800" />

            {/* Total */}
            <div className="bg-zinc-800/80 rounded-lg p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Estimated Monthly</p>
                  <p className="text-3xl font-bold text-white">
                    {formatMoney(pricing.discountedMonthly)}
                    <span className="text-base text-zinc-500 font-normal">
                      /mo
                    </span>
                  </p>
                  {pricing.period.discount > 0 && (
                    <p className="text-sm text-emerald-400 mt-1">
                      <span className="line-through text-zinc-500 mr-2">
                        {formatMoney(pricing.monthly)}
                      </span>
                      {pricing.period.discount}% off
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-400">
                    {pricing.period.label} total
                  </p>
                  <p className="text-xl font-bold text-white">
                    {formatMoney(pricing.total)}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400">
                Contact Information
              </h3>
              <div>
                <label className="text-sm text-zinc-500 mb-1.5 block">
                  Company Name
                </label>
                <Input
                  value={config.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  placeholder="Acme Corp"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-1.5 block">
                  Contact Email
                </label>
                <Input
                  value={config.contactEmail}
                  onChange={(e) => update("contactEmail", e.target.value)}
                  placeholder="cto@acme.com"
                  type="email"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  // ─── Layout ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="font-bold text-lg text-white">Stone AI</span>
          </Link>
          <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-800">
            <Building2 className="h-3 w-3 mr-1" /> Enterprise
          </Badge>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Build Your{" "}
            <span className="text-emerald-400">Enterprise Plan</span>
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Configure exactly what your team needs. Real-time pricing — no
            hidden fees, no sales calls required.
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isComplete = i < step;
            return (
              <button
                key={i}
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                  isActive
                    ? "bg-emerald-900/30 text-emerald-400 border border-emerald-700"
                    : isComplete
                    ? "bg-zinc-800 text-emerald-400 cursor-pointer hover:bg-zinc-700"
                    : "bg-zinc-900 text-zinc-600 cursor-default"
                }`}
                disabled={i > step}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[1fr,320px] gap-8">
          {/* Left: Step Content */}
          <Card className="bg-zinc-900 border-zinc-800 p-6">{renderStep()}</Card>

          {/* Right: Sticky Price Summary (Dropdown) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="bg-zinc-900 border-zinc-800 p-5">
              <button
                type="button"
                onClick={() => setPriceOpen((o) => !o)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-400">
                    Price Summary
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">
                    {formatMoney(pricing.discountedMonthly)}
                    <span className="text-xs text-zinc-500 font-normal">/mo</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-zinc-400 transition-transform ${
                      priceOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {priceOpen && (
                <div className="mt-4">
                  <div className="space-y-1.5 text-sm">
                    {pricing.lineItems.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-zinc-400">{item.label}</span>
                        <span className="text-zinc-300">
                          {formatMoney(item.cost)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-zinc-800 my-4" />

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-zinc-500">Monthly</p>
                      <p className="text-2xl font-bold text-white">
                        {formatMoney(pricing.discountedMonthly)}
                      </p>
                    </div>
                    {pricing.period.discount > 0 && (
                      <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-800">
                        -{pricing.period.discount}%
                      </Badge>
                    )}
                  </div>

                  {pricing.needsCustomQuote && (
                    <p className="text-xs text-amber-400 mt-2">
                      + Dedicated GPU (custom quote)
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 max-w-[calc(100%-320px-2rem)]">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  Get Started <Send className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* AI Sales Advisor Chat Widget */}
      <SalesWidget configSnapshot={configSnapshot} />
    </div>
  );
}
