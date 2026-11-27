import type { ReactNode } from "react";

/** Panel sayfası başlığı: sayfanın h1'i, solda kısa açıklama, sağda yan bilgi. */
export function SectionHead({ code, title, lead, aside }: { code: string; title: string; lead?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy pb-3">
      <div>
        <p className="doc-label figures">{code}</p>
        <h1 className="mt-1 text-2xl">{title}</h1>
        {lead ? <p className="mt-1 max-w-[60ch] text-sm text-muted">{lead}</p> : null}
      </div>
      {aside}
    </div>
  );
}
