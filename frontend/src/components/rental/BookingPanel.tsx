"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Receipt, ReceiptLine, ReceiptTotal } from "@/components/doc/Receipt";
import { Stamp } from "@/components/doc/Stamp";
import { Field, TextInput } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";
import { clientApi } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { AvailableCarResponse, CarResponse, PricingPolicyResponse, RentalResponse } from "@/lib/api/types";
import {
  addDays,
  combineDateTime,
  compareParts,
  formatDateTimeLong,
  formatDateTimeNumeric,
  istanbulNow,
  parseLocalDateTime,
  toDateInput,
  toLocalDateTime,
  toTimeInput,
  type LocalDateTime,
} from "@/lib/datetime";
import { formatPercent, formatTL } from "@/lib/format";
import { conflictKind, errorMessage } from "@/lib/messages";
import { DEPOSIT_RATE_PERCENT, contractDays, nextTier, quotePrice } from "@/lib/pricing";
import { MAX_RENTAL_DAYS, searchToQuery } from "@/lib/search";

export type Viewer = { kind: "guest" } | { kind: "admin" } | { kind: "customer"; id: string; balance: number };

type Availability =
  | { key: string; status: "available"; offer: AvailableCarResponse }
  | { key: string; status: "booked" }
  | { key: string; status: "error" };

type Phase = "edit" | "confirm" | "submitting";

type Problem =
  | { kind: "balance" }
  | { kind: "booked" }
  | { kind: "maintenance" }
  | { kind: "past" }
  | { kind: "other"; message: string };

/**
 * Detay sayfasının sağ sütunu: tarih / gün seçimi, canlı fiyat fişi, müsaitlik ve rezervasyon.
 * Fiş önce istemcide hesaplanan önizlemeyi gösterir; sunucu aynı tarih için fiyat döndürünce onu gösterir.
 * Rezervasyondan sonra gösterilen tutar her zaman sunucunun döndürdüğü totalAmount'tur.
 */
export function BookingPanel({
  car,
  policies,
  viewer,
  initial,
}: {
  car: CarResponse;
  policies: PricingPolicyResponse[];
  viewer: Viewer;
  initial: { date: string; time: string; days: number; minDate: string };
}) {
  const router = useRouter();
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [daysText, setDaysText] = useState(String(initial.days));
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [phase, setPhase] = useState<Phase>("edit");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [suggestions, setSuggestions] = useState<{ key: string; starts: LocalDateTime[] } | null>(null);
  const [booked, setBooked] = useState<RentalResponse | null>(null);

  const days = Number(daysText);
  const daysValid = Number.isInteger(days) && days >= 1 && days <= MAX_RENTAL_DAYS;
  const start = combineDateTime(date, time);
  const startParts = start ? parseLocalDateTime(start) : null;
  const key = start && daysValid ? `${start}|${days}` : "";

  const inMaintenance = car.status === "MAINTENANCE";
  const preview = useMemo(() => quotePrice(car.dailyBasePrice, daysValid ? days : 1, policies), [car.dailyBasePrice, days, daysValid, policies]);
  const upcomingTier = daysValid ? nextTier(policies, days) : null;
  const serverOffer = availability?.key === key && availability.status === "available" ? availability.offer : null;
  const checking = Boolean(key) && !inMaintenance && availability?.key !== key;
  const isBooked = availability?.key === key && availability.status === "booked";

  // Gösterilen tutarlar: sunucu teklif verdiyse onunki, yoksa önizleme
  const total = serverOffer?.totalAmount ?? preview.totalAmount;
  const deposit = serverOffer?.depositAmount ?? preview.depositAmount;
  const dueAtPickup = serverOffer?.amountDueAtPickup ?? preview.amountDueAtPickup;
  const discountRate = serverOffer?.discountRate ?? preview.discountRate;
  const discountAmount = Math.round((preview.baseAmount - total) * 100) / 100;

  const balanceShort = viewer.kind === "customer" && viewer.balance < deposit;
  const returnPath = `/araclar/${car.id}${searchToQuery({ withDates: true, date, time, days: daysValid ? days : initial.days })}`;

  // Seçilen tarihte araç boş mu? GET /api/cars/available ile, yazmayı bitirince (350 ms) sor.
  useEffect(() => {
    if (!key || inMaintenance) return;
    const [checkStart, checkDays] = key.split("|");
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const offers = await clientApi.cars.available({ start: checkStart, days: Number(checkDays) });
        if (cancelled) return;
        const offer = offers.find((o) => o.car.id === car.id);
        setAvailability(offer ? { key, status: "available", offer } : { key, status: "booked" });
      } catch {
        if (!cancelled) setAvailability({ key, status: "error" });
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, car.id, inMaintenance]);

  // Dolu çıkarsa: aynı saat ve gün sayısıyla sonraki 14 gün içinde boş olduğu ilk 3 başlangıcı bul.
  useEffect(() => {
    if (!isBooked || suggestions?.key === key) return;
    const [baseStart, baseDays] = key.split("|");
    const base = parseLocalDateTime(baseStart);
    if (!base) return;
    let cancelled = false;
    (async () => {
      const candidates = Array.from({ length: 14 }, (_, i) => toLocalDateTime(addDays(base, i + 1)));
      const found: LocalDateTime[] = [];
      for (let i = 0; i < candidates.length && found.length < 3; i += 7) {
        const batch = candidates.slice(i, i + 7);
        const results = await Promise.all(
          batch.map((s) =>
            clientApi.cars
              .available({ start: s, days: Number(baseDays) })
              .then((offers) => offers.some((o) => o.car.id === car.id))
              .catch(() => false),
          ),
        );
        batch.forEach((s, j) => results[j] && found.length < 3 && found.push(s));
      }
      if (!cancelled) setSuggestions({ key, starts: found });
    })();
    return () => {
      cancelled = true;
    };
  }, [isBooked, key, car.id, suggestions?.key]);

  function edit<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPhase("edit");
      setProblem(null);
    };
  }

  function inputError(): string | null {
    if (!startParts) return "Geçerli bir tarih ve saat seç.";
    if (compareParts(startParts, istanbulNow()) < 0) return "Başlangıç geçmişte olamaz.";
    if (!daysValid) return `Gün sayısı 1 ile ${MAX_RENTAL_DAYS} arasında olmalı.`;
    return null;
  }

  function onReserve() {
    const err = inputError();
    if (err) {
      setProblem(err.includes("geçmiş") ? { kind: "past" } : { kind: "other", message: err });
      return;
    }
    if (viewer.kind === "guest") {
      router.push(`/giris?next=${encodeURIComponent(returnPath)}`);
      return;
    }
    if (viewer.kind !== "customer") return;
    if (balanceShort) {
      setProblem({ kind: "balance" });
      return;
    }
    setPhase("confirm");
  }

  async function onConfirm() {
    if (viewer.kind !== "customer" || !start) return;
    setPhase("submitting");
    setProblem(null);
    try {
      const rental = await clientApi.rentals.create({ customerId: viewer.id, carId: car.id, startDate: start, rentalDays: days });
      setBooked(rental);
      router.refresh(); // bakiye ve diğer sunucu verileri tazelensin
    } catch (error) {
      setPhase("edit");
      const kind = conflictKind(error);
      if (kind === "insufficient-balance") setProblem({ kind: "balance" });
      else if (kind === "car-booked") {
        setAvailability({ key, status: "booked" });
        setProblem({ kind: "booked" });
      } else if (kind === "car-maintenance") setProblem({ kind: "maintenance" });
      else if (isApiError(error) && error.status === 400) setProblem({ kind: "past" });
      else setProblem({ kind: "other", message: errorMessage(error, "reservation") });
    }
  }

  function applySuggestion(s: LocalDateTime) {
    const p = parseLocalDateTime(s)!;
    edit(setDate)(toDateInput(p));
    setTime(toTimeInput(p));
  }

  if (booked) return <BookedReceipt rental={booked} />;

  const missing = viewer.kind === "customer" ? Math.max(0, Math.ceil((deposit - viewer.balance) * 100) / 100) : 0;
  const balanceHref = `/hesabim/bakiye?${new URLSearchParams({ gerekli: missing.toFixed(2), next: returnPath }).toString()}`;
  const endParts = startParts && daysValid ? addDays(startParts, days) : null;

  return (
    <div className="space-y-4">
      <fieldset className="border border-rule p-4" disabled={phase === "submitting"}>
        <legend className="doc-label px-1 text-navy!">Kiralama bilgisi</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.4fr_1fr_0.8fr]">
          <Field id="r-tarih" label="Teslim tarihi" className="col-span-2 sm:col-span-1">
            <TextInput id="r-tarih" type="date" min={initial.minDate} value={date} onChange={(e) => edit(setDate)(e.target.value)} className="figures" />
          </Field>
          <Field id="r-saat" label="Saat">
            <TextInput id="r-saat" type="time" step={900} value={time} onChange={(e) => edit(setTime)(e.target.value)} className="figures" />
          </Field>
          <Field id="r-gun" label="Gün" error={daysText !== "" && !daysValid ? `1–${MAX_RENTAL_DAYS}` : undefined}>
            <TextInput
              id="r-gun"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_RENTAL_DAYS}
              value={daysText}
              onChange={(e) => edit(setDaysText)(e.target.value)}
              className="figures"
              error={daysText !== "" && !daysValid ? `1–${MAX_RENTAL_DAYS}` : undefined}
            />
          </Field>
        </div>
        <p className="figures mt-3 text-xs text-muted" aria-live="polite">
          {inMaintenance
            ? "DURUM: BAKIMDA — REZERVASYONA KAPALI"
            : !key
              ? "TARİH VE GÜN SAYISINI GİR"
              : checking
                ? "MÜSAİTLİK KONTROL EDİLİYOR…"
                : isBooked
                  ? "DURUM: BU TARİHLERDE DOLU"
                  : availability?.status === "error"
                    ? "MÜSAİTLİK KONTROL EDİLEMEDİ"
                    : "DURUM: BU TARİHLERDE MÜSAİT"}
        </p>
      </fieldset>

      <Receipt
        title="Kiralama özeti"
        serial={serverOffer ? "SUNUCU HESABI" : "ÖN İZLEME"}
        footer={
          serverOffer
            ? "Tutar sunucunun bu tarih için hesapladığı değerdir."
            : "Ön izleme. Kesin tutarı sunucu rezervasyon anında hesaplar."
        }
      >
        <ReceiptLine label="Teslim" value={startParts ? formatDateTimeNumeric(startParts) : "—"} tone="muted" />
        <ReceiptLine label="İade" value={endParts ? formatDateTimeNumeric(endParts) : "—"} tone="muted" />
        <div className="my-2 border-t border-dashed border-rule" />
        <ReceiptLine
          label={
            <>
              Günlük <span className="figures">{formatTL(car.dailyBasePrice)}</span> × <span className="figures">{daysValid ? days : "—"}</span> gün
            </>
          }
          value={formatTL(preview.baseAmount)}
        />
        <ReceiptLine
          label={preview.tier ? `Kademe: ${preview.tier.policyName} (${formatPercent(discountRate)})` : "Kademe: yok"}
          value={discountAmount > 0 ? `−${formatTL(discountAmount)}` : formatTL(0)}
          tone={discountAmount > 0 ? "credit" : "default"}
          sub={
            upcomingTier
              ? `${upcomingTier.minDays - (daysValid ? days : 0)} gün daha eklersen ${upcomingTier.policyName} kademesi (${formatPercent(upcomingTier.discountRate)}) uygulanır.`
              : undefined
          }
        />
        <ReceiptTotal label="Toplam" value={formatTL(total)} />
        <div className="mt-3 space-y-0.5">
          <ReceiptLine label={`Şimdi ödenecek (ön ödeme %${DEPOSIT_RATE_PERCENT})`} value={formatTL(deposit)} />
          <ReceiptLine label="Teslimde ödenecek" value={formatTL(dueAtPickup)} tone="muted" />
          {viewer.kind === "customer" ? (
            <ReceiptLine label="Bakiyen" value={formatTL(viewer.balance)} tone={balanceShort ? "default" : "muted"} />
          ) : null}
        </div>
      </Receipt>

      <Messages
        viewer={viewer}
        inMaintenance={inMaintenance}
        isBooked={isBooked}
        problem={problem}
        balanceShort={balanceShort}
        balanceHref={balanceHref}
        missing={missing}
        suggestions={suggestions?.key === key ? suggestions.starts : null}
        onSuggestion={applySuggestion}
        alternativesHref={`/araclar${searchToQuery({ withDates: true, date, time, days: daysValid ? days : initial.days })}`}
      />

      {phase === "confirm" || phase === "submitting" ? (
        <div className="border-2 border-navy p-4">
          <p className="text-sm text-ink">
            Onaylarsan bakiyenden şimdi <strong className="figures text-navy">{formatTL(deposit)}</strong> düşülür. Kalan{" "}
            <strong className="figures text-navy">{formatTL(dueAtPickup)}</strong> araç teslim edilirken alınır.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className={buttonClass("reserve", "lg")} onClick={onConfirm} disabled={phase === "submitting"}>
              {phase === "submitting" ? "Kaydediliyor…" : "Onayla"}
            </button>
            <button type="button" className={buttonClass("outline", "lg")} onClick={() => setPhase("edit")} disabled={phase === "submitting"}>
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            className={buttonClass("reserve", "lg", "w-full")}
            onClick={onReserve}
            disabled={inMaintenance || viewer.kind === "admin" || isBooked || balanceShort}
          >
            Rezervasyon yap
          </button>
          {viewer.kind === "guest" && !inMaintenance ? (
            <p className="mt-2 text-xs text-muted">Rezervasyon için giriş yapman gerekiyor; girişten sonra bu sayfaya, aynı tarihlere döneceksin.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Messages({
  viewer,
  inMaintenance,
  isBooked,
  problem,
  balanceShort,
  balanceHref,
  missing,
  suggestions,
  onSuggestion,
  alternativesHref,
}: {
  viewer: Viewer;
  inMaintenance: boolean;
  isBooked: boolean;
  problem: Problem | null;
  balanceShort: boolean;
  balanceHref: string;
  missing: number;
  suggestions: LocalDateTime[] | null;
  onSuggestion: (s: LocalDateTime) => void;
  alternativesHref: string;
}) {
  if (inMaintenance || problem?.kind === "maintenance") {
    return (
      <Notice tone="warn" title="Araç bakımda.">
        Bakım bitene kadar rezervasyon alınmıyor. <Link href={alternativesHref}>Aynı tarihlerde boş olan araçlara bak</Link>.
      </Notice>
    );
  }
  if (viewer.kind === "admin") {
    return <Notice tone="info" title="Yönetici hesabıyla rezervasyon yapılamaz.">Rezervasyon müşteri hesabına bağlı; müşteri hesabıyla giriş yap.</Notice>;
  }
  if (isBooked || problem?.kind === "booked") {
    return (
      <Notice tone="warn" title="Araç bu tarihlerde dolu.">
        {suggestions === null ? (
          <p>Yakın tarihlerde boş gün aranıyor…</p>
        ) : suggestions.length > 0 ? (
          <>
            <p>Aynı saat ve gün sayısıyla şu başlangıçlarda boş:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" className={buttonClass("outline", "sm", "figures")} onClick={() => onSuggestion(s)}>
                    {formatDateTimeNumeric(s)}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Önümüzdeki iki haftada bu süreyle boş bir başlangıç bulunamadı.</p>
        )}
        <p className="mt-2">
          Ya da <Link href={alternativesHref}>aynı tarihlerde boş olan diğer araçlara</Link> bak.
        </p>
      </Notice>
    );
  }
  if (balanceShort || problem?.kind === "balance") {
    return (
      <Notice tone="warn" title="Bakiye yetersiz.">
        <p>
          Ön ödeme için <span className="figures">{formatTL(missing)}</span> daha gerekiyor. Yükledikten sonra bu sayfaya döneceksin.
        </p>
        <Link href={balanceHref} className={buttonClass("primary", "sm", "mt-3 no-underline! text-white!")}>
          Bakiye yükle
        </Link>
      </Notice>
    );
  }
  if (problem?.kind === "past") {
    return <Notice tone="err" title="Başlangıç zamanı geçmiş.">İleri bir tarih ya da saat seç.</Notice>;
  }
  if (problem?.kind === "other") return <Notice tone="err" title={problem.message} />;
  return null;
}

function BookedReceipt({ rental }: { rental: RentalResponse }) {
  const days = contractDays({
    dailyPrice: rental.dailyPrice,
    discountRate: rental.discountRate,
    totalAmount: rental.totalAmount,
    fallbackDays: 1,
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 border-b border-rule pb-3">
        <p className="text-lg font-semibold text-navy">Rezervasyonun alındı.</p>
        <Stamp label="Rezerve" tone="navy" note={formatDateTimeNumeric(rental.transactionDate)} />
      </div>
      <Receipt title="Kiralama sözleşmesi" serial={`NO ${rental.id.slice(0, 8).toUpperCase()}`}>
        <ReceiptLine label="Teslim" value={formatDateTimeLong(rental.rentalStart)} tone="muted" />
        <ReceiptLine label="İade" value={formatDateTimeLong(rental.rentalEnd)} tone="muted" />
        <div className="my-2 border-t border-dashed border-rule" />
        <ReceiptLine label={`Günlük ${formatTL(rental.dailyPrice)} × ${days} gün`} value={formatTL(rental.dailyPrice * days)} />
        <ReceiptLine label={`İndirim (${formatPercent(rental.discountRate)})`} value={formatTL(rental.dailyPrice * days - rental.totalAmount)} tone="credit" />
        <ReceiptTotal label="Toplam" value={formatTL(rental.totalAmount)} />
        <div className="mt-3">
          <ReceiptLine label="Ödenen ön ödeme" value={formatTL(rental.depositAmount)} />
          <ReceiptLine label="Teslimde ödenecek" value={formatTL(rental.totalAmount - rental.depositAmount)} tone="muted" />
        </div>
      </Receipt>
      <div className="flex flex-wrap gap-3">
        <Link href={`/hesabim/kiralamalar/${rental.id}`} className={buttonClass("primary")}>
          Kiralamayı görüntüle
        </Link>
        <Link href="/araclar" className={buttonClass("outline")}>
          Araçlara dön
        </Link>
      </div>
    </div>
  );
}
