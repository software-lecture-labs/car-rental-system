import type { ReactNode } from "react";

/**
 * Kiralama fişi / sözleşme özeti. Kalemler satır satır, noktalı kılavuz çizgileriyle tutara bağlanır.
 */
export function Receipt({
  title,
  serial,
  children,
  footer,
  className = "",
}: {
  title: string;
  serial?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={`border border-rule bg-card ${className}`}
      style={{
        // yırtma çizgisi: üst ve alt kenarda kesik çizgi
        borderTop: "2px dashed var(--color-rule-strong)",
        borderBottom: "2px dashed var(--color-rule-strong)",
      }}
    >
      <header className="flex items-baseline justify-between gap-4 border-b border-rule px-4 pt-3 pb-2">
        <h2 className="doc-label text-navy!">{title}</h2>
        {serial ? <span className="figures text-xs text-muted">{serial}</span> : null}
      </header>
      <div className="px-4 py-3">{children}</div>
      {footer ? <div className="border-t border-rule px-4 py-3 text-sm text-muted">{footer}</div> : null}
    </section>
  );
}

export function ReceiptLine({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "muted" | "credit";
}) {
  return (
    <div className="py-1">
      <div className="flex items-baseline gap-2 text-sm">
        <span className={tone === "muted" ? "text-muted" : "text-ink"}>{label}</span>
        <span aria-hidden className="leader" />
        <span className={`figures text-right whitespace-nowrap ${tone === "credit" ? "text-ok" : "text-navy"}`}>{value}</span>
      </div>
      {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

export function ReceiptTotal({ label, value, note }: { label: ReactNode; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="mt-2 border-t-[3px] border-double border-navy pt-2">
      <div className="flex items-baseline gap-2">
        <span className="display-wide text-sm font-bold tracking-wide text-navy uppercase">{label}</span>
        <span aria-hidden className="leader" />
        <span className="figures text-xl font-semibold whitespace-nowrap text-navy">{value}</span>
      </div>
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
    </div>
  );
}
