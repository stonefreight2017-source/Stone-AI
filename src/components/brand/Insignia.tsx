/**
 * Umbrella Brand Insignia — Concept D "Meridian"
 * Cyan circle with "M" monogram, Meridian by Stone.
 * Selected from Three-Headed Monster umbrella brand system.
 */

interface InsigniaProps {
  size?: number;
  variant?: "primary" | "mono" | "warm";
  className?: string;
}

export function Insignia({ size = 40, variant = "primary", className = "" }: InsigniaProps) {
  const ringColor =
    variant === "primary" ? "#22d3ee" :
    variant === "warm" ? "#C9A84C" :
    "#FFFFFF";

  const letterColor = ringColor;
  const strokeWidth = size > 30 ? 1.5 : 1.2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`shrink-0 ${className}`}
      aria-label="Meridian insignia"
    >
      <circle
        cx="24"
        cy="24"
        r="22"
        fill="none"
        stroke={ringColor}
        strokeWidth={strokeWidth * (48 / size)}
      />
      <text
        x="24"
        y="25"
        textAnchor="middle"
        dominantBaseline="central"
        fill={letterColor}
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
        fontSize="18"
      >
        M
      </text>
    </svg>
  );
}
