/**
 * Stone Intelligence — #4 "Block Fluid" wordmark
 * Raleway 300, uppercase, wide letter-spacing, gold gradient line.
 * Sub-brand pills: Stone AI | Best AI | Tools
 * Selected from Stone Intelligence Logos page.
 */

interface InsigniaProps {
  size?: number;
  showPills?: boolean;
  className?: string;
}

export function Insignia({ size = 16, showPills = true, className = "" }: InsigniaProps) {
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
      {showPills && (
        <div
          style={{
            display: "flex",
            gap: `${6 * scale}px`,
            marginTop: `${8 * scale}px`,
          }}
        >
          {["Stone AI", "Best AI", "Tools"].map((label, i) => (
            <span
              key={label}
              style={{
                fontSize: `${5 * scale}px`,
                letterSpacing: `${0.5 * scale}px`,
                textTransform: "uppercase" as const,
                color: i === 0 ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.25)",
                padding: `${1.5 * scale}px ${4 * scale}px`,
                border: `1px solid ${i === 0 ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: `${2 * scale}px`,
                whiteSpace: "nowrap" as const,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
