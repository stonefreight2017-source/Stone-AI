/**
 * Stone Intelligence — #4 "Block Fluid" wordmark
 * Raleway 300, uppercase, wide letter-spacing, gold gradient line.
 * Selected from Stone Intelligence Logos page.
 */

interface InsigniaProps {
  size?: number;
  variant?: "primary" | "mono" | "warm";
  className?: string;
}

export function Insignia({ size = 16, className = "" }: InsigniaProps) {
  const scale = size / 16;

  return (
    <div
      className={`shrink-0 flex flex-col items-center ${className}`}
      aria-label="Stone Intelligence"
    >
      <span
        style={{
          fontFamily: "'Raleway', sans-serif",
          fontWeight: 300,
          fontSize: `${size}px`,
          letterSpacing: `${0.3 * scale}em`,
          textTransform: "uppercase" as const,
          color: "#fff",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        Stone Intelligence
      </span>
      <span
        style={{
          width: `${32 * scale}px`,
          height: `${1.5 * scale}px`,
          background: "linear-gradient(90deg, #d4af37, #888)",
          marginTop: `${4 * scale}px`,
          borderRadius: `${1 * scale}px`,
        }}
      />
    </div>
  );
}
