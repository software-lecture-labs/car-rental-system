"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Panel içi gezinme: belge dizini gibi numaralı satırlar. Etkin bölüm aria-current ile işaretlenir. */
export function SectionNav({ items, label }: { items: { href: string; label: string; exact?: boolean }[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ol className="flex gap-1 overflow-x-auto border-b border-rule lg:flex-col lg:gap-0 lg:border-t lg:border-b-0">
        {items.map((item, i) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="shrink-0 lg:border-b lg:border-rule">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-baseline gap-3 px-3 py-2.5 text-sm whitespace-nowrap ${
                  active ? "border-b-2 border-navy font-semibold text-navy lg:border-b-0 lg:border-l-4 lg:bg-card" : "text-ink hover:text-navy"
                }`}
              >
                <span className="figures text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
