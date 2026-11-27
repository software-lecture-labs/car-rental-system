import {
  combineDateTime,
  compareParts,
  defaultPickup,
  istanbulNow,
  parseLocalDateTime,
  toDateInput,
  toTimeInput,
  type LocalDateTime,
} from "@/lib/datetime";
import type { AvailabilitySort, CarResponse, FuelType, TransmissionType } from "@/lib/api/types";
import { FUEL_TYPES, TRANSMISSION_TYPES } from "@/lib/api/types";

/**
 * Arama ve filtre durumu URL'de Türkçe parametrelerle tutulur:
 * ?baslangic=2026-11-20&saat=10:00&gun=3&sirala=fiyat-artan&yakit=DIESEL,HYBRID&vites=AUTOMATIC&koltuk=5
 */

export const MAX_RENTAL_DAYS = 365;

export type SortKey = "fiyat-artan" | "fiyat-azalan";
const SORTS: Record<SortKey, AvailabilitySort> = { "fiyat-artan": "price,asc", "fiyat-azalan": "price,desc" };

export interface SearchState {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  days: number;
  /** Tarih verilmiş ve geçerliyse backend'e gidecek başlangıç */
  start: LocalDateTime | null;
  hasDates: boolean;
  sort: SortKey;
  fuels: FuelType[];
  transmission: TransmissionType | null;
  minSeats: number | null;
  /** URL'deki tarih hatalıysa ya da geçmişteyse sebebi */
  problem: "invalid" | "past" | null;
}

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseSearch(params: RawParams, now: Date = new Date()): SearchState {
  const fallback = defaultPickup(now);
  const rawDate = first(params.baslangic);
  const rawTime = first(params.saat) || "10:00";
  const rawDays = Number(first(params.gun));
  const days = Number.isInteger(rawDays) && rawDays >= 1 && rawDays <= MAX_RENTAL_DAYS ? rawDays : 3;

  let start: LocalDateTime | null = null;
  let problem: SearchState["problem"] = null;
  if (rawDate) {
    start = combineDateTime(rawDate, rawTime);
    if (!start) problem = "invalid";
    else if (compareParts(parseLocalDateTime(start)!, istanbulNow(now)) < 0) {
      problem = "past";
      start = null;
    }
  }

  const sortRaw = first(params.sirala);
  const sort: SortKey = sortRaw === "fiyat-azalan" ? "fiyat-azalan" : "fiyat-artan";
  const fuels = first(params.yakit)
    .split(",")
    .filter((f): f is FuelType => (FUEL_TYPES as readonly string[]).includes(f));
  const vites = first(params.vites);
  const transmission = (TRANSMISSION_TYPES as readonly string[]).includes(vites) ? (vites as TransmissionType) : null;
  const seats = Number(first(params.koltuk));

  return {
    date: start ? rawDate : toDateInput(fallback),
    time: start ? rawTime : toTimeInput(fallback),
    days,
    start,
    hasDates: start !== null,
    sort,
    fuels,
    transmission,
    minSeats: Number.isInteger(seats) && seats > 0 ? seats : null,
    problem,
  };
}

export function backendSort(sort: SortKey): AvailabilitySort {
  return SORTS[sort];
}

/** Durumu URL sorgusuna çevirir; varsayılan değerler yazılmaz. */
export function searchToQuery(state: {
  date?: string;
  time?: string;
  days?: number;
  withDates: boolean;
  sort?: SortKey;
  fuels?: FuelType[];
  transmission?: TransmissionType | null;
  minSeats?: number | null;
}): string {
  const q = new URLSearchParams();
  if (state.withDates && state.date) {
    q.set("baslangic", state.date);
    if (state.time) q.set("saat", state.time);
    if (state.days) q.set("gun", String(state.days));
  }
  if (state.sort && state.sort !== "fiyat-artan") q.set("sirala", state.sort);
  if (state.fuels?.length) q.set("yakit", state.fuels.join(","));
  if (state.transmission) q.set("vites", state.transmission);
  if (state.minSeats) q.set("koltuk", String(state.minSeats));
  const text = q.toString();
  return text ? `?${text}` : "";
}

/** Backend'in /available ucunda yakıt / vites / koltuk filtresi yok; burada süzüyoruz. */
export function matchesFilters(car: CarResponse, state: Pick<SearchState, "fuels" | "transmission" | "minSeats">): boolean {
  if (state.fuels.length && !state.fuels.includes(car.fuelType)) return false;
  if (state.transmission && car.transmission !== state.transmission) return false;
  if (state.minSeats && car.seatCount < state.minSeats) return false;
  return true;
}
