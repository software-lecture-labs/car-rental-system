/**
 * Görseli olmayan araç için yer tutucu: taralı zemin üstünde teknik çizim gibi bir araç silueti.
 * Fotoğraf değil, SVG.
 */
export function CarPlaceholder({ label = "GÖRSEL YOK", className = "" }: { label?: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-full w-full bg-card ${className}`}
      style={{
        backgroundImage: "repeating-linear-gradient(45deg, var(--color-rule) 0 1px, transparent 1px 9px)",
      }}
    >
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" focusable="false">
      <g fill="none" stroke="#0A2540" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.55">
        <path d="M58 188 L62 160 Q66 146 84 142 L132 134 L170 104 Q182 95 200 95 L262 95 Q278 95 290 106 L322 134 L350 140 Q366 144 368 160 L370 188" />
        <path d="M58 188 L96 188 M144 188 L274 188 M322 188 L370 188" />
        <path d="M144 134 L178 108 Q186 102 198 102 L228 102 L228 134 Z" />
        <path d="M238 102 L260 102 Q272 102 280 110 L304 134 L238 134 Z" />
        <circle cx="120" cy="188" r="23" />
        <circle cx="120" cy="188" r="9" />
        <circle cx="298" cy="188" r="23" />
        <circle cx="298" cy="188" r="9" />
        <path d="M232 146 L246 146" />
      </g>
      <line x1="30" y1="212" x2="370" y2="212" stroke="#7A8899" strokeWidth="1" strokeDasharray="4 4" />
      <text
        x="200"
        y="248"
        textAnchor="middle"
        fill="#51637A"
        style={{ font: "600 13px var(--font-mono)", letterSpacing: "0.18em" }}
      >
        {label}
      </text>
    </svg>
    </div>
  );
}
