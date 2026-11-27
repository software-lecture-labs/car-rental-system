import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CarRow } from "@/components/car/CarRow";
import { Container } from "@/components/layout/Shell";
import { TariffTable } from "@/components/rental/TariffTable";
import { SearchForm } from "@/components/search/SearchForm";
import { BlockSkeleton, ListSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";
import { serverApi } from "@/lib/api/server";
import { attempt } from "@/lib/attempt";
import { defaultPickup, istanbulNow, toDateInput, toTimeInput } from "@/lib/datetime";
import { errorMessage } from "@/lib/messages";

/** Ana sayfa doğrudan işe girer: üstte talep formu, hemen altında API'den gelen gerçek araçlar. */
export default function Home() {
  return (
    <Container>
      <section aria-labelledby="talep-baslik" className="mt-8 border border-navy">
        <div className="flex items-center justify-between gap-4 bg-navy px-4 py-2 text-white">
          <span className="display-wide text-xs font-bold tracking-[0.18em]">KİRALAMA TALEP FORMU</span>
          <span className="figures text-xs opacity-80">RC-01</span>
        </div>
        <div className="grid lg:grid-cols-12">
          <div className="border-b border-rule p-5 sm:p-6 lg:col-span-8 lg:border-r lg:border-b-0">
            <h1 id="talep-baslik" className="text-[1.75rem] sm:text-[2.1rem]">
              Ne zaman, kaç gün?
            </h1>
            <p className="mt-2 mb-6 max-w-[56ch] text-sm text-muted">
              Teslim tarihini ve gün sayısını yaz; o aralıkta boş olan araçları toplam fiyatıyla listeleyelim.
            </p>
            <Suspense fallback={<BlockSkeleton className="h-[4.5rem]" />}>
              <HomeSearch />
            </Suspense>
          </div>
          <div id="tarife" className="scroll-mt-6 bg-card p-5 sm:p-6 lg:col-span-4">
            <h2 className="doc-label text-navy!">Tarife</h2>
            <div className="mt-3">
              <Suspense fallback={<BlockSkeleton className="h-28" />}>
                <HomeTariff />
              </Suspense>
            </div>
            <p className="mt-3 text-xs text-muted">Kademe gün sayısına göre kendiliğinden uygulanır; paket seçmezsin.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="filo-baslik" className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy pb-3">
          <div>
            <p className="doc-label figures">BÖLÜM 2</p>
            <h2 id="filo-baslik" className="mt-1 text-2xl">
              Filo
            </h2>
          </div>
          <Link href="/araclar" className={buttonClass("quiet", "sm")}>
            Filtreleyerek listele →
          </Link>
        </div>
        <Suspense fallback={<ListSkeleton rows={3} label="Araçlar yükleniyor" />}>
          <Fleet />
        </Suspense>
      </section>
    </Container>
  );
}

async function HomeSearch() {
  // Varsayılan tarih isteğe göre (yarın 10:00, İstanbul) hesaplanır; prerender'a girmez.
  await connection();
  const pickup = defaultPickup();
  return (
    <SearchForm
      defaults={{ date: toDateInput(pickup), time: toTimeInput(pickup), days: 3, minDate: toDateInput(istanbulNow()) }}
    />
  );
}

async function HomeTariff() {
  const result = await attempt(serverApi.pricing.policies());
  if (!result.ok) return <p className="text-sm text-muted">{errorMessage(result.error, "load")}</p>;
  return <TariffTable policies={result.data} />;
}

async function Fleet() {
  const [cars, policies] = await Promise.all([attempt(serverApi.cars.list()), attempt(serverApi.pricing.policies())]);
  if (!cars.ok) {
    return (
      <Notice tone="err" title="Araçlar yüklenemedi." className="mt-6">
        {errorMessage(cars.error, "load")}
      </Notice>
    );
  }
  if (cars.data.length === 0) {
    return <p className="py-10 text-muted">Henüz sisteme araç eklenmemiş.</p>;
  }
  const order = { AVAILABLE: 0, RENTED: 1, MAINTENANCE: 2 } as const;
  const sorted = [...cars.data].sort((a, b) => order[a.status] - order[b.status] || a.dailyBasePrice - b.dailyBasePrice);
  return (
    <div>
      <p className="figures pt-3 text-xs text-muted">{sorted.length} ARAÇ · GÜNLÜK FİYATLAR</p>
      {sorted.map((car) => (
        <CarRow key={car.id} car={car} policies={policies.ok ? policies.data : []} href={`/araclar/${car.id}`} />
      ))}
    </div>
  );
}
