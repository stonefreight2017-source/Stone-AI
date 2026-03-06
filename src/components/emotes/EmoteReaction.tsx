"use client";

import { useState } from "react";
import { getEmoteById } from "./emote-definitions";

interface EmoteReactionProps {
  emoteId: string;
  count: number;
  active?: boolean;
  onToggle?: (emoteId: string) => void;
}

export function EmoteReaction({ emoteId, count, active = false, onToggle }: EmoteReactionProps) {
  const [animating, setAnimating] = useState(false);
  const emote = getEmoteById(emoteId);

  if (!emote) return null;

  const handleClick = () => {
    setAnimating(true);
    onToggle?.(emoteId);
    setTimeout(() => setAnimating(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        transition-all duration-200 cursor-pointer select-none
        ${active
          ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
          : "bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:border-zinc-600/60 hover:text-zinc-300"
        }`}
    >
      <span className={animating ? emote.animationClass : ""}>
        {emote.emoji}
      </span>
      <span>{count}</span>
    </button>
  );
}
