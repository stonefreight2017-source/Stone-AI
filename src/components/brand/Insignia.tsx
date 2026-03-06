/**
 * Stone AI Insignia — Concept E "The Meridian Mark"
 * 8 converging lines at 45° intervals with a gap before center.
 * Center dot = "The Stone" in gold (#C9A84C).
 * Lines = Cyan (#00D4AA) for Stone AI, Gold for Best AI.
 *
 * Selected from Three-Headed Monster brand system, March 3 2026.
 */

interface InsigniaProps {
  size?: number;
  variant?: "primary" | "mono" | "warm";
  className?: string;
}

export function Insignia({ size = 40, variant = "primary", className = "" }: InsigniaProps) {
  const lineColor =
    variant === "primary" ? "#00D4AA" :
    variant === "warm" ? "#C9A84C" :
    "#FFFFFF";

  const dotColor = "#C9A84C";
  const strokeWidth = size > 30 ? 1.8 : 1.4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 250 250"
      className={`shrink-0 ${className}`}
      aria-label="Stone AI insignia"
    >
      {/* 8 meridian lines — stop short of center (the gap creates tension) */}
      <g stroke={lineColor} strokeWidth={strokeWidth * (250 / size)} strokeLinecap="round">
        {/* Vertical */}
        <line x1="125" y1="15" x2="125" y2="95" />
        <line x1="125" y1="155" x2="125" y2="235" />
        {/* Horizontal */}
        <line x1="15" y1="125" x2="95" y2="125" />
        <line x1="155" y1="125" x2="235" y2="125" />
        {/* Diagonals */}
        <line x1="47" y1="47" x2="99" y2="99" />
        <line x1="203" y1="203" x2="151" y2="151" />
        <line x1="203" y1="47" x2="151" y2="99" />
        <line x1="47" y1="203" x2="99" y2="151" />
      </g>
      {/* The Stone — center dot */}
      <circle cx="125" cy="125" r={size > 30 ? 7 : 10} fill={dotColor} />
    </svg>
  );
}
