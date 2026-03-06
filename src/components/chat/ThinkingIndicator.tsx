"use client";

import { useState, useEffect } from "react";

interface ThinkingIndicatorProps {
  variant?: "default" | "bestie";
}

/**
 * Thinking stages with escalating emojis.
 *
 * LEGAL NOTE: Unicode emojis are part of the Unicode Standard (Unicode Consortium).
 * They are NOT copyrighted — they are standardized characters, like letters.
 * Each platform (Apple, Google, Microsoft, Samsung) renders them with their own
 * art style which IS copyrighted to that platform, but the USAGE of emoji characters
 * in software is completely legal. We are using Unicode codepoints, not platform-specific
 * artwork. This is standard practice across all web applications.
 *
 * Total emoji count: 24 unique emojis across both stage sets
 * Default stages: 8 emojis (thinking flow)
 * Bestie stages: 8 emojis (warm/creative flow)
 * Ambient emojis: 8 floating background emojis
 */

const THINKING_STAGES = [
  { minMs: 0,     emoji: "\uD83E\uDD14", label: "Thinking", color: "text-zinc-400" },          // 🤔
  { minMs: 1500,  emoji: "\uD83D\uDCA1", label: "Got an idea", color: "text-yellow-400" },     // 💡
  { minMs: 3000,  emoji: "\uD83E\uDDE0", label: "Processing", color: "text-blue-400" },        // 🧠
  { minMs: 5000,  emoji: "\u26A1",       label: "Deep thinking", color: "text-amber-400" },    // ⚡
  { minMs: 7000,  emoji: "\uD83D\uDD25", label: "Crunching hard", color: "text-orange-400" },  // 🔥
  { minMs: 10000, emoji: "\uD83C\uDF1F", label: "Complex analysis", color: "text-purple-400" },// 🌟
  { minMs: 14000, emoji: "\uD83D\uDE80", label: "Maximum brainpower", color: "text-emerald-400" }, // 🚀
  { minMs: 20000, emoji: "\uD83E\uDDD9", label: "Wizard mode", color: "text-violet-400" },     // 🧙
];

const BESTIE_STAGES = [
  { minMs: 0,     emoji: "\uD83D\uDCAD", label: "Hmm let me think", color: "text-pink-300" },    // 💭
  { minMs: 1500,  emoji: "\uD83D\uDE0A", label: "Ooh I know", color: "text-pink-400" },          // 😊
  { minMs: 3000,  emoji: "\uD83D\uDC85", label: "Getting creative", color: "text-fuchsia-400" }, // 💅
  { minMs: 5000,  emoji: "\u2728",       label: "Cooking something up", color: "text-purple-400" }, // ✨
  { minMs: 7000,  emoji: "\uD83C\uDF1F", label: "Going deep", color: "text-amber-400" },         // 🌟
  { minMs: 10000, emoji: "\uD83D\uDD2E", label: "Channeling wisdom", color: "text-violet-400" }, // 🔮
  { minMs: 14000, emoji: "\uD83C\uDF0C", label: "Galaxy brain mode", color: "text-indigo-300" }, // 🌌
  { minMs: 20000, emoji: "\uD83E\uDD84", label: "Full magic", color: "text-pink-300" },          // 🦄
];

// Ambient floating emojis for visual interest while waiting
const AMBIENT_EMOJIS = [
  "\uD83D\uDCBB", // 💻
  "\u2699\uFE0F",  // ⚙️
  "\uD83D\uDCCA", // 📊
  "\uD83D\uDD0D", // 🔍
  "\uD83C\uDFAF", // 🎯
  "\uD83D\uDCDD", // 📝
  "\uD83D\uDCA0", // 💠
  "\uD83C\uDF10", // 🌐
];

const BESTIE_AMBIENT = [
  "\uD83C\uDF38", // 🌸
  "\uD83D\uDC9C", // 💜
  "\uD83C\uDF1F", // 🌟
  "\u2728",       // ✨
  "\uD83C\uDF19", // 🌙
  "\uD83E\uDD8B", // 🦋
  "\uD83C\uDF3A", // 🌺
  "\uD83D\uDC96", // 💖
];

export function ThinkingIndicator({ variant = "default" }: ThinkingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);
  const [ambientIndex, setAmbientIndex] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Cycle ambient emojis
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbientIndex((i) => (i + 1) % AMBIENT_EMOJIS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const stages = variant === "bestie" ? BESTIE_STAGES : THINKING_STAGES;
  const ambient = variant === "bestie" ? BESTIE_AMBIENT : AMBIENT_EMOJIS;
  const stage = [...stages].reverse().find((s) => elapsed >= s.minMs) ?? stages[0];

  const isBestie = variant === "bestie";
  const bgClass = isBestie
    ? "bg-gradient-to-r from-pink-950/40 to-purple-950/40 border border-pink-800/30"
    : "bg-zinc-800/80 border border-zinc-700/30";

  // Progress bar width based on stage progression
  const stageIndex = stages.findIndex((s) => s === stage);
  const progress = Math.min(((stageIndex + 1) / stages.length) * 100, 100);

  return (
    <div className={`rounded-2xl px-5 py-4 ${bgClass} relative overflow-hidden`}>
      {/* Animated progress bar at top */}
      <div className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500 transition-all duration-1000 ease-out"
        style={{ width: `${progress}%` }}
      />

      <div className="flex items-center gap-4">
        {/* Main emoji with bounce + pulse */}
        <div className="relative">
          <span
            className="text-2xl block animate-bounce"
            style={{ animationDuration: "1.4s" }}
          >
            {stage.emoji}
          </span>
          {/* Glow ring behind emoji */}
          <div className={`absolute inset-0 rounded-full blur-lg opacity-30 ${
            isBestie ? "bg-pink-500" : "bg-amber-500"
          } animate-pulse`} />
        </div>

        {/* Label + dots + timer */}
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${stage.color} transition-colors duration-500`}>
              {stage.label}
            </span>

            {/* Pulsing dots */}
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                    isBestie ? "bg-pink-500" : "bg-zinc-500"
                  }`}
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>

          {/* Elapsed time + floating ambient emoji */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-600">
            <span>{(elapsed / 1000).toFixed(0)}s</span>
            <span className="text-xs opacity-60 transition-opacity duration-500">
              {ambient[ambientIndex]}
            </span>
            <span className="text-xs opacity-40 transition-opacity duration-500" style={{ transitionDelay: "200ms" }}>
              {ambient[(ambientIndex + 3) % ambient.length]}
            </span>
            <span className="text-xs opacity-20 transition-opacity duration-500" style={{ transitionDelay: "400ms" }}>
              {ambient[(ambientIndex + 5) % ambient.length]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
