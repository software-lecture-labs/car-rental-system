import type { ReactNode } from "react";

export type NoticeTone = "ok" | "err" | "warn" | "info";

const tones: Record<NoticeTone, string> = {
  ok: "bg-ok-bg border-ok-rule text-ok",
  err: "bg-err-bg border-err-rule text-err",
  warn: "bg-warn-bg border-warn-rule text-warn",
  info: "bg-info-bg border-rule text-navy",
};

const marks: Record<NoticeTone, string> = { ok: "TAMAM", err: "HATA", warn: "DİKKAT", info: "NOT" };

/**
 * Bilgi / hata kutusu. Solda kalın çizgi, başta küçük etiket; ikon yok.
 * Hata ve uyarılar ekran okuyucuya hemen okunur (role="alert"), diğerleri sırayla (role="status").
 */
export function Notice({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: NoticeTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "err" || tone === "warn" ? "alert" : "status"}
      className={`animate-fade border border-l-4 px-4 py-3 text-sm ${tones[tone]} ${className}`}
    >
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="figures text-[0.6875rem] font-semibold tracking-widest">{marks[tone]}</span>
        {title ? <span className="font-semibold">{title}</span> : null}
      </p>
      {children ? <div className="mt-1 text-ink [&_a]:font-semibold [&_a]:text-navy [&_a]:underline">{children}</div> : null}
    </div>
  );
}
