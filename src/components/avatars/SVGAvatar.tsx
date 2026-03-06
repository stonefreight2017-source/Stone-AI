"use client";

import type { AvatarConfig } from "./avatar-parts";

interface SVGAvatarProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

// ── Shape clip paths ──

function ShapeClip({ shape }: { shape: AvatarConfig["shape"] }) {
  switch (shape) {
    case "circle":
      return (
        <clipPath id="avatar-clip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      );
    case "square":
      return (
        <clipPath id="avatar-clip">
          <rect x="2" y="2" width="96" height="96" rx="12" />
        </clipPath>
      );
    case "hex":
      return (
        <clipPath id="avatar-clip">
          <polygon points="50,2 93,27 93,73 50,98 7,73 7,27" />
        </clipPath>
      );
    case "diamond":
      return (
        <clipPath id="avatar-clip">
          <polygon points="50,2 96,50 50,98 4,50" />
        </clipPath>
      );
  }
}

// ── Background patterns ──

function PatternDefs({
  pattern,
  baseColor,
  accentColor,
}: {
  pattern: AvatarConfig["pattern"];
  baseColor: string;
  accentColor: string;
}) {
  switch (pattern) {
    case "solid":
      return null;
    case "gradient":
      return (
        <linearGradient id="bg-pattern" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={baseColor} />
          <stop offset="100%" stopColor={accentColor} />
        </linearGradient>
      );
    case "dots":
      return (
        <pattern id="bg-pattern" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={baseColor} />
          <circle cx="6" cy="6" r="2" fill={accentColor} opacity="0.5" />
        </pattern>
      );
    case "stripes":
      return (
        <pattern id="bg-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill={baseColor} />
          <rect width="4" height="8" fill={accentColor} opacity="0.3" />
        </pattern>
      );
    case "waves":
      return (
        <pattern id="bg-pattern" width="20" height="10" patternUnits="userSpaceOnUse">
          <rect width="20" height="10" fill={baseColor} />
          <path d="M0,5 Q5,0 10,5 Q15,10 20,5" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.4" />
        </pattern>
      );
    case "circuit":
      return (
        <pattern id="bg-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill={baseColor} />
          <path d="M0,8 H6 M10,8 H16 M8,0 V6 M8,10 V16" stroke={accentColor} strokeWidth="0.8" opacity="0.35" />
          <circle cx="8" cy="8" r="1.5" fill={accentColor} opacity="0.4" />
        </pattern>
      );
    case "geo":
      return (
        <pattern id="bg-pattern" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill={baseColor} />
          <polygon points="7,1 13,13 1,13" fill="none" stroke={accentColor} strokeWidth="0.8" opacity="0.3" />
        </pattern>
      );
  }
}

function Background({
  pattern,
  baseColor,
}: {
  pattern: AvatarConfig["pattern"];
  baseColor: string;
}) {
  const fill = pattern === "solid" ? baseColor : "url(#bg-pattern)";
  return <rect x="0" y="0" width="100" height="100" fill={fill} />;
}

// ── Eyes ──

function Eyes({ type }: { type: AvatarConfig["eyes"] }) {
  const lx = 35;
  const rx = 65;
  const y = 40;

  switch (type) {
    case "friendly":
      return (
        <>
          <circle cx={lx} cy={y} r="5" fill="white" />
          <circle cx={lx + 1} cy={y} r="2.5" fill="#1e293b" />
          <circle cx={rx} cy={y} r="5" fill="white" />
          <circle cx={rx + 1} cy={y} r="2.5" fill="#1e293b" />
          {/* Shine */}
          <circle cx={lx + 2.5} cy={y - 1.5} r="1" fill="white" opacity="0.8" />
          <circle cx={rx + 2.5} cy={y - 1.5} r="1" fill="white" opacity="0.8" />
        </>
      );
    case "cool":
      return (
        <>
          <ellipse cx={lx} cy={y} rx="5.5" ry="3.5" fill="white" />
          <circle cx={lx + 0.5} cy={y} r="2" fill="#1e293b" />
          <ellipse cx={rx} cy={y} rx="5.5" ry="3.5" fill="white" />
          <circle cx={rx + 0.5} cy={y} r="2" fill="#1e293b" />
        </>
      );
    case "wink":
      return (
        <>
          <circle cx={lx} cy={y} r="5" fill="white" />
          <circle cx={lx + 1} cy={y} r="2.5" fill="#1e293b" />
          <circle cx={lx + 2.5} cy={y - 1.5} r="1" fill="white" opacity="0.8" />
          {/* Winking eye */}
          <path d={`M${rx - 5},${y} Q${rx},${y - 4} ${rx + 5},${y}`} fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "stars":
      return (
        <>
          <Star cx={lx} cy={y} size={6} />
          <Star cx={rx} cy={y} size={6} />
        </>
      );
    case "hearts":
      return (
        <>
          <Heart cx={lx} cy={y} size={5} />
          <Heart cx={rx} cy={y} size={5} />
        </>
      );
    case "focus":
      return (
        <>
          <circle cx={lx} cy={y} r="5" fill="white" />
          <circle cx={lx} cy={y} r="3" fill="#1e293b" />
          <circle cx={lx} cy={y} r="1.5" fill="white" />
          <circle cx={rx} cy={y} r="5" fill="white" />
          <circle cx={rx} cy={y} r="3" fill="#1e293b" />
          <circle cx={rx} cy={y} r="1.5" fill="white" />
        </>
      );
    case "sleepy":
      return (
        <>
          <path d={`M${lx - 5},${y} Q${lx},${y + 3} ${lx + 5},${y}`} fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <path d={`M${rx - 5},${y} Q${rx},${y + 3} ${rx + 5},${y}`} fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "fierce":
      return (
        <>
          {/* Angled brows */}
          <line x1={lx - 5} y1={y - 6} x2={lx + 4} y2={y - 4} stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx={lx} cy={y} r="4.5" fill="white" />
          <circle cx={lx + 1} cy={y} r="2.5" fill="#1e293b" />
          <line x1={rx + 5} y1={y - 6} x2={rx - 4} y2={y - 4} stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx={rx} cy={y} r="4.5" fill="white" />
          <circle cx={rx - 1} cy={y} r="2.5" fill="#1e293b" />
        </>
      );
  }
}

// ── Helper shapes ──

function Star({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI / 2) * -1 + (i * 2 * Math.PI) / 5;
    const innerAngle = outerAngle + Math.PI / 5;
    pts.push(`${cx + Math.cos(outerAngle) * size},${cy + Math.sin(outerAngle) * size}`);
    pts.push(`${cx + Math.cos(innerAngle) * (size * 0.4)},${cy + Math.sin(innerAngle) * (size * 0.4)}`);
  }
  return <polygon points={pts.join(" ")} fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" />;
}

function Heart({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const s = size;
  return (
    <path
      d={`M${cx},${cy + s * 0.4} C${cx - s},${cy - s * 0.6} ${cx - s * 0.1},${cy - s} ${cx},${cy - s * 0.3} C${cx + s * 0.1},${cy - s} ${cx + s},${cy - s * 0.6} ${cx},${cy + s * 0.4}Z`}
      fill="#f43f5e"
      stroke="#e11d48"
      strokeWidth="0.5"
    />
  );
}

// ── Mouths ──

function Mouth({ type }: { type: AvatarConfig["mouth"] }) {
  const cx = 50;
  const y = 62;

  switch (type) {
    case "smile":
      return (
        <path d={`M${cx - 8},${y} Q${cx},${y + 8} ${cx + 8},${y}`} fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      );
    case "grin":
      return (
        <>
          <path d={`M${cx - 10},${y} Q${cx},${y + 10} ${cx + 10},${y}`} fill="white" stroke="#1e293b" strokeWidth="1.5" />
          <path d={`M${cx - 8},${y + 1} L${cx + 8},${y + 1}`} fill="none" stroke="#1e293b" strokeWidth="0.5" />
        </>
      );
    case "neutral":
      return (
        <line x1={cx - 6} y1={y + 2} x2={cx + 6} y2={y + 2} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      );
    case "smirk":
      return (
        <path d={`M${cx - 4},${y + 2} Q${cx + 4},${y + 6} ${cx + 8},${y}`} fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      );
    case "open":
      return (
        <ellipse cx={cx} cy={y + 2} rx="6" ry="5" fill="#1e293b" />
      );
    case "cat":
      return (
        <path d={`M${cx - 8},${y + 1} Q${cx - 3},${y + 5} ${cx},${y + 1} Q${cx + 3},${y + 5} ${cx + 8},${y + 1}`} fill="none" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
      );
    case "tongue":
      return (
        <>
          <path d={`M${cx - 8},${y} Q${cx},${y + 8} ${cx + 8},${y}`} fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx={cx} cy={y + 7} rx="3.5" ry="3" fill="#f87171" />
        </>
      );
  }
}

// ── Accessories ──

function Accessory({ type, accentColor }: { type: AvatarConfig["accessory"]; accentColor: string }) {
  switch (type) {
    case "none":
      return null;
    case "glasses":
      return (
        <g>
          <circle cx="35" cy="40" r="7" fill="none" stroke="#1e293b" strokeWidth="1.8" />
          <circle cx="65" cy="40" r="7" fill="none" stroke="#1e293b" strokeWidth="1.8" />
          <line x1="42" y1="40" x2="58" y2="40" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="28" y1="39" x2="22" y2="37" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="72" y1="39" x2="78" y2="37" stroke="#1e293b" strokeWidth="1.5" />
        </g>
      );
    case "sunglasses":
      return (
        <g>
          <rect x="26" y="35" width="16" height="10" rx="3" fill="#1e293b" />
          <rect x="58" y="35" width="16" height="10" rx="3" fill="#1e293b" />
          <line x1="42" y1="40" x2="58" y2="40" stroke="#1e293b" strokeWidth="2" />
          <line x1="26" y1="39" x2="20" y2="37" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="74" y1="39" x2="80" y2="37" stroke="#1e293b" strokeWidth="1.5" />
          {/* Glare */}
          <line x1="29" y1="37" x2="33" y2="37" stroke="white" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
          <line x1="61" y1="37" x2="65" y2="37" stroke="white" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
        </g>
      );
    case "crown":
      return (
        <g>
          <polygon points="30,22 35,12 42,18 50,8 58,18 65,12 70,22" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
          <rect x="30" y="20" width="40" height="5" rx="1" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.8" />
          <circle cx="42" cy="22" r="1.5" fill="#ef4444" />
          <circle cx="50" cy="22" r="1.5" fill="#3b82f6" />
          <circle cx="58" cy="22" r="1.5" fill="#22c55e" />
        </g>
      );
    case "halo":
      return (
        <ellipse cx="50" cy="14" rx="18" ry="5" fill="none" stroke="#fbbf24" strokeWidth="2.5" opacity="0.8" />
      );
    case "horns":
      return (
        <g>
          <path d="M30,28 Q25,10 20,6" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
          <path d="M70,28 Q75,10 80,6" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path d="M22,40 Q22,16 50,16 Q78,16 78,40" fill="none" stroke="#374151" strokeWidth="3" />
          <rect x="16" y="36" width="8" height="12" rx="3" fill="#374151" />
          <rect x="76" y="36" width="8" height="12" rx="3" fill="#374151" />
          <rect x="17" y="38" width="6" height="8" rx="2" fill={accentColor} opacity="0.6" />
          <rect x="77" y="38" width="6" height="8" rx="2" fill={accentColor} opacity="0.6" />
        </g>
      );
    case "bow":
      return (
        <g>
          <path d="M50,16 Q38,8 36,16 Q38,22 50,16" fill={accentColor} stroke={accentColor} strokeWidth="0.5" opacity="0.9" />
          <path d="M50,16 Q62,8 64,16 Q62,22 50,16" fill={accentColor} stroke={accentColor} strokeWidth="0.5" opacity="0.9" />
          <circle cx="50" cy="16" r="2.5" fill={accentColor} />
        </g>
      );
    case "hat":
      return (
        <g>
          <ellipse cx="50" cy="22" rx="28" ry="4" fill="#374151" />
          <rect x="32" y="6" width="36" height="18" rx="5" fill="#374151" />
          <rect x="34" y="18" width="32" height="3" rx="1" fill={accentColor} opacity="0.7" />
        </g>
      );
    case "beanie":
      return (
        <g>
          <path d="M24,30 Q24,8 50,8 Q76,8 76,30" fill="#374151" />
          <rect x="24" y="26" width="52" height="6" rx="2" fill={accentColor} opacity="0.5" />
          <line x1="30" y1="28" x2="70" y2="28" stroke={accentColor} strokeWidth="1" opacity="0.6" />
          <circle cx="50" cy="8" r="3" fill="#374151" />
        </g>
      );
  }
}

// ── Cheeks (expression overlay) ──

function ExpressionOverlay({ expression }: { expression?: AvatarConfig["expression"] }) {
  switch (expression) {
    case "happy":
    case "excited":
    case "warm":
      return (
        <>
          <circle cx="28" cy="50" r="4" fill="#fca5a5" opacity="0.3" />
          <circle cx="72" cy="50" r="4" fill="#fca5a5" opacity="0.3" />
        </>
      );
    case "confident":
    case "mysterious":
      return (
        <>
          <circle cx="28" cy="50" r="3" fill="#c084fc" opacity="0.15" />
          <circle cx="72" cy="50" r="3" fill="#c084fc" opacity="0.15" />
        </>
      );
    case "chill":
    default:
      return null;
  }
}

// ── Main component ──

export default function SVGAvatar({ config, size = 64, className = "" }: SVGAvatarProps) {
  const { shape, baseColor, accentColor, pattern, eyes, mouth, accessory, expression } = config;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="User avatar"
    >
      <defs>
        <ShapeClip shape={shape} />
        <PatternDefs pattern={pattern} baseColor={baseColor} accentColor={accentColor} />
      </defs>

      <g clipPath="url(#avatar-clip)">
        {/* Background */}
        <Background pattern={pattern} baseColor={baseColor} />

        {/* Face base — lighter oval */}
        <ellipse cx="50" cy="52" rx="24" ry="28" fill="white" opacity="0.15" />

        {/* Expression blush/glow */}
        <ExpressionOverlay expression={expression} />

        {/* Eyes */}
        <Eyes type={eyes} />

        {/* Mouth */}
        <Mouth type={mouth} />

        {/* Accessory */}
        <Accessory type={accessory} accentColor={accentColor} />
      </g>

      {/* Shape outline */}
      <ShapeOutline shape={shape} accentColor={accentColor} />
    </svg>
  );
}

function ShapeOutline({ shape, accentColor }: { shape: AvatarConfig["shape"]; accentColor: string }) {
  const props = { fill: "none", stroke: accentColor, strokeWidth: "1.5", opacity: "0.4" };
  switch (shape) {
    case "circle":
      return <circle cx="50" cy="50" r="48" {...props} />;
    case "square":
      return <rect x="2" y="2" width="96" height="96" rx="12" {...props} />;
    case "hex":
      return <polygon points="50,2 93,27 93,73 50,98 7,73 7,27" {...props} />;
    case "diamond":
      return <polygon points="50,2 96,50 50,98 4,50" {...props} />;
  }
}

export { SVGAvatar };
