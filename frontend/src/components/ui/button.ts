/**
 * Buton sınıfları. Turuncu ("reserve") SADECE rezervasyona götüren eylemlerde kullanılır:
 * araç ara, rezervasyon yap, onayla. Turuncunun üstündeki yazı lacivert (beyazın kontrastı ~2.9:1, laciverdin ~5.4:1).
 * Diğer bütün butonlar lacivert dolgu ya da çerçeveli.
 */
export type ButtonVariant = "reserve" | "primary" | "outline" | "quiet" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-sans font-semibold whitespace-nowrap " +
  "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 select-none";

const variants: Record<ButtonVariant, string> = {
  reserve: "bg-orange text-navy hover:bg-orange-soft border border-orange hover:border-orange-soft",
  primary: "bg-navy text-white hover:bg-navy-soft border border-navy",
  outline: "border border-navy text-navy bg-white hover:bg-card",
  quiet: "border border-transparent text-navy underline underline-offset-4 decoration-rule-strong hover:decoration-navy",
  danger: "border border-err text-err bg-white hover:bg-err-bg",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[0.8125rem]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = ""): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}
