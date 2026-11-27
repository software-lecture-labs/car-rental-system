import type { ReactNode } from "react";

export interface DocField {
  /** Ruhsattaki alan kodu, ör. "D.1". Ruhsatta karşılığı olmayan alanlarda boş bırakılır. */
  code?: string;
  label: string;
  value: ReactNode;
  mono?: boolean;
  wide?: boolean;
}

/**
 * Ruhsat formu gibi bilgi ızgarası: ince çizgilerle ayrılmış hücreler, üstte küçük büyük harfli etiket, altta değer.
 */
export function DocFields({ fields, columns = 3 }: { fields: DocField[]; columns?: 2 | 3 | 4 }) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <dl className={`grid grid-cols-2 border-t border-l border-rule ${cols}`}>
      {fields.map((field) => (
        <div
          key={field.label}
          className={`min-w-0 border-r border-b border-rule px-3 pt-2 pb-2.5 ${field.wide ? "col-span-2" : ""}`}
        >
          <dt className="doc-label">
            {field.code ? <span className="figures mr-1 font-medium text-muted">({field.code})</span> : null}
            {field.label}
          </dt>
          <dd className={`mt-1 truncate text-[0.95rem] text-navy ${field.mono ? "figures" : "font-medium"}`}>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}
