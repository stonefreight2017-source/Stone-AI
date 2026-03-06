"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Heart, Loader2, Sparkles, Globe, Monitor, Palette, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TraitPicker, StylePicker, ExpertisePicker } from "@/components/bestie/PersonalityPicker";
import { toast } from "sonner";
import type { BestieTrait, BestieStyle, BestieExpertise, BestieLanguage } from "@/lib/bestie-validators";
import { BESTIE_LANGUAGES, BESTIE_LANGUAGE_LABELS } from "@/lib/bestie-validators";

function generatePreviewGreeting(bestieName: string, traits: BestieTrait[], style: BestieStyle): string {
  const greetings: Record<BestieStyle, (n: string) => string> = {
    casual: (n) =>
      `Hey! I'm ${n}, your new bestie! I'm so ready to hang out and chat about literally anything. What's on your mind today?`,
    supportive: (n) =>
      `Hi there! I'm ${n}, and I'm really glad to meet you. I'm here whenever you need someone to talk to, celebrate with, or just listen. How are you doing today?`,
    intellectual: (n) =>
      `Hello! I'm ${n} — your new thinking partner. I love exploring ideas and having meaningful conversations. What's been occupying your thoughts lately?`,
    hype: (n) =>
      `OMG HI!! I'm ${n} and I am SO excited to be your bestie!! You already seem amazing and I just KNOW we're going to have the best time. What's the latest?!`,
  };
  return greetings[style](bestieName);
}

/* ── Purpose / Intent — the #1 question that drives everything ── */
type Purpose = {
  id: string;
  label: string;
  desc: string;
  icon: string;
  suggestedBgs: string[];       // background IDs to surface first
  suggestedAvatarSection: number; // which avatar section to highlight (index)
  defaultStyle: BestieStyle;
  accentColor: string;          // tailwind text color for the card
};

const PURPOSES: Purpose[] = [
  {
    id: "business",
    label: "Business & Productivity",
    desc: "Strategy partner, brainstorming, accountability, career growth",
    icon: "\uD83D\uDCBC",
    suggestedBgs: ["exec-dark", "slate-desk", "blueprint", "boardroom", "carbon"],
    suggestedAvatarSection: 0,
    defaultStyle: "intellectual",
    accentColor: "text-blue-400",
  },
  {
    id: "friendship",
    label: "Friendship & Connection",
    desc: "Someone to talk to, laugh with, and share life moments",
    icon: "\uD83E\uDD1D",
    suggestedBgs: ["sunset", "ocean", "midnight", "warm-amber", "coffee"],
    suggestedAvatarSection: 1,
    defaultStyle: "casual",
    accentColor: "text-pink-400",
  },
  {
    id: "creative",
    label: "Creative & Artistic",
    desc: "Music, art, writing, brainstorming ideas, creative collaborator",
    icon: "\uD83C\uDFA8",
    suggestedBgs: ["aurora", "galaxy", "neon-pink", "canvas", "cyber"],
    suggestedAvatarSection: 2,
    defaultStyle: "hype",
    accentColor: "text-purple-400",
  },
  {
    id: "learning",
    label: "Learning & Growth",
    desc: "Study buddy, tutor, skill development, knowledge explorer",
    icon: "\uD83D\uDCDA",
    suggestedBgs: ["terminal", "dark-ide", "neon-grid", "blueprint", "charcoal"],
    suggestedAvatarSection: 0,
    defaultStyle: "intellectual",
    accentColor: "text-emerald-400",
  },
  {
    id: "wellness",
    label: "Wellness & Support",
    desc: "Emotional support, mindfulness, daily check-ins, motivation",
    icon: "\uD83E\uDDD8",
    suggestedBgs: ["forest", "ocean", "warm-amber", "soft-black", "midnight"],
    suggestedAvatarSection: 1,
    defaultStyle: "supportive",
    accentColor: "text-amber-400",
  },
  {
    id: "tech",
    label: "Tech & Developer",
    desc: "Coding buddy, tech discussions, debugging partner, geek out",
    icon: "\uD83D\uDCBB",
    suggestedBgs: ["terminal", "matrix", "cyber", "neon-grid", "dark-ide"],
    suggestedAvatarSection: 0,
    defaultStyle: "intellectual",
    accentColor: "text-cyan-400",
  },
  {
    id: "fitness",
    label: "Fitness & Health",
    desc: "Workout accountability, nutrition chat, health goals, motivation",
    icon: "\uD83C\uDFCB\uFE0F",
    suggestedBgs: ["charcoal", "forest", "pure-dark", "carbon", "soft-black"],
    suggestedAvatarSection: 1,
    defaultStyle: "hype",
    accentColor: "text-red-400",
  },
  {
    id: "parenting",
    label: "Parenting & Family",
    desc: "Parenting advice, family management, kid-friendly companion",
    icon: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67",
    suggestedBgs: ["warm-amber", "ocean", "forest", "coffee", "sunset"],
    suggestedAvatarSection: 3,
    defaultStyle: "supportive",
    accentColor: "text-orange-400",
  },
];

const AVATAR_SECTIONS = [
  {
    label: "Professional",
    emojis: [
      "\uD83D\uDC68\u200D\uD83D\uDCBC", "\uD83D\uDC69\u200D\uD83D\uDCBC",
      "\uD83D\uDC68\uD83C\uDFFB\u200D\uD83D\uDCBC", "\uD83D\uDC69\uD83C\uDFFB\u200D\uD83D\uDCBC",
      "\uD83D\uDC68\uD83C\uDFFD\u200D\uD83D\uDCBC", "\uD83D\uDC69\uD83C\uDFFD\u200D\uD83D\uDCBC",
      "\uD83D\uDC68\uD83C\uDFFF\u200D\uD83D\uDCBC", "\uD83D\uDC69\uD83C\uDFFF\u200D\uD83D\uDCBC",
      "\uD83E\uDDD1\u200D\uD83D\uDCBB", "\uD83D\uDC69\u200D\uD83D\uDCBB",
      "\uD83D\uDC68\u200D\uD83D\uDCBB", "\uD83E\uDDD1\u200D\uD83C\uDF93",
      "\uD83D\uDC69\u200D\uD83C\uDFEB", "\uD83D\uDC68\u200D\uD83C\uDFEB",
      "\uD83D\uDC69\u200D\u2696\uFE0F", "\uD83D\uDC68\u200D\u2696\uFE0F",
    ],
  },
  {
    label: "People",
    emojis: [
      "\uD83E\uDDD4", "\uD83D\uDC71\u200D\u2640\uFE0F", "\uD83D\uDC71", "\uD83D\uDC69\u200D\uD83E\uDDB0",
      "\uD83D\uDC68\u200D\uD83E\uDDB1", "\uD83D\uDC69\u200D\uD83E\uDDB1", "\uD83D\uDC68\u200D\uD83E\uDDB3", "\uD83D\uDC69\u200D\uD83E\uDDB3",
      "\uD83E\uDDD1\uD83C\uDFFB", "\uD83E\uDDD1\uD83C\uDFFD", "\uD83E\uDDD1\uD83C\uDFFF", "\uD83E\uDDD1\uD83C\uDFFE",
      "\uD83D\uDE0E", "\uD83E\uDD13", "\uD83E\uDDD8", "\uD83C\uDFCB\uFE0F",
    ],
  },
  {
    label: "Creative & Music",
    emojis: [
      "\uD83C\uDFA4", "\uD83C\uDFB8", "\uD83E\uDDD1\u200D\uD83C\uDFA8", "\uD83D\uDC69\u200D\uD83C\uDFA4",
      "\uD83D\uDC68\u200D\uD83C\uDFA4", "\uD83C\uDFB9", "\uD83C\uDFA7", "\uD83D\uDCF7",
    ],
  },
  {
    label: "Fun & Playful",
    emojis: [
      "\uD83D\uDC9C", "\uD83D\uDC96", "\u2764\uFE0F", "\uD83D\uDC99",
      "\uD83E\uDD70", "\uD83E\uDD8B", "\uD83C\uDF38", "\uD83C\uDF3F",
      "\uD83D\uDCAB", "\uD83C\uDF08", "\u2728", "\u2600\uFE0F",
    ],
  },
];

/* ── Background themes ── */
type BgTheme = {
  id: string;
  label: string;
  preview: string; // small CSS gradient/pattern for the picker card
  bg: string; // full-page CSS background
};

type BgCategory = { label: string; themes: BgTheme[] };

const BG_CATEGORIES: BgCategory[] = [
  {
    label: "Office & Professional",
    themes: [
      { id: "exec-dark", label: "Executive Dark", preview: "linear-gradient(135deg,#1a1a2e,#16213e)", bg: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" },
      { id: "slate-desk", label: "Slate Desk", preview: "linear-gradient(180deg,#1e293b,#334155)", bg: "linear-gradient(180deg,#1e293b 0%,#334155 60%,#475569 100%)" },
      { id: "blueprint", label: "Blueprint", preview: "linear-gradient(135deg,#0c1445,#1a237e)", bg: "linear-gradient(135deg,#0c1445 0%,#1a237e 50%,#283593 100%)" },
      { id: "boardroom", label: "Boardroom", preview: "linear-gradient(180deg,#1c1c1c,#2d2d2d)", bg: "linear-gradient(180deg,#1c1c1c 0%,#2d2d2d 40%,#3a3a3a 100%)" },
      { id: "mahogany", label: "Mahogany", preview: "linear-gradient(135deg,#1a0a00,#3e1a00)", bg: "linear-gradient(135deg,#1a0a00 0%,#3e1a00 50%,#5c2d00 100%)" },
      { id: "carbon", label: "Carbon Fiber", preview: "linear-gradient(135deg,#111,#222)", bg: "repeating-linear-gradient(45deg,#111 0px,#111 10px,#1a1a1a 10px,#1a1a1a 20px)" },
    ],
  },
  {
    label: "Tech & Developer",
    themes: [
      { id: "terminal", label: "Terminal", preview: "linear-gradient(180deg,#0a0a0a,#0d1117)", bg: "linear-gradient(180deg,#0a0a0a 0%,#0d1117 50%,#161b22 100%)" },
      { id: "matrix", label: "Matrix", preview: "linear-gradient(180deg,#000,#001a00)", bg: "linear-gradient(180deg,#000000 0%,#001a00 50%,#003300 100%)" },
      { id: "cyber", label: "Cyberpunk", preview: "linear-gradient(135deg,#0a0015,#1a0030)", bg: "linear-gradient(135deg,#0a0015 0%,#1a0030 40%,#2d0050 70%,#0a0015 100%)" },
      { id: "neon-grid", label: "Neon Grid", preview: "linear-gradient(180deg,#0f0f23,#1a1a3e)", bg: "linear-gradient(180deg,#0f0f23 0%,#1a1a3e 100%)" },
      { id: "dark-ide", label: "Dark IDE", preview: "linear-gradient(180deg,#1e1e1e,#252526)", bg: "linear-gradient(180deg,#1e1e1e 0%,#252526 50%,#2d2d30 100%)" },
    ],
  },
  {
    label: "Casual & Lifestyle",
    themes: [
      { id: "sunset", label: "Sunset Chill", preview: "linear-gradient(135deg,#2d1b4e,#4a1942)", bg: "linear-gradient(135deg,#2d1b4e 0%,#4a1942 40%,#6b2048 70%,#2d1b4e 100%)" },
      { id: "ocean", label: "Ocean Breeze", preview: "linear-gradient(180deg,#0a1628,#132e4a)", bg: "linear-gradient(180deg,#0a1628 0%,#132e4a 50%,#1a4a6e 100%)" },
      { id: "midnight", label: "Midnight Sky", preview: "linear-gradient(180deg,#0f0c29,#302b63)", bg: "linear-gradient(180deg,#0f0c29 0%,#302b63 50%,#24243e 100%)" },
      { id: "warm-amber", label: "Warm Amber", preview: "linear-gradient(135deg,#1a1000,#2d1a00)", bg: "linear-gradient(135deg,#1a1000 0%,#2d1a00 40%,#3d2400 70%,#1a1000 100%)" },
      { id: "forest", label: "Forest Night", preview: "linear-gradient(135deg,#0a1a0a,#1a2e1a)", bg: "linear-gradient(135deg,#0a1a0a 0%,#1a2e1a 50%,#2a422a 100%)" },
      { id: "coffee", label: "Coffee Shop", preview: "linear-gradient(180deg,#1a120a,#2d1f14)", bg: "linear-gradient(180deg,#1a120a 0%,#2d1f14 50%,#3d2c1e 100%)" },
    ],
  },
  {
    label: "Creative & Artsy",
    themes: [
      { id: "aurora", label: "Aurora", preview: "linear-gradient(135deg,#0f0c29,#1a3a2a)", bg: "linear-gradient(135deg,#0f0c29 0%,#1a3a2a 30%,#302b63 60%,#24243e 100%)" },
      { id: "galaxy", label: "Galaxy", preview: "linear-gradient(135deg,#0d0221,#150734)", bg: "linear-gradient(135deg,#0d0221 0%,#150734 30%,#0a1647 60%,#1a0533 100%)" },
      { id: "canvas", label: "Artist Canvas", preview: "linear-gradient(180deg,#1a1a17,#2a2a24)", bg: "linear-gradient(180deg,#1a1a17 0%,#2a2a24 50%,#3a3a30 100%)" },
      { id: "neon-pink", label: "Neon Pink", preview: "linear-gradient(135deg,#1a0011,#2d001f)", bg: "linear-gradient(135deg,#1a0011 0%,#2d001f 50%,#3d002d 100%)" },
    ],
  },
  {
    label: "Minimal & Clean",
    themes: [
      { id: "pure-dark", label: "Pure Dark", preview: "linear-gradient(180deg,#09090b,#18181b)", bg: "linear-gradient(180deg,#09090b 0%,#18181b 100%)" },
      { id: "charcoal", label: "Charcoal", preview: "linear-gradient(180deg,#1a1a1a,#262626)", bg: "linear-gradient(180deg,#1a1a1a 0%,#262626 100%)" },
      { id: "soft-black", label: "Soft Black", preview: "linear-gradient(180deg,#111,#1a1a1a)", bg: "linear-gradient(180deg,#111111 0%,#1a1a1a 50%,#222222 100%)" },
    ],
  },
];

export default function CreateBestiePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Step 1: Purpose — WHY are you here?
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);

  // Step 2: Name, Avatar & Language
  const [name, setName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("\uD83D\uDC68\u200D\uD83D\uDCBC");
  const [language, setLanguage] = useState<BestieLanguage>("en");

  // Step 3: Background theme
  const [bgTheme, setBgTheme] = useState<string>("pure-dark");

  // Derive context from purposes
  const activePurposes = PURPOSES.filter((p) => selectedPurposes.includes(p.id));
  const suggestedBgIds = [...new Set(activePurposes.flatMap((p) => p.suggestedBgs))];
  const highlightedAvatarSections = [...new Set(activePurposes.map((p) => p.suggestedAvatarSection))];

  // Step 2: Personality
  const [traits, setTraits] = useState<BestieTrait[]>([]);
  const [style, setStyle] = useState<BestieStyle | null>(null);
  const [expertise, setExpertise] = useState<BestieExpertise[]>([]);

  // Step 3: About Me — things a friend should know
  const [aboutName, setAboutName] = useState("");
  const [aboutBirthday, setAboutBirthday] = useState("");
  const [aboutSiblings, setAboutSiblings] = useState("");
  const [aboutLocation, setAboutLocation] = useState("");
  const [aboutFavorites, setAboutFavorites] = useState("");
  const [aboutOther, setAboutOther] = useState("");

  const canNextPurpose = selectedPurposes.length >= 1;
  const canNextName = name.trim().length >= 2 && name.trim().length <= 20;
  const canNextPersonality = traits.length >= 3 && traits.length <= 5 && style !== null && expertise.length >= 1;

  // Resolve active background CSS
  const allBgThemes = BG_CATEGORIES.flatMap((c) => c.themes);
  const activeBg = allBgThemes.find((t) => t.id === bgTheme);

  // Sort backgrounds: suggested ones first based on purpose
  const sortedBgCategories = BG_CATEGORIES.map((cat) => ({
    ...cat,
    themes: [...cat.themes].sort((a, b) => {
      const aMatch = suggestedBgIds.includes(a.id) ? 0 : 1;
      const bMatch = suggestedBgIds.includes(b.id) ? 0 : 1;
      return aMatch - bMatch;
    }),
  }));

  // When purpose changes, auto-set defaults
  function handlePurposeToggle(purposeId: string) {
    setSelectedPurposes((prev) => {
      const next = prev.includes(purposeId)
        ? prev.filter((p) => p !== purposeId)
        : prev.length < 3 ? [...prev, purposeId] : prev;
      // Auto-set style from first purpose if not yet chosen
      if (!style && next.length > 0) {
        const first = PURPOSES.find((p) => p.id === next[0]);
        if (first) setStyle(first.defaultStyle);
      }
      // Auto-set background from first purpose
      if (next.length > 0) {
        const first = PURPOSES.find((p) => p.id === next[0]);
        if (first && first.suggestedBgs[0]) setBgTheme(first.suggestedBgs[0]);
      }
      return next;
    });
  }

  async function handleCreate() {
    if (!canNextPersonality || !style) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/bestie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          purposes: selectedPurposes,
          traits,
          style,
          expertise,
          avatarEmoji,
          language,
          bgTheme,
          aboutMe: {
            name: aboutName.trim() || undefined,
            birthday: aboutBirthday.trim() || undefined,
            siblings: aboutSiblings.trim() || undefined,
            location: aboutLocation.trim() || undefined,
            favorites: aboutFavorites.trim() || undefined,
            other: aboutOther.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.bestie) {
        // Check for Easter egg (server-side validated)
        if (data.easterEgg) {
          setEasterEgg(data.easterEgg);
          toast.success(`Easter Egg Discovered! ${data.easterEgg.reward}`);
          // Delay redirect so user sees the egg
          await new Promise((r) => setTimeout(r, 3000));
        } else {
          toast.success(`${name} is ready! Let's chat!`);
        }
        // Create first conversation and redirect to chat
        const convRes = await fetch(`/api/bestie/${data.bestie.id}/conversations`, {
          method: "POST",
        });
        const convData = await convRes.json();
        if (convData.conversation) {
          router.push(`/app/bestie/chat/${convData.conversation.id}`);
        } else {
          router.push("/app/bestie");
        }
      } else {
        toast.error(data.error || "Could not create bestie");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsCreating(false);
    }
  }

  // Easter egg state — checked server-side only after creation
  const [easterEgg, setEasterEgg] = useState<{
    reward: string;
    message: string;
    discountPercent?: number;
    badge?: { color: string; colorName: string; sign: string };
  } | null>(null);

  const TOTAL_STEPS = 6;

  return (
    <div
      className="min-h-screen transition-all duration-700 ease-in-out"
      style={{ background: activeBg?.bg ?? "#09090b" }}
    >
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white"
            onClick={() => (step > 1 ? setStep(step - 1) : router.push("/app/bestie"))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Create Your Bestie</h1>
            <p className="text-xs text-pink-400/70">Step {step} of {TOTAL_STEPS}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step
                  ? "bg-gradient-to-r from-pink-500 to-purple-500"
                  : "bg-zinc-800/60"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Purpose — Why are you here? */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Target className="h-8 w-8 mx-auto text-purple-400" />
              <p className="text-lg text-zinc-300">What brings you here?</p>
              <p className="text-sm text-zinc-500">Pick 1-3 reasons. This shapes your entire experience.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PURPOSES.map((p) => {
                const selected = selectedPurposes.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePurposeToggle(p.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selected
                        ? "bg-pink-500/10 border-pink-500 scale-[1.02]"
                        : "bg-zinc-800/60 border-zinc-700/60 hover:border-zinc-500 backdrop-blur-sm"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <p className={`text-sm font-medium ${selected ? "text-white" : "text-zinc-300"}`}>{p.label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{p.desc}</p>
                      </div>
                    </div>
                    {selected && (
                      <div className={`mt-2 text-[10px] ${p.accentColor} font-medium`}>Selected</div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedPurposes.length > 0 && (
              <p className="text-center text-xs text-zinc-500">
                {selectedPurposes.length}/3 selected
              </p>
            )}

            <Button
              onClick={() => setStep(2)}
              disabled={!canNextPurpose}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-12"
            >
              Next: Name & Avatar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Name & Avatar */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg text-zinc-300">What should your Bestie be called?</p>
              <p className="text-sm text-zinc-500">Give them a name that feels right to you</p>
            </div>

            <div className="space-y-4">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Luna, Max, Sage, River..."
                maxLength={20}
                className="bg-zinc-800/80 border-zinc-700 text-white text-center text-lg h-14 placeholder:text-zinc-600 backdrop-blur-sm"
                autoFocus
              />
              <p className="text-center text-xs text-zinc-500">{name.length}/20 characters</p>
            </div>

            <div>
              <p className="text-sm text-zinc-400 mb-3 text-center">Pick an avatar</p>
              <div className="space-y-4 max-w-md mx-auto">
                {AVATAR_SECTIONS.map((section, idx) => (
                  <div key={section.label}>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
                      {section.label}
                      {highlightedAvatarSections.includes(idx) && (
                        <span className="ml-2 text-pink-400 normal-case tracking-normal">- Recommended</span>
                      )}
                    </p>
                    <div className="grid grid-cols-8 gap-2">
                      {section.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setAvatarEmoji(emoji)}
                          className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                            avatarEmoji === emoji
                              ? "bg-pink-500/20 border-2 border-pink-500 scale-110"
                              : "bg-zinc-800/60 border border-zinc-700/60 hover:border-pink-700 backdrop-blur-sm"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Language picker */}
            <div>
              <p className="text-sm text-zinc-400 mb-3 text-center flex items-center justify-center gap-1.5">
                <Globe className="h-4 w-4" />
                What language should {name || "your Bestie"} speak?
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-md mx-auto">
                {BESTIE_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`p-2.5 rounded-lg text-center transition-all ${
                      language === lang
                        ? "bg-pink-500/20 border-2 border-pink-500"
                        : "bg-zinc-800/60 border border-zinc-700/60 hover:border-pink-700 backdrop-blur-sm"
                    }`}
                  >
                    <p className="text-[10px] font-bold text-pink-400">{lang.toUpperCase()}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{BESTIE_LANGUAGE_LABELS[lang]}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setStep(3)}
              disabled={!canNextName}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-12"
            >
              Next: Set the Vibe
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 3: Background / Environment */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Palette className="h-8 w-8 mx-auto text-purple-400" />
              <p className="text-lg text-zinc-300">Set the vibe</p>
              <p className="text-sm text-zinc-500">Pick a backdrop that feels like {name || "your Bestie"}&apos;s world</p>
            </div>

            <div className="space-y-5">
              {sortedBgCategories.map((cat) => (
                <div key={cat.label}>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{cat.label}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {cat.themes.map((theme) => {
                      const isSuggested = suggestedBgIds.includes(theme.id);
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setBgTheme(theme.id)}
                          className={`group relative rounded-xl overflow-hidden transition-all h-20 ${
                            bgTheme === theme.id
                              ? "ring-2 ring-pink-500 scale-[1.03]"
                              : isSuggested
                                ? "ring-2 ring-purple-500/40 hover:ring-purple-400"
                                : "ring-1 ring-zinc-700/50 hover:ring-zinc-500"
                          }`}
                          style={{ background: theme.preview }}
                        >
                          {isSuggested && bgTheme !== theme.id && (
                            <div className="absolute top-1 left-1.5 text-[8px] text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                              For you
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-end justify-center pb-2">
                            <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm ${
                              bgTheme === theme.id
                                ? "bg-pink-500/30 text-pink-200"
                                : "bg-black/40 text-zinc-300 group-hover:text-white"
                            }`}>
                              {theme.label}
                            </span>
                          </div>
                          {bgTheme === theme.id && (
                            <div className="absolute top-1.5 right-1.5 h-4 w-4 bg-pink-500 rounded-full flex items-center justify-center">
                              <Monitor className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep(4)}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-12"
            >
              Next: Personality
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 4: Personality */}
        {step === 4 && (
          <div className="space-y-6">
            <TraitPicker selected={traits} onChange={setTraits} />
            <StylePicker selected={style} onChange={setStyle} />
            <ExpertisePicker selected={expertise} onChange={setExpertise} />

            <Button
              onClick={() => setStep(5)}
              disabled={!canNextPersonality}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-12"
            >
              Next: About You
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 5: About Me */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg text-zinc-300">Tell {name} about yourself</p>
              <p className="text-sm text-zinc-500">Things a friend should know. All fields are optional.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Your name</label>
                <Input value={aboutName} onChange={(e) => setAboutName(e.target.value)} placeholder="What should they call you?" maxLength={50} className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-600 backdrop-blur-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Birthday</label>
                <Input value={aboutBirthday} onChange={(e) => setAboutBirthday(e.target.value)} placeholder="e.g. March 15, July 4th" maxLength={20} className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-600 backdrop-blur-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Siblings</label>
                <Input value={aboutSiblings} onChange={(e) => setAboutSiblings(e.target.value)} placeholder="e.g. 2 brothers, 1 sister" maxLength={100} className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-600 backdrop-blur-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Where you live</label>
                <Input value={aboutLocation} onChange={(e) => setAboutLocation(e.target.value)} placeholder="e.g. Austin, Texas" maxLength={100} className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-600 backdrop-blur-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Favorites</label>
                <Input value={aboutFavorites} onChange={(e) => setAboutFavorites(e.target.value)} placeholder="e.g. Coffee, hip-hop, sci-fi movies" maxLength={200} className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-600 backdrop-blur-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Anything else they should know</label>
                <Textarea value={aboutOther} onChange={(e) => setAboutOther(e.target.value)} placeholder="Night owl, dog person, learning guitar..." maxLength={500} rows={3} className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-600 resize-none backdrop-blur-sm" />
              </div>
            </div>

            <Button
              onClick={() => setStep(6)}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-12"
            >
              Next: Preview
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 6: Preview & Confirm */}
        {step === 6 && style && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-5xl">{avatarEmoji}</div>
              <h2 className="text-2xl font-bold text-white">{name}</h2>
              <div className="flex flex-wrap justify-center gap-1.5">
                {traits.map((t) => (
                  <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-pink-900/30 text-pink-300 border border-pink-800/50 backdrop-blur-sm">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-sm text-purple-400">
                {style === "casual" ? "BFF Vibes" : style === "supportive" ? "Life Coach" : style === "intellectual" ? "Mentor" : "Hype Squad"}
              </p>
              <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                <Globe className="h-3 w-3" />
                Speaks {BESTIE_LANGUAGE_LABELS[language]}
              </p>
              <p className="text-xs text-zinc-600 flex items-center justify-center gap-1">
                <Palette className="h-3 w-3" />
                {activeBg?.label ?? "Default"} theme
              </p>
              {activePurposes.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                  {activePurposes.map((p) => (
                    <span key={p.id} className={`text-[10px] ${p.accentColor}`}>{p.icon} {p.label}</span>
                  ))}
                </div>
              )}
            </div>

            {/* About Me summary */}
            {(aboutName || aboutBirthday || aboutSiblings || aboutLocation || aboutFavorites || aboutOther) && (
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 backdrop-blur-sm">
                <p className="text-xs text-pink-400 font-medium mb-2">What {name} knows about you:</p>
                <div className="space-y-1 text-xs text-zinc-400">
                  {aboutName && <p>Name: <span className="text-zinc-300">{aboutName}</span></p>}
                  {aboutBirthday && <p>Birthday: <span className="text-zinc-300">{aboutBirthday}</span></p>}
                  {aboutSiblings && <p>Siblings: <span className="text-zinc-300">{aboutSiblings}</span></p>}
                  {aboutLocation && <p>Location: <span className="text-zinc-300">{aboutLocation}</span></p>}
                  {aboutFavorites && <p>Favorites: <span className="text-zinc-300">{aboutFavorites}</span></p>}
                  {aboutOther && <p>Other: <span className="text-zinc-300">{aboutOther}</span></p>}
                </div>
              </div>
            )}

            {/* Easter egg result (only shown after server-side creation) */}
            {easterEgg && (
              <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/20 rounded-lg p-4 border border-amber-500/40 backdrop-blur-sm text-center space-y-2">
                <p className="text-amber-300 font-bold text-sm animate-pulse">Easter Egg Discovered!</p>
                <p className="text-amber-400/80 text-xs">{easterEgg.message}</p>
                {easterEgg.discountPercent && (
                  <p className="text-emerald-400 text-xs font-medium">{easterEgg.discountPercent}% off your next purchase or renewal (one-time use)</p>
                )}
                {easterEgg.badge && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border"
                      style={{ color: easterEgg.badge.color, borderColor: easterEgg.badge.color + "60" }}
                    >
                      <span style={{ color: easterEgg.badge.color }}>&#x1F95A;</span>
                      {easterEgg.badge.colorName} Egg &middot; {easterEgg.badge.sign}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-amber-500/60">Badge: &quot;{easterEgg.reward}&quot; — added to your community profile</p>
              </div>
            )}

            {/* Preview greeting */}
            <div className="bg-zinc-800/70 rounded-lg p-4 border border-zinc-700 backdrop-blur-sm">
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Preview greeting
              </p>
              <p className="text-zinc-200 text-sm leading-relaxed">
                {generatePreviewGreeting(name, traits, style)}
              </p>
            </div>

            <div className="space-y-2 text-xs text-zinc-500 text-center">
              <p>Your Bestie will remember your conversations and learn about you over time.</p>
              <p>You can always edit their personality later.</p>
            </div>

            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-14 text-lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5 mr-2" />
                  Create My Bestie
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
