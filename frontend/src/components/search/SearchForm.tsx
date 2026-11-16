"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { combineDateTime, compareParts, istanbulNow, parseLocalDateTime } from "@/lib/datetime";
import { MAX_RENTAL_DAYS, searchToQuery, type SortKey } from "@/lib/search";
import type { FuelType, TransmissionType } from "@/lib/api/types";
import { Field, TextInput } from "@/components/ui/Field";
import { buttonClass } from "@/components/ui/button";

export interface SearchDefaults {
  date: string;
  time: string;
  days: number;
  minDate: string;
}

export interface KeptFilters {
  sort?: SortKey;
  fuels?: FuelType[];
  transmission?: TransmissionType | null;
  minSeats?: number | null;
}

type Errors = { date?: string; days?: string };

/** Tarih + saat + gün sayısı. Belge alanı gibi numaralı kutular; turuncu "Araç ara" rezervasyona götüren eylem. */
export function SearchForm({
  defaults,
  keep,
  variant = "full",
}: {
  defaults: SearchDefaults;
  keep?: KeptFilters;
  variant?: "full" | "compact";
}) {
  const router = useRouter();
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [days, setDays] = useState(String(defaults.days));
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors = {};
    const start = combineDateTime(date, time);
    if (!start) found.date = "Geçerli bir tarih ve saat seç.";
    else if (compareParts(parseLocalDateTime(start)!, istanbulNow()) < 0) found.date = "Başlangıç geçmişte olamaz.";
    const dayCount = Number(days);
    if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > MAX_RENTAL_DAYS) {
      found.days = `1 ile ${MAX_RENTAL_DAYS} arasında bir gün sayısı yaz.`;
    }
    setErrors(found);
    if (found.date || found.days) return;

    startTransition(() => {
      router.push(`/araclar${searchToQuery({ withDates: true, date, time, days: dayCount, ...keep })}`);
    });
  }

  const compact = variant === "compact";

  return (
    <form noValidate onSubmit={onSubmit} aria-label="Müsait araç arama">
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-[1.4fr_1fr_1fr_auto]" : "sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto]"} items-start`}>
        <Field id="ara-tarih" label="Teslim tarihi" code="01" error={errors.date}>
          <TextInput
            id="ara-tarih"
            type="date"
            min={defaults.minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
            className="figures"
          />
        </Field>
        <Field id="ara-saat" label="Teslim saati" code="02">
          <TextInput id="ara-saat" type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} className="figures" />
        </Field>
        <Field id="ara-gun" label="Gün sayısı" code="03" error={errors.days}>
          <TextInput
            id="ara-gun"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_RENTAL_DAYS}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            error={errors.days}
            className="figures"
          />
        </Field>
        <div className="sm:col-span-2 lg:col-span-1">
          <span aria-hidden className="doc-label mb-1.5 hidden lg:block">
            &nbsp;
          </span>
          <button type="submit" className={buttonClass("reserve", "lg", "w-full lg:w-auto h-11!")} disabled={pending}>
            {pending ? "Aranıyor…" : "Araç ara"}
          </button>
        </div>
      </div>
    </form>
  );
}
