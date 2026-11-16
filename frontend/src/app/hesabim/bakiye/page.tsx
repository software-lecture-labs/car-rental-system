import type { Metadata } from "next";
import { Suspense } from "react";
import { BalanceForm } from "@/components/account/BalanceForm";
import { SectionHead } from "@/components/layout/SectionHead";
import { BlockSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { serverApi } from "@/lib/api/server";
import { attempt } from "@/lib/attempt";
import { formatTL } from "@/lib/format";
import { errorMessage } from "@/lib/messages";
import { DEPOSIT_RATE_PERCENT } from "@/lib/pricing";
import { requireRole, safeNextPath } from "@/lib/session";

export const metadata: Metadata = { title: "Bakiye" };

export default function BalancePage({ searchParams }: PageProps<"/hesabim/bakiye">) {
  return (
    <>
      <SectionHead
        code="BÖLÜM 02"
        title="Bakiye"
        lead={`Rezervasyonda toplamın %${DEPOSIT_RATE_PERCENT}'si ön ödeme olarak, kalanı araç teslim edilirken bakiyenden düşülür.`}
      />
      <div className="pt-6">
        <Suspense fallback={<BlockSkeleton className="h-80 max-w-xl" />}>
          <Balance searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Balance({ searchParams }: { searchParams: PageProps<"/hesabim/bakiye">["searchParams"] }) {
  const params = await searchParams;
  const user = await requireRole("CUSTOMER");
  const customer = await attempt(serverApi.customers.get(user.id));
  if (!customer.ok) return <Notice tone="err" title="Bakiye yüklenemedi.">{errorMessage(customer.error, "load")}</Notice>;

  const requiredRaw = Number(Array.isArray(params.gerekli) ? params.gerekli[0] : params.gerekli);
  const required = Number.isFinite(requiredRaw) && requiredRaw > 0 ? Math.ceil(requiredRaw * 100) / 100 : null;
  const next = safeNextPath(params.next, "") || null;

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_16rem]">
      <div className="space-y-6">
        {required ? (
          <Notice tone="info" title="Rezervasyon için ön ödeme eksik.">
            Ön ödemeyi karşılamak için en az <span className="figures font-semibold">{formatTL(required)}</span> yüklemen gerekiyor. Tutar aşağıya yazıldı.
          </Notice>
        ) : null}
        <BalanceForm customerId={user.id} required={required} next={next} />
      </div>
      <div className="order-first border border-rule bg-card p-5 xl:order-none xl:self-start">
        <p className="doc-label">Güncel bakiye</p>
        <p className="figures mt-2 text-3xl font-semibold text-navy">{formatTL(customer.data.balance)}</p>
        <p className="mt-3 text-xs text-muted">Bu projede ödeme sistemi yok; yüklenen tutar doğrudan bakiyeye eklenir.</p>
      </div>
    </div>
  );
}
