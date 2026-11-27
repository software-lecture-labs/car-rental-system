import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CarTable } from "@/components/admin/CarTable";
import { SectionHead } from "@/components/layout/SectionHead";
import { BlockSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";
import { serverApi } from "@/lib/api/server";
import { attempt } from "@/lib/attempt";
import { errorMessage } from "@/lib/messages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Araçlar" };

export default function AdminCarsPage() {
  return (
    <>
      <SectionHead
        code="DEFTER 01"
        title="Araçlar"
        aside={
          <Link href="/admin/araclar/yeni" className={buttonClass("primary", "sm")}>
            + Yeni araç
          </Link>
        }
      />
      <div className="pt-4">
        <Suspense fallback={<BlockSkeleton className="h-80" />}>
          <Cars />
        </Suspense>
      </div>
    </>
  );
}

async function Cars() {
  await requireRole("ADMIN");
  const result = await attempt(serverApi.cars.list());
  if (!result.ok) return <Notice tone="err" title="Araçlar yüklenemedi.">{errorMessage(result.error, "load")}</Notice>;
  if (result.data.length === 0) return <p className="py-8 text-muted">Kayıtlı araç yok. İlk aracı ekleyerek başla.</p>;
  const cars = [...result.data].sort((a, b) => a.plate.localeCompare(b.plate));
  return (
    <>
      <p className="figures pb-2 text-xs text-muted">
        {cars.length} KAYIT · {cars.filter((c) => c.status === "AVAILABLE").length} MÜSAİT · {cars.filter((c) => c.status === "RENTED").length} KİRADA ·{" "}
        {cars.filter((c) => c.status === "MAINTENANCE").length} BAKIMDA
      </p>
      <CarTable cars={cars} />
    </>
  );
}
