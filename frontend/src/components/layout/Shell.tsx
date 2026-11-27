import Link from "next/link";
import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

/** Marka: plakadaki mavi şeridi hatırlatan ince bir dikey çizgi + geniş grotesk yazı. */
export function Wordmark() {
  return (
    <Link href="/" className="group inline-flex items-stretch gap-2.5" aria-label="RentACar ana sayfa">
      <span aria-hidden className="w-1.5 bg-plate-blue" />
      <span className="flex flex-col justify-center leading-none">
        <span className="display-wide text-[1.15rem] font-extrabold tracking-tight text-navy">RENTACAR</span>
        <span className="doc-label mt-1 text-[0.6rem]! tracking-[0.2em]!">Araç kiralama</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ session }: { session: ReactNode }) {
  return (
    <header className="border-b border-navy">
      <Container className="flex min-h-16 flex-wrap items-center gap-x-8 gap-y-2 py-3">
        <Wordmark />
        <nav aria-label="Ana menü" className="flex items-center gap-6 text-sm font-semibold text-navy">
          <Link href="/araclar" className="underline-offset-[6px] hover:underline">
            Araçlar
          </Link>
          <Link href="/#tarife" className="underline-offset-[6px] hover:underline">
            Tarife
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">{session}</div>
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <Container className="flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="figures">RENTACAR · ARAÇ KİRALAMA</p>
        <p>Tarih ve saatler Türkiye saatiyle (Europe/Istanbul). Tutarlar Türk lirası.</p>
      </Container>
    </footer>
  );
}

/** Belge başlığı: form kodu, başlık, isteğe bağlı açıklama ve sağda yan bilgi. */
export function PageHead({
  form,
  title,
  lead,
  aside,
}: {
  form: string;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="grid gap-4 border-b border-rule pt-8 pb-6 md:grid-cols-12 md:items-end">
      <div className="md:col-span-8">
        <p className="doc-label figures">{form}</p>
        <h1 className="mt-2 text-[2rem] sm:text-[2.5rem]">{title}</h1>
        {lead ? <p className="mt-3 max-w-[60ch] text-[0.95rem] text-muted">{lead}</p> : null}
      </div>
      {aside ? <div className="md:col-span-4 md:justify-self-end">{aside}</div> : null}
    </div>
  );
}
