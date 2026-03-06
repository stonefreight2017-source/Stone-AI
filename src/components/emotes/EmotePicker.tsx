"use client";

import { useState } from "react";
import { EMOTES, EMOTE_CATEGORIES, type EmoteDefinition } from "./emote-definitions";

interface EmotePickerProps {
  onSelect: (emote: EmoteDefinition) => void;
  className?: string;
}

export function EmotePicker({ onSelect, className = "" }: EmotePickerProps) {
  const [activeCategory, setActiveCategory] = useState<EmoteDefinition["category"]>("reaction");

  const filtered = EMOTES.filter((e) => e.category === activeCategory);

  return (
    <div
      className={`w-64 rounded-xl bg-zinc-900 border border-zinc-700/50 shadow-xl overflow-hidden ${className}`}
    >
      {/* Category tabs */}
      <div className="flex border-b border-zinc-800">
        {EMOTE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex-1 px-2 py-2 text-[10px] font-medium transition-colors ${
              activeCategory === cat.key
                ? "text-white bg-zinc-800 border-b-2 border-cyan-400"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Emote grid */}
      <div className="grid grid-cols-6 gap-1 p-2">
        {filtered.map((emote) => (
          <button
            key={emote.id}
            onClick={() => onSelect(emote)}
            title={emote.label}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-lg
              hover:bg-zinc-800 hover:scale-110 active:scale-95
              transition-transform duration-150 cursor-pointer"
          >
            <span className={`hover-trigger-${emote.animationClass}`}>
              {emote.emoji}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
