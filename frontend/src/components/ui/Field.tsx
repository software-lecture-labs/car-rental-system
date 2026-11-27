import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const inputClass =
  "block h-11 w-full rounded-sm border border-rule-strong bg-white px-3 text-[0.95rem] text-navy " +
  "placeholder:text-muted/70 aria-[invalid=true]:border-err aria-[invalid=true]:bg-err-bg/40 " +
  "[&[readonly]]:bg-card [&[readonly]]:text-muted disabled:bg-card disabled:text-muted";

/**
 * Form alanı: belge kutusu gibi; üstte numaralı küçük etiket, altta değer, altında ipucu ya da hata.
 * Hata metni aria-describedby ile alana bağlanır.
 */
export function Field({
  id,
  label,
  code,
  hint,
  error,
  children,
  className = "",
}: {
  id: string;
  label: string;
  code?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="doc-label mb-1.5 block">
        {code ? <span className="figures mr-1 text-muted">{code}</span> : null}
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.8125rem] font-medium text-err">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.8125rem] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Field ile birlikte kullanılan input; hata ve ipucu kimliklerini otomatik bağlar. */
export function TextInput({
  id,
  error,
  hint,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { id: string; error?: string; hint?: boolean }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <input
      id={id}
      name={rest.name ?? id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      className={`${inputClass} ${className}`}
      {...rest}
    />
  );
}

export function SelectInput({
  id,
  error,
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { id: string; error?: string }) {
  return (
    <select
      id={id}
      name={rest.name ?? id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${inputClass} appearance-none bg-[length:10px_6px] bg-[right_0.85rem_center] bg-no-repeat pr-9 ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%230A2540' stroke-width='1.5'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    >
      {children}
    </select>
  );
}
