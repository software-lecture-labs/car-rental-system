import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CarForm } from "@/components/admin/CarForm";
import { ImageManager } from "@/components/admin/ImageManager";
import { RentalTable } from "@/components/admin/RentalTable";
import { Plate } from "@/components/doc/Plate";
import { Stamp } from "@/components/doc/Stamp";
import { SectionHead } from "@/components/layout/SectionHead";
import { BlockSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";
import { serverApi } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import { attempt } from "@/lib/attempt";
import { CAR_STATUS_LABELS, CAR_STATUS_TONES } from "@/lib/labels";
import { errorMessage } from "@/lib/messages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Araç düzenle" };

export default function EditCarPage({ params, searchParams }: PageProps<"/admin/araclar/[id]">) {
  return (
    <Suspense fallback={<BlockSkeleton className="h-[40rem]" />}>
      <EditCar params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditCar({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/araclar/[id]">["params"];
  searchParams: PageProps<"/admin/araclar/[id]">["searchParams"];
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  await requireRole("ADMIN");
  const [car, images, rentals, cars] = await Promise.all([
    attempt(serverApi.cars.get(id)),
    attempt(serverApi.images.list(id)),
    attempt(serverApi.rentals.byCar(id)),
    attempt(serverApi.cars.list()),
  ]);
  if (!car.ok) {
    if (isApiError(car.error) && [400, 404].includes(car.error.status)) notFound();
    return <Notice tone="err" title="Araç yüklenemedi.">{errorMessage(car.error, "load")}</Notice>;
  }
  const c = car.data;

  return (
    <div className="space-y-10">
      <SectionHead
        code="DEFTER 01 · ARAÇ KAYDI"
        title={`${c.brand} ${c.model}`}
        aside={
          <div className="flex items-center gap-4">
            <Plate plate={c.plate} />
            <Stamp label={CAR_STATUS_LABELS[c.status]} tone={CAR_STATUS_TONES[c.status]} size="sm" />
            <Link href="/admin" className={buttonClass("quiet", "sm")}>
              ← Araçlar
            </Link>
          </div>
        }
      />
      {query.yeni ? <Notice tone="ok" title="Araç eklendi.">Şimdi görsellerini yükleyebilirsin.</Notice> : null}

      <section aria-labelledby="bilgiler">
        <h2 id="bilgiler" className="doc-label mb-3 text-navy!">
          Bilgiler
        </h2>
        <CarForm car={c} />
        <p className="mt-3 text-xs text-muted">Durum (müsait / bakımda) araç defterindeki düğmelerle değişir; kirada durumunu teslim ve iade işlemleri belirler.</p>
      </section>

      <section aria-labelledby="gorseller">
        <h2 id="gorseller" className="doc-label mb-3 text-navy!">
          Görseller
        </h2>
        {images.ok ? <ImageManager carId={c.id} initial={images.data} /> : <Notice tone="err" title="Görseller yüklenemedi.">{errorMessage(images.error, "load")}</Notice>}
      </section>

      <section aria-labelledby="gecmis">
        <h2 id="gecmis" className="doc-label mb-3 text-navy!">
          Bu aracın kiralamaları
        </h2>
        {rentals.ok ? (
          rentals.data.length ? (
            <RentalTable rentals={rentals.data} cars={cars.ok ? cars.data : []} />
          ) : (
            <p className="text-sm text-muted">Bu araç henüz kiralanmamış.</p>
          )
        ) : (
          <Notice tone="err" title="Kiralamalar yüklenemedi.">{errorMessage(rentals.error, "load")}</Notice>
        )}
      </section>
    </div>
  );
}
