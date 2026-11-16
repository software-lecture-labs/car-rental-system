import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerAdmin } from "@/components/admin/CustomerAdmin";
import { SectionHead } from "@/components/layout/SectionHead";
import { BlockSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { serverApi } from "@/lib/api/server";
import { attempt } from "@/lib/attempt";
import { errorMessage } from "@/lib/messages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Müşteriler" };

export default function AdminCustomersPage() {
  return (
    <>
      <SectionHead code="DEFTER 03" title="Müşteriler" lead="Kiralama kaydı olan müşteri silinemez (kayıtlar ona bağlı)." />
      <div className="pt-4">
        <Suspense fallback={<BlockSkeleton className="h-80" />}>
          <Customers />
        </Suspense>
      </div>
    </>
  );
}

async function Customers() {
  await requireRole("ADMIN");
  const result = await attempt(serverApi.customers.list());
  if (!result.ok) return <Notice tone="err" title="Müşteriler yüklenemedi.">{errorMessage(result.error, "load")}</Notice>;
  const sorted = [...result.data].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, "tr"));
  return <CustomerAdmin customers={sorted} />;
}
