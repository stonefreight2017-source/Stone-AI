"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Heart, Loader2, Sparkles, Globe, Monitor, Palette, Target, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TraitPicker, StylePicker, ExpertisePicker } from "@/components/bestie/PersonalityPicker";
import { toast } from "sonner";
import type { BestieTrait, BestieStyle, BestieExpertise, BestieLanguage } from "@/lib/bestie-validators";
import { BESTIE_LANGUAGES, BESTIE_LANGUAGE_LABELS } from "@/lib/bestie-validators";

function generatePreviewGreeting(bestieName: string, traits: BestieTrait[], style: BestieStyle | null): string {
  const greetings: Record<BestieStyle, (n: string) => string> = {
    casual: (n) =>
      `Hey! I'm ${n}, your new bestie! I'm so ready to hang out and chat about literally anything. What's on your mind today?`,
    supportive: (n) =>
      `Hi there! I'm ${n}, and I'm really glad to meet you. I'm here whenever you need someone to talk to, celebrate with, or just listen. How are you doing today?`,
    intellectual: (n) =>
      `Hello! I'm ${n} — your new thinking partner. I love exploring ideas and having meaningful conversations. What's been occupying your thoughts lately?`,
    hype: (n) =>
      `OMG HI!! I'm ${n} and I am SO excited to be your bestie!! You already seem amazing and I just KNOW we're going to have the best time. What's the latest?!`,
    blunt: (n) =>
      `Alright, I'm ${n}. No fluff, no filler — just real talk. You came here for a reason, so let's get into it. What's going on?`,
    gentle: (n) =>
      `Hi, I'm ${n}. I'm really happy to meet you. Take your time — there's no rush here. Whenever you're ready, I'm all ears.`,
    professional: (n) =>
      `Hello! I'm ${n}, your new partner in getting things done. Let's make the most of our time together. What's the priority today?`,
    storyteller: (n) =>
      `Hey there! I'm ${n}. You know how every great story starts with two people meeting? Well, this is ours. So tell me — what's the first chapter about?`,
  };
  const fn = style ? greetings[style] : greetings.casual;
  return fn(bestieName);
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

/* ── Background themes — rich, textured, purpose-filtered ── */
type BgTheme = {
  id: string;
  label: string;
  preview: string;
  bg: string;
  forPurposes: string[]; // which purposes this bg is available for
};

// All backgrounds use layered gradients, radial glows, and subtle patterns
// for an immersive feel — not flat/plain. Filtered by user's chosen purposes.
const ALL_BG_THEMES: BgTheme[] = [
  // ── Business / Professional ──
  { id: "exec-suite", label: "Executive Suite", forPurposes: ["business", "learning"],
    preview: "linear-gradient(135deg,#0f172a,#1e293b)",
    bg: "radial-gradient(ellipse at 20% 50%,#1e3a5f33 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,#0f3460aa 0%,transparent 40%),linear-gradient(135deg,#0f172a 0%,#1e293b 40%,#0f172a 100%)" },
  { id: "mahogany-office", label: "Mahogany Office", forPurposes: ["business"],
    preview: "linear-gradient(135deg,#1a0a00,#3e1a00)",
    bg: "radial-gradient(ellipse at 30% 70%,#5c2d0033 0%,transparent 50%),radial-gradient(ellipse at 70% 30%,#3e1a0055 0%,transparent 40%),linear-gradient(135deg,#1a0a00 0%,#2d1500 40%,#3e1a00 70%,#1a0a00 100%)" },
  { id: "carbon-boardroom", label: "Carbon Boardroom", forPurposes: ["business", "tech"],
    preview: "linear-gradient(135deg,#111,#1a1a2e)",
    bg: "repeating-linear-gradient(45deg,#11111180 0px,#11111180 2px,transparent 2px,transparent 12px),radial-gradient(ellipse at 50% 0%,#1a1a3e55 0%,transparent 60%),linear-gradient(180deg,#111 0%,#1a1a2e 100%)" },
  { id: "slate-leather", label: "Slate & Leather", forPurposes: ["business", "wellness"],
    preview: "linear-gradient(180deg,#1e293b,#334155)",
    bg: "radial-gradient(ellipse at 50% 80%,#47556933 0%,transparent 50%),linear-gradient(180deg,#1e293b 0%,#2a3a4e 30%,#334155 60%,#1e293b 100%)" },
  { id: "blueprint", label: "Architect Blueprint", forPurposes: ["business", "tech", "learning"],
    preview: "linear-gradient(135deg,#0c1445,#1a237e)",
    bg: "repeating-linear-gradient(0deg,transparent,transparent 39px,#1a237e15 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#1a237e15 40px),radial-gradient(ellipse at 50% 50%,#28359333 0%,transparent 70%),linear-gradient(135deg,#0c1445 0%,#1a237e 50%,#0c1445 100%)" },

  // ── Tech / Developer ──
  { id: "terminal", label: "Terminal Night", forPurposes: ["tech", "learning"],
    preview: "linear-gradient(180deg,#0a0a0a,#0d1117)",
    bg: "repeating-linear-gradient(0deg,transparent,transparent 23px,#00ff0008 24px),radial-gradient(ellipse at 50% 0%,#0d111744 0%,transparent 70%),linear-gradient(180deg,#0a0a0a 0%,#0d1117 50%,#161b22 100%)" },
  { id: "matrix", label: "Digital Rain", forPurposes: ["tech"],
    preview: "linear-gradient(180deg,#000,#001a00)",
    bg: "repeating-linear-gradient(90deg,#00110022 0px,transparent 1px,transparent 20px),radial-gradient(ellipse at 50% 30%,#003300aa 0%,transparent 50%),linear-gradient(180deg,#000 0%,#001a00 50%,#002200 100%)" },
  { id: "cyber-neon", label: "Cyberpunk Neon", forPurposes: ["tech", "creative"],
    preview: "linear-gradient(135deg,#0a0015,#1a0030)",
    bg: "radial-gradient(ellipse at 20% 80%,#ff006622 0%,transparent 40%),radial-gradient(ellipse at 80% 20%,#6600ff33 0%,transparent 40%),linear-gradient(135deg,#0a0015 0%,#1a0030 40%,#2d0050 70%,#0a0015 100%)" },
  { id: "neon-grid", label: "Neon Grid", forPurposes: ["tech", "creative"],
    preview: "linear-gradient(180deg,#0f0f23,#1a1a3e)",
    bg: "repeating-linear-gradient(0deg,transparent,transparent 49px,#4444ff08 50px),repeating-linear-gradient(90deg,transparent,transparent 49px,#4444ff08 50px),radial-gradient(ellipse at 50% 50%,#2a2a6633 0%,transparent 70%),linear-gradient(180deg,#0f0f23 0%,#1a1a3e 100%)" },
  { id: "dark-ide", label: "Code Editor", forPurposes: ["tech", "learning"],
    preview: "linear-gradient(180deg,#1e1e1e,#252526)",
    bg: "linear-gradient(90deg,#2d2d3088 0px,transparent 1px),radial-gradient(ellipse at 0% 50%,#333346aa 0%,transparent 30%),linear-gradient(180deg,#1e1e1e 0%,#252526 50%,#2d2d30 100%)" },

  // ── Friendship / Casual ──
  { id: "sunset-lounge", label: "Sunset Lounge", forPurposes: ["friendship", "wellness"],
    preview: "linear-gradient(135deg,#2d1b4e,#4a1942)",
    bg: "radial-gradient(ellipse at 30% 80%,#ff668833 0%,transparent 40%),radial-gradient(ellipse at 70% 20%,#8b5cf622 0%,transparent 50%),linear-gradient(135deg,#2d1b4e 0%,#4a1942 40%,#6b2048 70%,#2d1b4e 100%)" },
  { id: "ocean-breeze", label: "Ocean Breeze", forPurposes: ["friendship", "wellness", "fitness"],
    preview: "linear-gradient(180deg,#0a1628,#132e4a)",
    bg: "radial-gradient(ellipse at 50% 100%,#1a4a6e55 0%,transparent 50%),radial-gradient(ellipse at 20% 30%,#0ea5e922 0%,transparent 40%),linear-gradient(180deg,#0a1628 0%,#132e4a 50%,#1a4a6e 100%)" },
  { id: "midnight-sky", label: "Midnight Sky", forPurposes: ["friendship", "creative", "wellness"],
    preview: "linear-gradient(180deg,#0f0c29,#302b63)",
    bg: "radial-gradient(circle at 30% 20%,#ffffff08 0%,transparent 3%),radial-gradient(circle at 70% 40%,#ffffff06 0%,transparent 2%),radial-gradient(circle at 50% 60%,#ffffff05 0%,transparent 2.5%),radial-gradient(ellipse at 50% 50%,#302b6355 0%,transparent 70%),linear-gradient(180deg,#0f0c29 0%,#302b63 50%,#24243e 100%)" },
  { id: "warm-den", label: "Warm Den", forPurposes: ["friendship", "parenting", "wellness"],
    preview: "linear-gradient(135deg,#1a1000,#2d1a00)",
    bg: "radial-gradient(ellipse at 40% 60%,#f59e0b11 0%,transparent 50%),radial-gradient(ellipse at 60% 30%,#92400e22 0%,transparent 40%),linear-gradient(135deg,#1a1000 0%,#2d1a00 40%,#3d2400 70%,#1a1000 100%)" },
  { id: "coffee-corner", label: "Coffee Corner", forPurposes: ["friendship", "business", "creative"],
    preview: "linear-gradient(180deg,#1a120a,#2d1f14)",
    bg: "radial-gradient(ellipse at 30% 70%,#78350f33 0%,transparent 40%),radial-gradient(ellipse at 70% 30%,#451a0322 0%,transparent 50%),linear-gradient(180deg,#1a120a 0%,#2d1f14 50%,#3d2c1e 100%)" },

  // ── Creative / Artsy ──
  { id: "aurora", label: "Northern Lights", forPurposes: ["creative", "wellness"],
    preview: "linear-gradient(135deg,#0f0c29,#1a3a2a)",
    bg: "radial-gradient(ellipse at 20% 30%,#10b98133 0%,transparent 40%),radial-gradient(ellipse at 80% 60%,#8b5cf633 0%,transparent 40%),radial-gradient(ellipse at 50% 80%,#06b6d422 0%,transparent 50%),linear-gradient(135deg,#0f0c29 0%,#1a3a2a 30%,#302b63 60%,#24243e 100%)" },
  { id: "galaxy", label: "Deep Galaxy", forPurposes: ["creative", "learning"],
    preview: "linear-gradient(135deg,#0d0221,#150734)",
    bg: "radial-gradient(circle at 25% 25%,#ffffff0a 0%,transparent 3%),radial-gradient(circle at 75% 55%,#ffffff08 0%,transparent 2%),radial-gradient(circle at 45% 75%,#ffffff06 0%,transparent 2.5%),radial-gradient(ellipse at 50% 50%,#1a063388 0%,transparent 70%),linear-gradient(135deg,#0d0221 0%,#150734 30%,#0a1647 60%,#1a0533 100%)" },
  { id: "neon-studio", label: "Neon Studio", forPurposes: ["creative", "tech"],
    preview: "linear-gradient(135deg,#1a0011,#2d001f)",
    bg: "radial-gradient(ellipse at 20% 80%,#ec489955 0%,transparent 30%),radial-gradient(ellipse at 80% 20%,#a855f733 0%,transparent 35%),linear-gradient(135deg,#1a0011 0%,#2d001f 50%,#3d002d 100%)" },
  { id: "canvas-loft", label: "Canvas Loft", forPurposes: ["creative", "friendship"],
    preview: "linear-gradient(180deg,#1a1a17,#2a2a24)",
    bg: "radial-gradient(ellipse at 30% 50%,#f59e0b0d 0%,transparent 50%),linear-gradient(180deg,#1a1a17 0%,#2a2a24 50%,#3a3a30 100%)" },

  // ── Wellness / Support ──
  { id: "forest-retreat", label: "Forest Retreat", forPurposes: ["wellness", "fitness", "parenting"],
    preview: "linear-gradient(135deg,#0a1a0a,#1a2e1a)",
    bg: "radial-gradient(ellipse at 40% 70%,#10b98122 0%,transparent 40%),radial-gradient(ellipse at 60% 20%,#06543311 0%,transparent 50%),linear-gradient(135deg,#0a1a0a 0%,#1a2e1a 50%,#2a422a 100%)" },
  { id: "zen-garden", label: "Zen Garden", forPurposes: ["wellness", "learning"],
    preview: "linear-gradient(180deg,#1a1a17,#2a2e24)",
    bg: "radial-gradient(ellipse at 50% 50%,#d4d4cc08 0%,transparent 60%),linear-gradient(180deg,#1a1a17 0%,#222620 30%,#2a2e24 60%,#1a1a17 100%)" },

  // ── Fitness / Health ──
  { id: "iron-gym", label: "Iron Gym", forPurposes: ["fitness"],
    preview: "linear-gradient(180deg,#1a1a1a,#2a2a2a)",
    bg: "repeating-linear-gradient(90deg,#ffffff05 0px,transparent 1px,transparent 60px),radial-gradient(ellipse at 50% 0%,#ef444422 0%,transparent 40%),linear-gradient(180deg,#1a1a1a 0%,#252525 50%,#2a2a2a 100%)" },
  { id: "outdoor-trail", label: "Trail Run", forPurposes: ["fitness", "wellness"],
    preview: "linear-gradient(135deg,#0a1a10,#1a3020)",
    bg: "radial-gradient(ellipse at 60% 80%,#16a34a22 0%,transparent 40%),radial-gradient(ellipse at 30% 20%,#0ea5e911 0%,transparent 50%),linear-gradient(135deg,#0a1a10 0%,#1a3020 50%,#0a1a10 100%)" },

  // ── Parenting / Family ──
  { id: "playroom", label: "Cozy Playroom", forPurposes: ["parenting"],
    preview: "linear-gradient(135deg,#2d1a00,#1a2a3a)",
    bg: "radial-gradient(ellipse at 30% 70%,#f59e0b11 0%,transparent 40%),radial-gradient(ellipse at 70% 30%,#3b82f611 0%,transparent 40%),linear-gradient(135deg,#1a1208 0%,#1e2028 50%,#1a1208 100%)" },
  { id: "storybook", label: "Storybook Night", forPurposes: ["parenting", "friendship"],
    preview: "linear-gradient(180deg,#1a1030,#2a1a40)",
    bg: "radial-gradient(circle at 20% 30%,#ffffff06 0%,transparent 2%),radial-gradient(circle at 70% 50%,#ffffff05 0%,transparent 2%),radial-gradient(ellipse at 50% 70%,#8b5cf622 0%,transparent 40%),linear-gradient(180deg,#1a1030 0%,#2a1a40 50%,#1a1030 100%)" },
];

export default function CreateBestiePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);

  // Step 1: Purpose — WHY are you here?
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);

  // Step 2: Name, Avatar & Language
  const [name, setName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("\uD83D\uDC68\u200D\uD83D\uDCBC");
  const [customAvatar, setCustomAvatar] = useState<string | null>(null); // data URI
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const canNextPersonality = true; // no minimums — user can skip, reminded at preview

  // Resolve active background CSS
  const activeBg = ALL_BG_THEMES.find((t) => t.id === bgTheme);

  // Filter backgrounds based on selected purposes — only show relevant ones
  const filteredBgThemes = selectedPurposes.length > 0
    ? ALL_BG_THEMES.filter((t) => t.forPurposes.some((p) => selectedPurposes.includes(p)))
    : ALL_BG_THEMES;

  async function handleAvatarUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/bestie/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.avatarDataUri) {
        setCustomAvatar(data.avatarDataUri);
        setAvatarEmoji(""); // clear emoji when custom photo is set
        toast.success("Photo approved!");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploadingAvatar(false);
    }
  }

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
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/bestie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          purposes: selectedPurposes,
          traits,
          ...(style ? { style } : {}),
          expertise,
          avatarEmoji: customAvatar || avatarEmoji,
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
        }

        // Generate anime avatar from personality (non-blocking — user sees progress)
        setIsGeneratingAvatar(true);
        try {
          const avatarRes = await fetch("/api/bestie/avatar/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bestieId: data.bestie.id }),
          });
          const avatarData = await avatarRes.json();
          if (avatarRes.ok && avatarData.avatarDataUri) {
            setGeneratedAvatar(avatarData.avatarDataUri);
            toast.success(`${name}'s look has been created!`);
            // Let user see the avatar for a moment
            await new Promise((r) => setTimeout(r, 2500));
          }
        } catch {
          // Avatar generation is optional — don't block the flow
          console.warn("Avatar generation failed, continuing with emoji/photo avatar");
        } finally {
          setIsGeneratingAvatar(false);
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

              {/* Custom photo upload */}
              <div className="mb-4 max-w-md mx-auto">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
                  Custom Photo
                  <span className="ml-2 text-purple-400 normal-case tracking-normal">- Upload your own</span>
                </p>
                <div className="flex items-center gap-3">
                  {customAvatar ? (
                    <div className="relative">
                      <img
                        src={customAvatar}
                        alt="Custom avatar"
                        className="h-14 w-14 rounded-xl object-cover border-2 border-pink-500"
                      />
                      <button
                        type="button"
                        onClick={() => { setCustomAvatar(null); if (!avatarEmoji) setAvatarEmoji("\uD83D\uDC68\u200D\uD83D\uDCBC"); }}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-600 rounded-full flex items-center justify-center"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="h-14 w-14 rounded-xl border-2 border-dashed border-zinc-600 hover:border-purple-500 flex items-center justify-center transition-colors bg-zinc-800/40 backdrop-blur-sm"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                      ) : (
                        <Camera className="h-5 w-5 text-zinc-500" />
                      )}
                    </button>
                  )}
                  <div className="text-xs text-zinc-500">
                    {uploadingAvatar ? (
                      <span className="text-purple-400">Checking image...</span>
                    ) : customAvatar ? (
                      <span className="text-emerald-400">Photo approved and set as avatar</span>
                    ) : (
                      <span>Upload a photo of anything — pet, scenery, art, you.<br />Images are reviewed for safety before use.</span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              {/* Emoji avatars */}
              {!customAvatar && (
                <div className="space-y-4 max-w-md mx-auto">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Or choose an emoji</p>
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
                            onClick={() => { setAvatarEmoji(emoji); setCustomAvatar(null); }}
                            className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                              avatarEmoji === emoji && !customAvatar
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
              )}
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredBgThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setBgTheme(theme.id)}
                  className={`group relative rounded-xl overflow-hidden transition-all h-24 ${
                    bgTheme === theme.id
                      ? "ring-2 ring-pink-500 scale-[1.03]"
                      : "ring-1 ring-zinc-700/50 hover:ring-zinc-400"
                  }`}
                  style={{ background: theme.bg }}
                >
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
              ))}
            </div>

            <p className="text-center text-[10px] text-zinc-600">
              Showing {filteredBgThemes.length} environments based on your vibe
            </p>

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
        {step === 6 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              {generatedAvatar ? (
                <img src={generatedAvatar} alt={name} className="h-20 w-20 rounded-2xl object-cover mx-auto border-2 border-pink-500/50 shadow-lg shadow-pink-500/20" />
              ) : customAvatar ? (
                <img src={customAvatar} alt={name} className="h-20 w-20 rounded-2xl object-cover mx-auto border-2 border-pink-500/50" />
              ) : (
                <div className="text-5xl">{avatarEmoji}</div>
              )}
              <h2 className="text-2xl font-bold text-white">{name}</h2>
              <div className="flex flex-wrap justify-center gap-1.5">
                {traits.map((t) => (
                  <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-pink-900/30 text-pink-300 border border-pink-800/50 backdrop-blur-sm">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-sm text-purple-400">
                {style ? ({ casual: "BFF Vibes", supportive: "Life Coach", intellectual: "Mentor", hype: "Hype Squad", blunt: "Straight Shooter", gentle: "Soft & Gentle", professional: "All Business", storyteller: "Storyteller" } as Record<string, string>)[style] ?? style : "No style selected"}
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

            {/* Skipped category reminders */}
            {(traits.length === 0 || !style || expertise.length === 0) && (
              <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-700/40 backdrop-blur-sm space-y-1.5">
                <p className="text-amber-400 text-xs font-medium">Heads up — you skipped some options:</p>
                {traits.length === 0 && (
                  <p className="text-amber-300/70 text-xs">• No personality traits selected — {name} will use a balanced default</p>
                )}
                {!style && (
                  <p className="text-amber-300/70 text-xs">• No communication style chosen — {name} will default to casual</p>
                )}
                {expertise.length === 0 && (
                  <p className="text-amber-300/70 text-xs">• No topics picked — {name} will be a general conversationalist</p>
                )}
                <p className="text-amber-500/50 text-[10px] mt-1">You can always change these later in settings.</p>
              </div>
            )}

            <div className="space-y-2 text-xs text-zinc-500 text-center">
              <p>Your Bestie will remember your conversations and learn about you over time.</p>
              <p>You can always edit their personality later.</p>
            </div>

            {/* Generated avatar reveal */}
            {generatedAvatar && (
              <div className="text-center space-y-3 animate-in fade-in duration-700">
                <p className="text-xs text-pink-400 font-medium">Meet {name}!</p>
                <img
                  src={generatedAvatar}
                  alt={name}
                  className="h-32 w-32 rounded-2xl object-cover mx-auto border-2 border-pink-500/50 shadow-lg shadow-pink-500/20"
                />
              </div>
            )}

            {/* Avatar generation progress */}
            {isGeneratingAvatar && !generatedAvatar && (
              <div className="text-center space-y-3 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-pink-400 mx-auto" />
                <p className="text-sm text-pink-300 animate-pulse">Bringing {name} to life...</p>
                <p className="text-[10px] text-zinc-500">Creating a unique look based on their personality</p>
              </div>
            )}

            <Button
              onClick={handleCreate}
              disabled={isCreating || isGeneratingAvatar}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-14 text-lg"
            >
              {isCreating && !isGeneratingAvatar ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating...
                </>
              ) : isGeneratingAvatar ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Designing {name}&apos;s look...
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
