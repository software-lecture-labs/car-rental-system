import { describe, expect, it } from "vitest";
import type { CarResponse } from "@/lib/api/types";
import { matchesFilters, parseSearch, searchToQuery } from "./search";
import { parseMoney } from "./validation";

const NOW = new Date("2026-11-16T12:00:00Z"); // İstanbul 15:00

describe("parseSearch", () => {
  it("geçerli tarih, saat ve gün sayısını okur", () => {
    const s = parseSearch({ baslangic: "2026-11-20", saat: "09:30", gun: "7", sirala: "fiyat-azalan" }, NOW);
    expect(s.start).toBe("2026-11-20T09:30:00");
    expect(s.days).toBe(7);
    expect(s.sort).toBe("fiyat-azalan");
    expect(s.problem).toBeNull();
  });

  it("geçmiş tarihi kabul etmez, varsayılana döner", () => {
    const s = parseSearch({ baslangic: "2026-11-16", saat: "14:00" }, NOW);
    expect(s.start).toBeNull();
    expect(s.problem).toBe("past");
    expect(s.date).toBe("2026-11-17");
  });

  it("bozuk değerleri güvenli varsayılanlara çevirir", () => {
    const s = parseSearch({ baslangic: "yarın", gun: "-3", yakit: "GASOLINE,KEROSEN", vites: "x", koltuk: "abc" }, NOW);
    expect(s.problem).toBe("invalid");
    expect(s.days).toBe(3);
    expect(s.fuels).toEqual(["GASOLINE"]);
    expect(s.transmission).toBeNull();
    expect(s.minSeats).toBeNull();
  });

  it("sorguya geri yazar", () => {
    expect(
      searchToQuery({ withDates: true, date: "2026-11-20", time: "10:00", days: 3, fuels: ["DIESEL", "HYBRID"], minSeats: 5 }),
    ).toBe("?baslangic=2026-11-20&saat=10%3A00&gun=3&yakit=DIESEL%2CHYBRID&koltuk=5");
    expect(searchToQuery({ withDates: false, sort: "fiyat-artan" })).toBe("");
  });
});

describe("matchesFilters", () => {
  const car = { fuelType: "HYBRID", transmission: "AUTOMATIC", seatCount: 5 } as CarResponse;
  it("yakıt, vites ve koltuk filtrelerini uygular", () => {
    expect(matchesFilters(car, { fuels: [], transmission: null, minSeats: null })).toBe(true);
    expect(matchesFilters(car, { fuels: ["DIESEL"], transmission: null, minSeats: null })).toBe(false);
    expect(matchesFilters(car, { fuels: ["HYBRID"], transmission: "MANUAL", minSeats: null })).toBe(false);
    expect(matchesFilters(car, { fuels: [], transmission: null, minSeats: 7 })).toBe(false);
  });
});

describe("parseMoney", () => {
  it("Türkçe ve noktalı yazımları kuruş hassasiyetinde okur", () => {
    expect(parseMoney("1250")).toEqual({ value: 1250, text: "1250.00" });
    expect(parseMoney("1.250,5")).toEqual({ value: 1250.5, text: "1250.50" });
    expect(parseMoney("1250.75")).toEqual({ value: 1250.75, text: "1250.75" });
    expect(parseMoney("₺ 500")).toEqual({ value: 500, text: "500.00" });
    expect(parseMoney("12,345")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
  });
});
