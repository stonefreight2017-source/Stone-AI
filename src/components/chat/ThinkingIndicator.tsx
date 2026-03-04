"use client";

import { useState, useEffect } from "react";

interface ThinkingIndicatorProps {
  variant?: "default" | "bestie";
}

const THINKING_STAGES = [
  { minMs: 0, emoji: "\uD83E\uDD14", label: "Thinking", color: "text-zinc-400" },
  { minMs: 2000, emoji: "\uD83E\uDDE0", label: "Processing", color: "text-blue-400" },
  { minMs: 4000, emoji: "\u26A1", label: "Deep thinking", color: "text-amber-400" },
  { minMs: 7000, emoji: "\uD83D\uDD25", label: "Crunching hard", color: "text-orange-400" },
  { minMs: 10000, emoji: "\uD83C\uDF1F", label: "Complex analysis", color: "text-purple-400" },
  { minMs: 15000, emoji: "\uD83D\uDE80", label: "Maximum brainpower", color: "text-emerald-400" },
];

const BESTIE_STAGES = [
  { minMs: 0, emoji: "\uD83D\uDCAD", label: "Hmm let me think", color: "text-pink-300" },
  { minMs: 2000, emoji: "\uD83D\uDC85", label: "Getting creative", color: "text-pink-400" },
  { minMs: 4000, emoji: "\u2728", label: "Cooking something up", color: "text-purple-400" },
  { minMs: 7000, emoji: "\uD83C\uDF1F", label: "Going deep", color: "text-amber-400" },
  { minMs: 10000, emoji: "\uD83D\uDD2E", label: "Channeling wisdom", color: "text-violet-400" },
  { minMs: 15000, emoji: "\uD83C\uDF0C", label: "Galaxy brain mode", color: "text-indigo-300" },
];

export function ThinkingIndicator({ variant = "default" }: ThinkingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const stages = variant === "bestie" ? BESTIE_STAGES : THINKING_STAGES;
  const stage = [...stages].reverse().find((s) => elapsed >= s.minMs) ?? stages[0];

  const bgClass = variant === "bestie"
    ? "bg-gradient-to-r from-pink-950/30 to-purple-950/30 border border-pink-800/20"
    : "bg-zinc-800";

  return (
    <div className={`rounded-lg px-4 py-3 ${bgClass} flex items-center gap-3`}>
      <span
        className="text-xl animate-bounce"
        style={{ animationDuration: "1.2s" }}
      >
        {stage.emoji}
      </span>
      <div className="flex flex-col gap-1">
        <span className={`text-xs font-medium ${stage.color}`}>
          {stage.label}...
        </span>
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-pulse" />
          <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-pulse [animation-delay:0.2s]" />
          <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-pulse [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}
