import { describe, expect, it } from "vitest";
import {
  addDays,
  combineDateTime,
  defaultPickup,
  formatDateTimeLong,
  formatDateTimeNumeric,
  istanbulNow,
  parseLocalDateTime,
  rentalDaysBetween,
  toLocalDateTime,
} from "./datetime";

describe("LocalDateTime ayrıştırma", () => {
  it("backend'in gönderebileceği biçimleri okur", () => {
    expect(parseLocalDateTime("2026-11-20T10:00:00")).toMatchObject({ year: 2026, month: 11, day: 20, hour: 10, minute: 0 });
    expect(parseLocalDateTime("2026-11-20T10:00")).toMatchObject({ hour: 10, second: 0 });
    expect(parseLocalDateTime("2026-11-16T15:49:12.123456")).toMatchObject({ minute: 49, second: 12 });
  });

  it("saat dilimli ya da takvimde olmayan değerleri reddeder", () => {
    expect(parseLocalDateTime("2026-11-20T10:00:00Z")).toBeNull();
    expect(parseLocalDateTime("2026-02-30T10:00:00")).toBeNull();
    expect(parseLocalDateTime("2026-11-20 10:00")).toBeNull();
  });

  it("gönderirken saniyeli ve Z'siz yazar", () => {
    const value = combineDateTime("2026-11-20", "09:30");
    expect(value).toBe("2026-11-20T09:30:00");
    expect(value).not.toContain("Z");
    expect(combineDateTime("2026-13-01", "09:30")).toBeNull();
  });
});

describe("İstanbul saati", () => {
  it("UTC anını İstanbul duvar saatine çevirir (UTC+3)", () => {
    const parts = istanbulNow(new Date("2026-11-16T21:30:00Z"));
    expect(toLocalDateTime(parts)).toBe("2026-11-17T00:30:00");
  });

  it("varsayılan teslim: İstanbul'a göre yarın 10:00", () => {
    expect(toLocalDateTime(defaultPickup(new Date("2026-11-16T21:30:00Z")))).toBe("2026-11-18T10:00:00");
  });

  it("gün eklemede ay ve yıl sınırını doğru geçer", () => {
    const p = parseLocalDateTime("2026-12-30T10:00:00")!;
    expect(toLocalDateTime(addDays(p, 3))).toBe("2027-01-02T10:00:00");
  });
});

describe("kiralama günü", () => {
  it("backend'deki gibi saat farkını yukarı yuvarlar, en az 1 gün", () => {
    expect(rentalDaysBetween("2026-11-20T10:00:00", "2026-11-23T10:00:00")).toBe(3);
    expect(rentalDaysBetween("2026-11-20T10:00:00", "2026-11-20T11:00:00")).toBe(1);
    expect(rentalDaysBetween("2026-11-20T10:00:00", "2026-11-21T11:00:00")).toBe(2);
  });
});

describe("tarih biçimlendirme", () => {
  it("Türkçe biçimler", () => {
    expect(formatDateTimeNumeric("2026-11-20T09:05:00")).toBe("20.11.2026 09:05");
    expect(formatDateTimeLong("2026-11-20T10:00:00")).toBe("20 Kasım 2026, Cuma 10:00");
    expect(formatDateTimeNumeric("bozuk")).toBe("—");
  });
});
