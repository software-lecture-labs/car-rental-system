import type { Metadata } from "next";
import { Suspense } from "react";
import { PricingAdmin } from "@/components/admin/PricingAdmin";
import { SectionHead } from "@/components/layout/SectionHead";
import { BlockSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { serverApi } from "@/lib/api/server";
import { attempt } from "@/lib/attempt";
import { errorMessage } from "@/lib/messages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Fiyat kademeleri" };

export default function AdminPricingPage() {
  return (
    <>
      <SectionHead code="DEFTER 04" title="Fiyat kademeleri" lead="Yeni oran sadece bundan sonraki kiralamalara uygulanır; kayıtlı kiralamalar işlem anındaki oranı saklar." />
      <div className="pt-4">
        <Suspense fallback={<BlockSkeleton className="h-60 max-w-3xl" />}>
          <Pricing />
        </Suspense>
      </div>
    </>
  );
}

async function Pricing() {
  await requireRole("ADMIN");
  const result = await attempt(serverApi.pricing.policies());
  if (!result.ok) return <Notice tone="err" title="Kademeler yüklenemedi.">{errorMessage(result.error, "load")}</Notice>;
  return <PricingAdmin policies={result.data} />;
}
