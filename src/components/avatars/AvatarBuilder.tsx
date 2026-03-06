"use client";

import { useState, useCallback } from "react";
import type { AvatarConfig } from "./avatar-parts";
import {
  DEFAULT_AVATAR_CONFIG,
  SHAPE_OPTIONS,
  COLOR_PALETTES,
  PATTERN_OPTIONS,
  EYES_OPTIONS,
  MOUTH_OPTIONS,
  ACCESSORY_OPTIONS,
  EXPRESSION_OPTIONS,
} from "./avatar-parts";
import SVGAvatar from "./SVGAvatar";
import { generateRandomAvatar } from "@/lib/avatar-generator";

// ── Types ──

interface AvatarBuilderProps {
  initialConfig?: Partial<AvatarConfig>;
  onChange: (config: AvatarConfig) => void;
}

type Tab = "shape" | "colors" | "pattern" | "eyes" | "mouth" | "accessory" | "expression";

const TABS: { key: Tab; label: string }[] = [
  { key: "shape", label: "Shape" },
  { key: "colors", label: "Colors" },
  { key: "pattern", label: "Pattern" },
  { key: "eyes", label: "Eyes" },
  { key: "mouth", label: "Mouth" },
  { key: "accessory", label: "Accessory" },
  { key: "expression", label: "Vibe" },
];

// ── Emoji labels for visual option tiles ──

const SHAPE_LABELS: Record<string, string> = {
  circle: "Circle",
  square: "Rounded",
  hex: "Hexagon",
  diamond: "Diamond",
};

const EYES_LABELS: Record<string, string> = {
  friendly: "Friendly",
  cool: "Cool",
  wink: "Wink",
  stars: "Stars",
  hearts: "Hearts",
  focus: "Focus",
  sleepy: "Sleepy",
  fierce: "Fierce",
};

const MOUTH_LABELS: Record<string, string> = {
  smile: "Smile",
  grin: "Grin",
  neutral: "Neutral",
  smirk: "Smirk",
  open: "Wow",
  cat: "Cat",
  tongue: "Tongue",
};

const ACCESSORY_LABELS: Record<string, string> = {
  none: "None",
  glasses: "Glasses",
  sunglasses: "Shades",
  crown: "Crown",
  halo: "Halo",
  horns: "Horns",
  headphones: "Phones",
  bow: "Bow",
  hat: "Hat",
  beanie: "Beanie",
};

const EXPRESSION_LABELS: Record<string, string> = {
  happy: "Happy",
  confident: "Bold",
  chill: "Chill",
  excited: "Hyped",
  mysterious: "Mystery",
  warm: "Warm",
};

// ── Component ──

export default function AvatarBuilder({ initialConfig, onChange }: AvatarBuilderProps) {
  const [config, setConfig] = useState<AvatarConfig>({
    ...DEFAULT_AVATAR_CONFIG,
    ...initialConfig,
  });
  const [activeTab, setActiveTab] = useState<Tab>("shape");

  const update = useCallback(
    (partial: Partial<AvatarConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...partial };
        onChange(next);
        return next;
      });
    },
    [onChange]
  );

  const handleRandomize = useCallback(() => {
    const random = generateRandomAvatar();
    setConfig(random);
    onChange(random);
  }, [onChange]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* Preview */}
      <div className="relative">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-700/50 p-6 flex items-center justify-center">
          <SVGAvatar config={config} size={128} />
        </div>
        <button
          type="button"
          onClick={handleRandomize}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          Randomize
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-1 mt-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === tab.key
                ? "bg-zinc-700 text-white"
                : "bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Option panels */}
      <div className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl p-4 min-h-[120px]">
        {activeTab === "shape" && (
          <OptionGrid>
            {SHAPE_OPTIONS.map((s) => (
              <OptionTile
                key={s}
                label={SHAPE_LABELS[s]}
                active={config.shape === s}
                onClick={() => update({ shape: s })}
              >
                <MiniShape shape={s} />
              </OptionTile>
            ))}
          </OptionGrid>
        )}

        {activeTab === "colors" && (
          <OptionGrid>
            {COLOR_PALETTES.map((p) => (
              <OptionTile
                key={p.name}
                label={p.name}
                active={config.baseColor === p.base}
                onClick={() => update({ baseColor: p.base, accentColor: p.accent })}
              >
                <div className="flex gap-0.5">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.base }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.accent }} />
                </div>
              </OptionTile>
            ))}
          </OptionGrid>
        )}

        {activeTab === "pattern" && (
          <OptionGrid>
            {PATTERN_OPTIONS.map((p) => (
              <OptionTile
                key={p}
                label={p.charAt(0).toUpperCase() + p.slice(1)}
                active={config.pattern === p}
                onClick={() => update({ pattern: p })}
              />
            ))}
          </OptionGrid>
        )}

        {activeTab === "eyes" && (
          <OptionGrid>
            {EYES_OPTIONS.map((e) => (
              <OptionTile
                key={e}
                label={EYES_LABELS[e]}
                active={config.eyes === e}
                onClick={() => update({ eyes: e })}
              />
            ))}
          </OptionGrid>
        )}

        {activeTab === "mouth" && (
          <OptionGrid>
            {MOUTH_OPTIONS.map((m) => (
              <OptionTile
                key={m}
                label={MOUTH_LABELS[m]}
                active={config.mouth === m}
                onClick={() => update({ mouth: m })}
              />
            ))}
          </OptionGrid>
        )}

        {activeTab === "accessory" && (
          <OptionGrid>
            {ACCESSORY_OPTIONS.map((a) => (
              <OptionTile
                key={a}
                label={ACCESSORY_LABELS[a]}
                active={config.accessory === a}
                onClick={() => update({ accessory: a })}
              />
            ))}
          </OptionGrid>
        )}

        {activeTab === "expression" && (
          <OptionGrid>
            {EXPRESSION_OPTIONS.map((e) => (
              <OptionTile
                key={e}
                label={EXPRESSION_LABELS[e]}
                active={config.expression === e}
                onClick={() => update({ expression: e })}
              />
            ))}
          </OptionGrid>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──

function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">{children}</div>;
}

function OptionTile({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${
        active
          ? "border-cyan-500 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30"
          : "border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
      }`}
    >
      {children}
      <span className="truncate w-full text-center">{label}</span>
    </button>
  );
}

function MiniShape({ shape }: { shape: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="fill-current">
      {shape === "circle" && <circle cx="10" cy="10" r="8" />}
      {shape === "square" && <rect x="2" y="2" width="16" height="16" rx="3" />}
      {shape === "hex" && <polygon points="10,1 18.5,5.5 18.5,14.5 10,19 1.5,14.5 1.5,5.5" />}
      {shape === "diamond" && <polygon points="10,1 19,10 10,19 1,10" />}
    </svg>
  );
}

export { AvatarBuilder };
