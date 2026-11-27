import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RentalTable } from "@/components/admin/RentalTable";
import { SectionHead } from "@/components/layout/SectionHead";
import { BlockSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { serverApi } from "@/lib/api/server";
import { TRANSACTION_STATUSES, type TransactionStatus } from "@/lib/api/types";
import { attempt } from "@/lib/attempt";
import { TRANSACTION_STATUS_LABELS } from "@/lib/labels";
import { errorMessage } from "@/lib/messages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Kiralamalar" };

export default function AdminRentalsPage({ searchParams }: PageProps<"/admin/kiralamalar">) {
  return (
    <>
      <SectionHead
        code="DEFTER 02"
        title="Kiralamalar"
        lead="Teslimde kalan tutar müşterinin bakiyesinden düşülür. Başlangıçtan 4 saat sonra teslim alınmayan rezervasyonları backend kendisi iptal eder."
      />
      <Suspense fallback={<BlockSkeleton className="mt-4 h-80" />}>
        <Rentals searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Rentals({ searchParams }: { searchParams: PageProps<"/admin/kiralamalar">["searchParams"] }) {
  const params = await searchParams;
  await requireRole("ADMIN");
  const raw = Array.isArray(params.durum) ? params.durum[0] : params.durum;
  const status = (TRANSACTION_STATUSES as readonly string[]).includes(raw ?? "") ? (raw as TransactionStatus) : null;

  const [rentals, cars] = await Promise.all([
    attempt(status ? serverApi.rentals.byStatus(status) : serverApi.rentals.list()),
    attempt(serverApi.cars.list()),
  ]);

  const tabs: { value: TransactionStatus | null; label: string }[] = [
    { value: null, label: "Tümü" },
    ...TRANSACTION_STATUSES.map((s) => ({ value: s, label: TRANSACTION_STATUS_LABELS[s] })),
  ];

  return (
    <div className="pt-4">
      <nav aria-label="Duruma göre filtre" className="mb-3 flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const active = tab.value === status;
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/admin/kiralamalar?durum=${tab.value}` : "/admin/kiralamalar"}
              aria-current={active ? "page" : undefined}
              className={`border px-3 py-1.5 text-[0.8125rem] font-semibold ${active ? "border-navy bg-navy text-white" : "border-rule text-navy hover:border-navy"}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {!rentals.ok ? (
        <Notice tone="err" title="Kiralamalar yüklenemedi.">{errorMessage(rentals.error, "load")}</Notice>
      ) : rentals.data.length === 0 ? (
        <p className="border-t border-navy py-8 text-sm text-muted">Bu durumda kiralama yok.</p>
      ) : (
        <>
          <p className="figures pb-2 text-xs text-muted">{rentals.data.length} KAYIT</p>
          <RentalTable
            rentals={[...rentals.data].sort((a, b) => b.rentalStart.localeCompare(a.rentalStart))}
            cars={cars.ok ? cars.data : []}
          />
        </>
      )}
    </div>
  );
}
