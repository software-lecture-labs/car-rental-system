import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CarRow } from "@/components/car/CarRow";
import { Container, PageHead } from "@/components/layout/Shell";
import { FilterPanel } from "@/components/search/FilterPanel";
import { SearchForm } from "@/components/search/SearchForm";
import { BlockSkeleton, ListSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { serverApi } from "@/lib/api/server";
import type { AvailableCarResponse, CarResponse } from "@/lib/api/types";
import { attempt } from "@/lib/attempt";
import { addDays, formatDateTimeNumeric, istanbulNow, parseLocalDateTime, toDateInput } from "@/lib/datetime";
import { errorMessage } from "@/lib/messages";
import { backendSort, matchesFilters, parseSearch, searchToQuery, type SearchState } from "@/lib/search";

export const metadata: Metadata = { title: "Araçlar" };

export default function CarsPage({ searchParams }: PageProps<"/araclar">) {
  return (
    <Container>
      <PageHead
        form="FORM RC-02 · FİLO VE MÜSAİTLİK"
        title="Araçlar"
        lead="Tarih seçersen sadece o aralıkta boş olan araçlar, toplam fiyat ve uygulanan indirimle listelenir."
      />
      <Suspense
        fallback={
          <>
            <BlockSkeleton className="mt-6 h-20" />
            <ListSkeleton rows={3} label="Araçlar yükleniyor" />
          </>
        }
      >
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/araclar">["searchParams"] }) {
  const raw = await searchParams;
  // Müsaitlik "şu an"a göre hesaplanır: istek anında render et
  await connection();
  const state = parseSearch(raw);
  const policies = await attempt(serverApi.pricing.policies());
  const policyList = policies.ok ? policies.data : [];

  let rows: { car: CarResponse; offer?: AvailableCarResponse }[] = [];
  let loadError: unknown = null;
  if (state.start) {
    const result = await attempt(serverApi.cars.available({ start: state.start, days: state.days, sort: backendSort(state.sort) }));
    if (result.ok) rows = result.data.map((offer) => ({ car: offer.car, offer }));
    else loadError = result.error;
  } else {
    const result = await attempt(serverApi.cars.list());
    if (result.ok) {
      const dir = state.sort === "fiyat-azalan" ? -1 : 1;
      rows = [...result.data]
        .sort((a, b) => (a.dailyBasePrice - b.dailyBasePrice) * dir || a.brand.localeCompare(b.brand, "tr"))
        .map((car) => ({ car }));
    } else loadError = result.error;
  }

  const filtered = rows.filter((row) => matchesFilters(row.car, state));
  const detailQuery = state.hasDates ? searchToQuery({ withDates: true, date: state.date, time: state.time, days: state.days }) : "";
  const filtersActive = state.fuels.length > 0 || state.transmission !== null || state.minSeats !== null;

  return (
    <>
      <div className="border-b border-rule py-6">
        <SearchForm
          variant="compact"
          defaults={{ date: state.date, time: state.time, days: state.days, minDate: toDateInput(istanbulNow()) }}
          keep={{ sort: state.sort, fuels: state.fuels, transmission: state.transmission, minSeats: state.minSeats }}
        />
      </div>

      {state.problem ? (
        <Notice tone="warn" className="mt-6" title={state.problem === "past" ? "Seçilen başlangıç geçmişte kaldı." : "Tarih okunamadı."}>
          Bütün filo listeleniyor. Müsaitlik için ileri bir tarih seç.
        </Notice>
      ) : null}

      <div className="grid gap-x-10 gap-y-6 pt-6 lg:grid-cols-12">
        <aside aria-label="Filtreler" className="lg:col-span-3">
          <FilterPanel
            state={{
              date: state.date,
              time: state.time,
              days: state.days,
              hasDates: state.hasDates,
              sort: state.sort,
              fuels: state.fuels,
              transmission: state.transmission,
              minSeats: state.minSeats,
            }}
          />
        </aside>

        <section aria-labelledby="sonuc-baslik" aria-live="polite" className="lg:col-span-9">
          <h2 id="sonuc-baslik" className="sr-only">
            Sonuçlar
          </h2>
          <ResultSummary state={state} count={filtered.length} total={rows.length} />
          {loadError ? (
            <Notice tone="err" title="Araçlar yüklenemedi." className="mt-4">
              {errorMessage(loadError, "load")}
            </Notice>
          ) : filtered.length === 0 ? (
            <div className="border-b border-rule py-10">
              <p className="text-lg font-semibold text-navy">
                {state.hasDates ? "Bu tarihlerde uygun araç kalmamış." : "Bu filtrelere uyan araç yok."}
              </p>
              <p className="mt-2 text-sm text-muted">
                {filtersActive ? (
                  <>
                    Filtreleri gevşet ya da{" "}
                    <Link className="font-semibold text-navy underline" href={`/araclar${detailQuery}`}>
                      filtreleri temizle
                    </Link>
                    .{" "}
                  </>
                ) : null}
                {state.hasDates ? "Başlangıcı birkaç gün kaydırmayı ya da gün sayısını değiştirmeyi dene." : null}
              </p>
            </div>
          ) : (
            filtered.map(({ car, offer }) => (
              <CarRow key={car.id} car={car} offer={offer} policies={policyList} href={`/araclar/${car.id}${detailQuery}`} />
            ))
          )}
        </section>
      </div>
    </>
  );
}

function ResultSummary({ state, count, total }: { state: SearchState; count: number; total: number }) {
  const start = state.start ? parseLocalDateTime(state.start) : null;
  return (
    <div className="figures flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-navy pb-2 text-xs text-muted">
      {start ? (
        <>
          <span>
            TESLİM <span className="text-navy">{formatDateTimeNumeric(start)}</span>
          </span>
          <span>
            İADE <span className="text-navy">{formatDateTimeNumeric(addDays(start, state.days))}</span>
          </span>
          <span>
            SÜRE <span className="text-navy">{state.days} GÜN</span>
          </span>
          <span className="ml-auto">
            {count} ARAÇ MÜSAİT{count !== total ? ` · FİLTRESİZ ${total}` : ""}
          </span>
        </>
      ) : (
        <>
          <span>TARİH SEÇİLMEDİ · BÜTÜN FİLO</span>
          <span className="ml-auto">{count} ARAÇ</span>
        </>
      )}
    </div>
  );
}
