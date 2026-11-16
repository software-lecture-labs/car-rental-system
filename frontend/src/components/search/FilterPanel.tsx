"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { FUEL_TYPES, TRANSMISSION_TYPES, type FuelType, type TransmissionType } from "@/lib/api/types";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { searchToQuery, type SortKey } from "@/lib/search";

export interface FilterState {
  date: string;
  time: string;
  days: number;
  hasDates: boolean;
  sort: SortKey;
  fuels: FuelType[];
  transmission: TransmissionType | null;
  minSeats: number | null;
}

const SEAT_OPTIONS = [null, 4, 5, 7] as const;

/** Sıralama ve yakıt / vites / koltuk filtreleri. Değişiklik anında URL'ye yazılır. */
export function FilterPanel({ state }: { state: FilterState }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function apply(patch: Partial<FilterState>) {
    const next = { ...state, ...patch };
    startTransition(() => {
      router.replace(
        `${pathname}${searchToQuery({
          withDates: next.hasDates,
          date: next.date,
          time: next.time,
          days: next.days,
          sort: next.sort,
          fuels: next.fuels,
          transmission: next.transmission,
          minSeats: next.minSeats,
        })}`,
        { scroll: false },
      );
    });
  }

  const legend = "doc-label mb-2 block text-navy!";
  const option = "flex items-center gap-2.5 py-1 text-sm text-ink cursor-pointer";
  const box = "h-4 w-4 accent-navy";

  return (
    <div aria-busy={pending} className={`space-y-6 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <fieldset>
        <legend className={legend}>Sıralama</legend>
        {(
          [
            ["fiyat-artan", "Fiyat: düşükten yükseğe"],
            ["fiyat-azalan", "Fiyat: yüksekten düşüğe"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className={option}>
            <input type="radio" name="sirala" className={box} checked={state.sort === value} onChange={() => apply({ sort: value })} />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="border-t border-rule pt-4">
      <fieldset>
        <legend className={legend}>Yakıt</legend>
        {FUEL_TYPES.map((fuel) => (
          <label key={fuel} className={option}>
            <input
              type="checkbox"
              className={box}
              checked={state.fuels.includes(fuel)}
              onChange={(e) =>
                apply({ fuels: e.target.checked ? [...state.fuels, fuel] : state.fuels.filter((f) => f !== fuel) })
              }
            />
            {FUEL_LABELS[fuel]}
          </label>
        ))}
      </fieldset>
      </div>

      <div className="border-t border-rule pt-4">
      <fieldset>
        <legend className={legend}>Vites</legend>
        {([null, ...TRANSMISSION_TYPES] as const).map((value) => (
          <label key={value ?? "hepsi"} className={option}>
            <input type="radio" name="vites" className={box} checked={state.transmission === value} onChange={() => apply({ transmission: value })} />
            {value ? TRANSMISSION_LABELS[value] : "Hepsi"}
          </label>
        ))}
      </fieldset>
      </div>

      <div className="border-t border-rule pt-4">
      <fieldset>
        <legend className={legend}>Koltuk</legend>
        {SEAT_OPTIONS.map((value) => (
          <label key={value ?? "hepsi"} className={option}>
            <input type="radio" name="koltuk" className={box} checked={state.minSeats === value} onChange={() => apply({ minSeats: value })} />
            {value ? <span><span className="figures">{value}</span> ve üzeri</span> : "Hepsi"}
          </label>
        ))}
      </fieldset>
      </div>
    </div>
  );
}
