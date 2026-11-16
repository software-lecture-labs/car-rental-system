export type StampTone = "navy" | "ok" | "err" | "warn" | "muted";

const tones: Record<StampTone, string> = {
  navy: "text-navy border-navy",
  ok: "text-ok border-ok",
  err: "text-err border-err",
  warn: "text-warn border-warn",
  muted: "text-muted border-muted",
};

/**
 * Damga: hafif eğik, çift çerçeveli. Sayfaya girerken "basılır" (prefers-reduced-motion'da hareketsiz).
 */
export function Stamp({
  label,
  tone = "navy",
  note,
  animate = true,
  size = "md",
}: {
  label: string;
  tone?: StampTone;
  note?: string;
  animate?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex flex-col items-center rounded-sm border-[3px] border-double leading-none ${tones[tone]} ${
        size === "sm" ? "px-2 py-1" : "px-3 py-1.5"
      } ${animate ? "animate-stamp" : ""}`}
      style={{ transform: "rotate(var(--stamp-tilt, -4deg))", opacity: 0.92 }}
    >
      <span className={`display-wide font-extrabold tracking-[0.12em] uppercase ${size === "sm" ? "text-[0.7rem]" : "text-sm"}`}>
        {label}
      </span>
      {note ? <span className="figures mt-1 text-[0.625rem] tracking-wide uppercase">{note}</span> : null}
    </span>
  );
}
