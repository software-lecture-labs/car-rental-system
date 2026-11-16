import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SectionHead } from "@/components/layout/SectionHead";
import { RentalLedger } from "@/components/rental/RentalLedger";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";
import { serverApi } from "@/lib/api/server";
import { attempt } from "@/lib/attempt";
import { errorMessage } from "@/lib/messages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Kiralamalarım" };

export default function MyRentalsPage() {
  return (
    <>
      <SectionHead code="BÖLÜM 03" title="Kiralamalarım" lead="Fiyatlar kiralama anındaki değerlerdir; aracın bugünkü fiyatı değişse de sözleşmen değişmez." />
      <Suspense fallback={<ListSkeleton rows={2} label="Kiralamalar yükleniyor" />}>
        <Rentals />
      </Suspense>
    </>
  );
}

async function Rentals() {
  const user = await requireRole("CUSTOMER");
  const result = await attempt(serverApi.rentals.byCustomer(user.id));
  if (!result.ok) return <Notice tone="err" title="Kiralamalar yüklenemedi." className="mt-6">{errorMessage(result.error, "load")}</Notice>;

  const sorted = [...result.data].sort((a, b) => b.rentalStart.localeCompare(a.rentalStart));
  const open = sorted.filter((r) => r.status === "PENDING");
  const closed = sorted.filter((r) => r.status !== "PENDING");
  const href = (r: { id: string }) => `/hesabim/kiralamalar/${r.id}`;

  if (sorted.length === 0) {
    return (
      <div className="py-10">
        <p className="text-lg font-semibold text-navy">Henüz kiralaman yok.</p>
        <p className="mt-1 text-sm text-muted">Tarih seçip müsait araçlara bakarak başlayabilirsin.</p>
        <Link href="/araclar" className={buttonClass("reserve", "md", "mt-4")}>
          Araç ara
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pt-6">
      <section aria-labelledby="acik">
        <h2 id="acik" className="doc-label mb-2 text-navy!">
          Açık · <span className="figures">{open.length}</span>
        </h2>
        {open.length ? <RentalLedger rentals={open} hrefFor={href} /> : <p className="border-t border-navy py-4 text-sm text-muted">Açık kiralaman yok.</p>}
      </section>
      <section aria-labelledby="gecmis">
        <h2 id="gecmis" className="doc-label mb-2 text-navy!">
          Geçmiş · <span className="figures">{closed.length}</span>
        </h2>
        {closed.length ? <RentalLedger rentals={closed} hrefFor={href} /> : <p className="border-t border-navy py-4 text-sm text-muted">Kapanmış kiralama yok.</p>}
      </section>
    </div>
  );
}
