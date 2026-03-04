"use client";

import { cn } from "@/lib/utils";
import {
  BESTIE_TRAITS,
  BESTIE_STYLES,
  BESTIE_EXPERTISE,
  type BestieTrait,
  type BestieStyle,
  type BestieExpertise,
} from "@/lib/bestie-validators";

const TRAIT_META: Record<BestieTrait, { label: string; emoji: string }> = {
  empathetic: { label: "Empathetic", emoji: "\uD83E\uDD97" },
  witty: { label: "Witty", emoji: "\uD83D\uDE04" },
  direct: { label: "Direct", emoji: "\uD83C\uDFAF" },
  nurturing: { label: "Nurturing", emoji: "\uD83E\uDD17" },
  adventurous: { label: "Adventurous", emoji: "\uD83D\uDE80" },
  intellectual: { label: "Intellectual", emoji: "\uD83E\uDDE0" },
  playful: { label: "Playful", emoji: "\uD83C\uDF89" },
  calm: { label: "Calm", emoji: "\uD83C\uDF3F" },
  motivating: { label: "Motivating", emoji: "\uD83D\uDD25" },
  creative: { label: "Creative", emoji: "\uD83C\uDFA8" },
};

const STYLE_META: Record<BestieStyle, { label: string; description: string; emoji: string }> = {
  casual: {
    label: "BFF / Casual",
    description: "Like texting your best friend. Relaxed, real, and fun.",
    emoji: "\u2615",
  },
  supportive: {
    label: "Life Coach",
    description: "Warm support with gentle guidance toward growth.",
    emoji: "\uD83D\uDC9A",
  },
  intellectual: {
    label: "Mentor",
    description: "Deep conversations and thoughtful perspectives.",
    emoji: "\uD83D\uDCDA",
  },
  hype: {
    label: "Hype Squad",
    description: "Your biggest cheerleader. Maximum energy!",
    emoji: "\uD83C\uDF1F",
  },
};

const EXPERTISE_META: Record<BestieExpertise, { label: string; emoji: string }> = {
  wellness: { label: "Wellness", emoji: "\uD83E\uDDD8" },
  career: { label: "Career", emoji: "\uD83D\uDCBC" },
  relationships: { label: "Relationships", emoji: "\u2764\uFE0F" },
  creativity: { label: "Creativity", emoji: "\uD83C\uDFA8" },
  fitness: { label: "Fitness", emoji: "\uD83D\uDCAA" },
  finance: { label: "Finance", emoji: "\uD83D\uDCB0" },
  tech: { label: "Tech", emoji: "\uD83D\uDCBB" },
  philosophy: { label: "Philosophy", emoji: "\uD83E\uDD14" },
};

interface TraitPickerProps {
  selected: BestieTrait[];
  onChange: (traits: BestieTrait[]) => void;
}

export function TraitPicker({ selected, onChange }: TraitPickerProps) {
  function toggle(trait: BestieTrait) {
    if (selected.includes(trait)) {
      onChange(selected.filter((t) => t !== trait));
    } else if (selected.length < 3) {
      onChange([...selected, trait]);
    }
  }

  return (
    <div>
      <p className="text-sm text-zinc-400 mb-3">
        Pick <span className="text-pink-400 font-medium">3 personality traits</span> for your Bestie
        <span className="text-zinc-500 ml-2">({selected.length}/3)</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {BESTIE_TRAITS.map((trait) => {
          const meta = TRAIT_META[trait];
          const isSelected = selected.includes(trait);
          const isDisabled = !isSelected && selected.length >= 3;
          return (
            <button
              key={trait}
              type="button"
              onClick={() => toggle(trait)}
              disabled={isDisabled}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-all",
                isSelected
                  ? "border-pink-500 bg-pink-500/10 text-pink-300"
                  : isDisabled
                    ? "border-zinc-800 bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-pink-700 hover:bg-pink-900/10"
              )}
            >
              <span className="text-lg">{meta.emoji}</span>
              <span className="text-xs font-medium">{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface StylePickerProps {
  selected: BestieStyle | null;
  onChange: (style: BestieStyle) => void;
}

export function StylePicker({ selected, onChange }: StylePickerProps) {
  return (
    <div>
      <p className="text-sm text-zinc-400 mb-3">
        Choose a <span className="text-purple-400 font-medium">communication style</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BESTIE_STYLES.map((style) => {
          const meta = STYLE_META[style];
          const isSelected = selected === style;
          return (
            <button
              key={style}
              type="button"
              onClick={() => onChange(style)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
                isSelected
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-zinc-700 bg-zinc-900 hover:border-purple-700 hover:bg-purple-900/10"
              )}
            >
              <span className="text-2xl shrink-0">{meta.emoji}</span>
              <div>
                <p className={cn("font-medium text-sm", isSelected ? "text-purple-300" : "text-zinc-300")}>
                  {meta.label}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{meta.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ExpertisePickerProps {
  selected: BestieExpertise[];
  onChange: (expertise: BestieExpertise[]) => void;
}

export function ExpertisePicker({ selected, onChange }: ExpertisePickerProps) {
  function toggle(exp: BestieExpertise) {
    if (selected.includes(exp)) {
      onChange(selected.filter((e) => e !== exp));
    } else if (selected.length < 3) {
      onChange([...selected, exp]);
    }
  }

  return (
    <div>
      <p className="text-sm text-zinc-400 mb-3">
        Pick <span className="text-purple-400 font-medium">1-3 expertise areas</span>
        <span className="text-zinc-500 ml-2">({selected.length}/3)</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {BESTIE_EXPERTISE.map((exp) => {
          const meta = EXPERTISE_META[exp];
          const isSelected = selected.includes(exp);
          const isDisabled = !isSelected && selected.length >= 3;
          return (
            <button
              key={exp}
              type="button"
              onClick={() => toggle(exp)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border text-sm transition-all",
                isSelected
                  ? "border-purple-500 bg-purple-500/10 text-purple-300"
                  : isDisabled
                    ? "border-zinc-800 bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-purple-700 hover:bg-purple-900/10"
              )}
            >
              <span>{meta.emoji}</span>
              <span className="text-xs font-medium">{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
