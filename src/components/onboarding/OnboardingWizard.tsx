"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase, PenLine, Code, TrendingUp, GraduationCap, DollarSign,
  Heart, ArrowRight, ArrowLeft, Check, Sparkles, Bot, Rocket,
  ChevronRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface OnboardingWizardProps {
  userName: string | null;
  userTier: string;
}

interface Goal {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  agents: string[];
}

/* ------------------------------------------------------------------ */
/*  GOALS                                                              */
/* ------------------------------------------------------------------ */

const GOALS: Goal[] = [
  {
    id: "start-business",
    label: "Start a Business",
    description: "Business plan, validation, legal setup, launch strategy",
    icon: Rocket,
    color: "text-amber-400 bg-amber-900/20 border-amber-800/40",
    agents: ["business-strategy", "financial-advisor", "market-researcher"],
  },
  {
    id: "grow-business",
    label: "Grow My Business",
    description: "Marketing, scaling, competitive analysis, operations",
    icon: TrendingUp,
    color: "text-emerald-400 bg-emerald-900/20 border-emerald-800/40",
    agents: ["marketing-strategist", "seo-specialist", "sales-coach"],
  },
  {
    id: "create-content",
    label: "Create Content",
    description: "Writing, social media, video scripts, email campaigns",
    icon: PenLine,
    color: "text-blue-400 bg-blue-900/20 border-blue-800/40",
    agents: ["content-writer", "social-media-manager", "email-marketer"],
  },
  {
    id: "build-tech",
    label: "Build Something",
    description: "Web apps, code, technical architecture, deployment",
    icon: Code,
    color: "text-purple-400 bg-purple-900/20 border-purple-800/40",
    agents: ["full-stack-developer", "dev-ops-engineer", "ux-designer"],
  },
  {
    id: "learn-grow",
    label: "Learn & Grow",
    description: "Education, skill development, career advancement",
    icon: GraduationCap,
    color: "text-cyan-400 bg-cyan-900/20 border-cyan-800/40",
    agents: ["academic-tutor", "resume-linkedin", "platform-onboarding"],
  },
  {
    id: "manage-money",
    label: "Manage Finances",
    description: "Budgeting, investing basics, financial planning",
    icon: DollarSign,
    color: "text-green-400 bg-green-900/20 border-green-800/40",
    agents: ["financial-advisor", "tax-strategy", "bookkeeper"],
  },
];

/* ------------------------------------------------------------------ */
/*  AGENT RECOMMENDATIONS per goal                                     */
/* ------------------------------------------------------------------ */

const AGENT_RECOMMENDATIONS: Record<string, { name: string; slug: string; desc: string }[]> = {
  "start-business": [
    { name: "Business Strategist", slug: "business-strategy", desc: "Build your business plan and validate your idea" },
    { name: "Financial Advisor", slug: "financial-advisor", desc: "Startup costs, pricing strategy, revenue modeling" },
    { name: "Brand Identity Designer", slug: "brand-identity", desc: "Name, logo direction, brand positioning" },
  ],
  "grow-business": [
    { name: "Marketing Strategist", slug: "marketing-strategist", desc: "Growth playbook, channel strategy, campaigns" },
    { name: "SEO Specialist", slug: "seo-specialist", desc: "Organic traffic, keyword strategy, content optimization" },
    { name: "Sales Coach", slug: "sales-coach", desc: "Sales scripts, objection handling, pipeline management" },
  ],
  "create-content": [
    { name: "Content Writer", slug: "content-writer", desc: "Blog posts, articles, website copy, newsletters" },
    { name: "Social Media Manager", slug: "social-media-manager", desc: "Content calendar, captions, engagement strategy" },
    { name: "Email Marketer", slug: "email-marketer", desc: "Email sequences, subject lines, conversion optimization" },
  ],
  "build-tech": [
    { name: "Full-Stack Developer", slug: "full-stack-developer", desc: "Architecture, code, debugging, deployment" },
    { name: "UX Designer", slug: "ux-designer", desc: "User flows, wireframes, design systems" },
    { name: "DevOps Engineer", slug: "dev-ops-engineer", desc: "CI/CD, hosting, infrastructure, monitoring" },
  ],
  "learn-grow": [
    { name: "Academic Tutor", slug: "academic-tutor", desc: "Learning plans, explanations, skill building" },
    { name: "Resume & LinkedIn", slug: "resume-linkedin", desc: "Resume optimization, LinkedIn profile, job strategy" },
    { name: "Platform Onboarding", slug: "platform-onboarding", desc: "Master every Stone AI feature" },
  ],
  "manage-money": [
    { name: "Financial Advisor", slug: "financial-advisor", desc: "Budgeting, planning, investment fundamentals" },
    { name: "Tax Strategist", slug: "tax-strategy", desc: "Deductions, business structure, tax planning" },
    { name: "Bookkeeper", slug: "bookkeeper", desc: "Record-keeping, invoicing, expense tracking" },
  ],
};

/* ------------------------------------------------------------------ */
/*  BESTIE QUICK-CREATE OPTIONS                                        */
/* ------------------------------------------------------------------ */

const BESTIE_PRESETS = [
  { emoji: "\uD83D\uDC9C", name: "Luna", traits: ["empathetic", "calm", "creative"], style: "supportive" },
  { emoji: "\uD83D\uDD25", name: "Max", traits: ["motivating", "direct", "adventurous"], style: "hype" },
  { emoji: "\u2728", name: "Sage", traits: ["intellectual", "calm", "nurturing"], style: "mentor" },
  { emoji: "\uD83C\uDF1F", name: "Nova", traits: ["playful", "creative", "witty"], style: "casual" },
];

/* ------------------------------------------------------------------ */
/*  WIZARD COMPONENT                                                   */
/* ------------------------------------------------------------------ */

export function OnboardingWizard({ userName, userTier }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [creatingBestie, setCreatingBestie] = useState(false);
  const [bestieCreated, setBestieCreated] = useState(false);
  const [saving, setSaving] = useState(false);

  const firstName = userName?.split(" ")[0] || "there";

  const toggleGoal = useCallback((goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : prev.length < 3
          ? [...prev, goalId]
          : prev
    );
  }, []);

  async function saveStep(nextStep: number) {
    setSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-step", step: nextStep }),
      });
    } catch {}
    setSaving(false);
  }

  async function saveGoals() {
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-goals", goals: selectedGoals }),
    });
  }

  async function handleNext() {
    if (step === 1) await saveGoals();
    const next = step + 1;
    await saveStep(next);
    setStep(next);
  }

  async function handleSkip() {
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "skip" }),
    });
    router.push("/app");
    router.refresh();
  }

  async function handleComplete() {
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });
    router.push("/app");
    router.refresh();
  }

  async function handleStartChat(agentSlug: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Getting Started", agentSlug }),
    });
    const data = await res.json();
    if (data.conversation) {
      // Complete onboarding first
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      router.push(`/app/chat/${data.conversation.id}`);
    }
  }

  async function handleCreateBestie(preset: typeof BESTIE_PRESETS[0]) {
    setCreatingBestie(true);
    try {
      const res = await fetch("/api/bestie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: preset.name,
          traits: preset.traits,
          style: preset.style,
          expertise: ["wellness"],
          avatarEmoji: preset.emoji,
        }),
      });
      if (res.ok) setBestieCreated(true);
    } catch {}
    setCreatingBestie(false);
  }

  /* ------------------------------------------------------------------ */
  /*  STEP RENDERERS                                                     */
  /* ------------------------------------------------------------------ */

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
        <div className="max-w-xl w-full text-center space-y-8">
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 text-zinc-600 hover:text-zinc-400 text-sm flex items-center gap-1"
          >
            Skip <X className="h-3.5 w-3.5" />
          </button>

          {/* Progress */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? "bg-amber-500" : "bg-zinc-800"}`} />
            ))}
          </div>

          {/* Hero */}
          <div className="space-y-3">
            <div className="text-5xl">{"\u{1F44B}"}</div>
            <h1 className="text-3xl font-bold text-white">
              Welcome to Stone AI, {firstName}!
            </h1>
            <p className="text-zinc-400 text-lg max-w-md mx-auto">
              Your AI-powered business command center. Let&apos;s set you up in under 2 minutes.
            </p>
          </div>

          {/* What you get */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { icon: Bot, label: "42 AI Agents", desc: "Specialists for every business need" },
              { icon: Heart, label: "AI Bestie", desc: "Your personal companion that remembers you" },
              { icon: Briefcase, label: "Full Business Suite", desc: "Plan, build, market, and scale" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <item.icon className="h-5 w-5 text-amber-400" />
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3 rounded-full text-base"
          >
            Let&apos;s Go <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 1: Goals
  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 text-zinc-600 hover:text-zinc-400 text-sm flex items-center gap-1"
          >
            Skip <X className="h-3.5 w-3.5" />
          </button>

          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? "bg-amber-500" : "bg-zinc-800"}`} />
            ))}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">What brings you here?</h2>
            <p className="text-zinc-400">Pick up to 3 goals. We&apos;ll match you with the right AI agents.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GOALS.map((goal) => {
              const selected = selectedGoals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selected
                      ? "bg-amber-900/30 border-amber-500 ring-1 ring-amber-500/50"
                      : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <goal.icon className={`h-5 w-5 mb-2 ${selected ? "text-amber-400" : "text-zinc-500"}`} />
                  <p className={`text-sm font-medium ${selected ? "text-white" : "text-zinc-300"}`}>
                    {goal.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{goal.description}</p>
                  {selected && (
                    <div className="mt-2">
                      <Check className="h-4 w-4 text-amber-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(0)} className="text-zinc-400">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={selectedGoals.length === 0 || saving}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 rounded-full"
            >
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Recommended Agents
  if (step === 2) {
    const recommendations = selectedGoals.flatMap(
      (g) => AGENT_RECOMMENDATIONS[g] || []
    );
    // Deduplicate by slug
    const unique = recommendations.filter(
      (r, i, arr) => arr.findIndex((a) => a.slug === r.slug) === i
    );

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 text-zinc-600 hover:text-zinc-400 text-sm flex items-center gap-1"
          >
            Skip <X className="h-3.5 w-3.5" />
          </button>

          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? "bg-amber-500" : "bg-zinc-800"}`} />
            ))}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Your AI Team</h2>
            <p className="text-zinc-400">Based on your goals, here are the agents ready to help.</p>
          </div>

          <div className="space-y-3 text-left">
            {unique.slice(0, 6).map((agent) => (
              <div
                key={agent.slug}
                className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-900/30 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{agent.name}</p>
                    <p className="text-xs text-zinc-500">{agent.desc}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
                  onClick={() => handleStartChat(agent.slug)}
                >
                  Try It <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-600">
            You can access all 42 agents anytime from the sidebar.
          </p>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-400">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 rounded-full"
            >
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Meet Your Bestie
  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
        <div className="max-w-xl w-full text-center space-y-8">
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 text-zinc-600 hover:text-zinc-400 text-sm flex items-center gap-1"
          >
            Skip <X className="h-3.5 w-3.5" />
          </button>

          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? "bg-amber-500" : "bg-zinc-800"}`} />
            ))}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Meet Your AI Bestie</h2>
            <p className="text-zinc-400">
              Pick a personality and we&apos;ll create your personal AI companion. You can customize more later.
            </p>
          </div>

          {bestieCreated ? (
            <div className="p-8 rounded-2xl bg-gradient-to-br from-pink-950/40 to-purple-950/40 border border-pink-800/30 space-y-4">
              <div className="text-4xl">{"\u{1F389}"}</div>
              <p className="text-lg font-medium text-white">Your Bestie is ready!</p>
              <p className="text-sm text-zinc-400">
                Find them in &quot;My Bestie&quot; in the sidebar anytime.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {BESTIE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  disabled={creatingBestie}
                  onClick={() => handleCreateBestie(preset)}
                  className="p-5 rounded-xl bg-gradient-to-br from-pink-950/30 to-purple-950/30 border border-pink-800/30 hover:border-pink-600/50 transition-all text-left group"
                >
                  <div className="text-3xl mb-3">{preset.emoji}</div>
                  <p className="text-base font-medium text-white group-hover:text-pink-300 transition-colors">
                    {preset.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 capitalize">
                    {preset.traits.join(", ")}
                  </p>
                  <p className="text-[10px] text-pink-400/60 mt-1 capitalize">{preset.style} style</p>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(2)} className="text-zinc-400">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 rounded-full"
            >
              {bestieCreated ? "Continue" : "Skip for Now"} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Ready to Go
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? "bg-amber-500" : "bg-zinc-800"}`} />
          ))}
        </div>

        <div className="space-y-3">
          <div className="text-5xl">{"\u{1F680}"}</div>
          <h2 className="text-2xl font-bold text-white">You&apos;re all set, {firstName}!</h2>
          <p className="text-zinc-400">
            Your AI command center is ready. Here&apos;s how to get the most out of Stone AI:
          </p>
        </div>

        <div className="space-y-3 text-left">
          {[
            { icon: Bot, label: "Chat with any agent", desc: "Click \"New Chat\" and pick an agent from the sidebar or start typing" },
            { icon: Heart, label: "Talk to your Bestie", desc: "Your AI companion remembers you and grows with every conversation" },
            { icon: Sparkles, label: "Explore Discover", desc: "Find agents by category, see what's popular, unlock new ones" },
            { icon: Briefcase, label: "Build your business", desc: "Use agents together to plan, create, market, and scale" },
          ].map((tip) => (
            <div key={tip.label} className="flex items-start gap-3 p-3 rounded-lg">
              <tip.icon className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">{tip.label}</p>
                <p className="text-xs text-zinc-500">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => handleStartChat("platform-onboarding")}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3 rounded-full text-base"
          >
            Chat with Onboarding Guide <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            variant="ghost"
            onClick={handleComplete}
            disabled={saving}
            className="text-zinc-400 hover:text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
