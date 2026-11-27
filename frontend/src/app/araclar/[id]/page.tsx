import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Gallery } from "@/components/car/Gallery";
import { DocFields } from "@/components/doc/DocFields";
import { Plate } from "@/components/doc/Plate";
import { Stamp } from "@/components/doc/Stamp";
import { Container } from "@/components/layout/Shell";
import { BookingPanel, type Viewer } from "@/components/rental/BookingPanel";
import { RentalTerms } from "@/components/rental/RentalTerms";
import { TariffTable } from "@/components/rental/TariffTable";
import { BlockSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { serverApi } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import type { CarResponse, PricingPolicyResponse } from "@/lib/api/types";
import { attempt } from "@/lib/attempt";
import { istanbulNow, toDateInput } from "@/lib/datetime";
import { formatPlate, formatTL } from "@/lib/format";
import { CAR_STATUS_LABELS, CAR_STATUS_TONES, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { errorMessage } from "@/lib/messages";
import { parseSearch, type SearchState } from "@/lib/search";
import { getSessionUser } from "@/lib/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/araclar/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return { title: "Araç bulunamadı" };
  const car = await attempt(serverApi.cars.get(id));
  return { title: car.ok ? `${car.data.brand} ${car.data.model} · ${formatPlate(car.data.plate)}` : "Araç" };
}

export default function CarDetailPage({ params, searchParams }: PageProps<"/araclar/[id]">) {
  return (
    <Container>
      <Suspense fallback={<DetailSkeleton />}>
        <CarDetail params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function CarDetail({
  params,
  searchParams,
}: {
  params: PageProps<"/araclar/[id]">["params"];
  searchParams: PageProps<"/araclar/[id]">["searchParams"];
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const raw = await searchParams;
  // Müsaitlik "şu an"a göre hesaplanır: istek anında render et
  await connection();
  const state = parseSearch(raw);

  const [car, images, policies] = await Promise.all([
    attempt(serverApi.cars.get(id)),
    attempt(serverApi.images.list(id)),
    attempt(serverApi.pricing.policies()),
  ]);

  if (!car.ok) {
    if (isApiError(car.error) && (car.error.status === 404 || car.error.status === 400)) notFound();
    return (
      <Notice tone="err" title="Araç yüklenemedi." className="mt-8">
        {errorMessage(car.error, "load")}
      </Notice>
    );
  }

  const c = car.data;
  const title = `${c.brand} ${c.model}`;
  const policyList = policies.ok ? policies.data : [];

  return (
    <>
      <nav aria-label="Konum" className="figures pt-6 text-xs text-muted">
        <Link href="/araclar" className="underline-offset-4 hover:text-navy hover:underline">
          ARAÇLAR
        </Link>
        <span aria-hidden> / </span>
        <span aria-current="page">{formatPlate(c.plate)}</span>
      </nav>

      <header className="grid gap-4 border-b border-rule pt-4 pb-6 md:grid-cols-12 md:items-end">
        <div className="md:col-span-9">
          <Plate plate={c.plate} size="lg" />
          <h1 className="mt-4 text-[2.1rem] sm:text-[2.6rem]">{title}</h1>
          <p className="mt-1 text-muted">
            <span className="figures">{c.productionYear}</span> model · {c.color} · {FUEL_LABELS[c.fuelType]} ·{" "}
            {TRANSMISSION_LABELS[c.transmission]}
          </p>
        </div>
        <div className="md:col-span-3 md:justify-self-end">
          <Stamp label={CAR_STATUS_LABELS[c.status]} tone={CAR_STATUS_TONES[c.status]} />
        </div>
      </header>

      {/* DOM sırası galeri → rezervasyon → bilgiler: telefonda rezervasyon galerinin hemen altında */}
      <div className="grid gap-x-12 gap-y-10 pt-8 lg:grid-cols-12">
        <div className="lg:col-span-7 lg:row-start-1">
          {images.ok ? (
            <Gallery images={images.data} title={title} />
          ) : (
            <Notice tone="warn" title="Görseller yüklenemedi.">
              {errorMessage(images.error, "load")}
            </Notice>
          )}
        </div>

        <aside aria-label="Rezervasyon" className="lg:sticky lg:top-6 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-start">
          <Suspense fallback={<BlockSkeleton className="h-[34rem]" />}>
            <Booking car={c} policies={policyList} state={state} />
          </Suspense>
        </aside>

        <div className="space-y-10 lg:col-span-7 lg:row-start-2">
          <section aria-labelledby="ruhsat">
            <h2 id="ruhsat" className="doc-label mb-3 text-navy!">
              Araç bilgileri · ruhsat
            </h2>
            <DocFields fields={specFields(c)} />
          </section>

          <section aria-labelledby="tarife" className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 id="tarife" className="doc-label mb-3 text-navy!">
                Tarife
              </h2>
              {policies.ok ? <TariffTable policies={policyList} days={state.days} /> : <p className="text-sm text-muted">{errorMessage(policies.error, "load")}</p>}
            </div>
            <div>
              <h2 className="doc-label mb-3 text-navy!">Koşullar</h2>
              <RentalTerms compact />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function specFields(c: CarResponse) {
  return [
    { code: "A", label: "Plaka", value: formatPlate(c.plate), mono: true },
    { code: "D.1", label: "Markası", value: c.brand },
    { code: "D.3", label: "Ticari adı", value: c.model },
    { code: "D.4", label: "Model yılı", value: String(c.productionYear), mono: true },
    { code: "P.3", label: "Yakıt cinsi", value: FUEL_LABELS[c.fuelType] },
    { label: "Vites", value: TRANSMISSION_LABELS[c.transmission] },
    { code: "R", label: "Rengi", value: c.color },
    { code: "S.1", label: "Koltuk sayısı", value: String(c.seatCount), mono: true },
    { label: "Günlük fiyat", value: formatTL(c.dailyBasePrice), mono: true },
  ];
}

/** Oturuma bağlı kısım: kimin baktığına göre rezervasyon paneli değişir. */
async function Booking({ car, policies, state }: { car: CarResponse; policies: PricingPolicyResponse[]; state: SearchState }) {
  const user = await getSessionUser();
  let viewer: Viewer = { kind: "guest" };
  if (user?.role === "ADMIN") viewer = { kind: "admin" };
  else if (user) {
    const customer = await attempt(serverApi.customers.get(user.id));
    viewer = customer.ok ? { kind: "customer", id: user.id, balance: customer.data.balance } : { kind: "guest" };
  }

  return (
    <BookingPanel
      car={car}
      policies={policies}
      viewer={viewer}
      initial={{ date: state.date, time: state.time, days: state.days, minDate: toDateInput(istanbulNow()) }}
    />
  );
}

function DetailSkeleton() {
  return (
    <div className="pt-8" role="status">
      <span className="sr-only">Araç yükleniyor…</span>
      <BlockSkeleton className="h-14 w-72" />
      <div className="mt-8 grid gap-12 lg:grid-cols-12">
        <BlockSkeleton className="aspect-[4/3] lg:col-span-7" />
        <BlockSkeleton className="h-96 lg:col-span-5" />
      </div>
    </div>
  );
}
