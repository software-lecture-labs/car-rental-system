import { describe, expect, it } from "vitest";
import { formatBytes, formatPercent, formatPlate, formatTL, isValidPlate, normalizePlate } from "./format";

// Intl çıktısında para birimi ile sayı arasında bölünmez boşluk olabilir; karşılaştırmadan önce sadeleştir.
const plain = (s: string) => s.replace(/ | /g, " ");

describe("para", () => {
  it("tr-TR biçiminde TL yazar", () => {
    expect(plain(formatTL(1250))).toBe("₺1.250,00");
    expect(plain(formatTL(13230.5))).toBe("₺13.230,50");
    expect(plain(formatTL(0))).toBe("₺0,00");
    expect(plain(formatTL(-0))).toBe("₺0,00");
  });

  it("oranı yüzde olarak yazar", () => {
    expect(formatPercent(0.1)).toBe("%10");
    expect(formatPercent(0.125)).toBe("%12,5");
    expect(formatPercent(0)).toBe("%0");
  });

  it("dosya boyutu", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1,5 MB");
    expect(formatBytes(300 * 1024)).toBe("300 KB");
  });
});

describe("plaka", () => {
  it("gerçek plakadaki gibi gruplar", () => {
    expect(formatPlate("34ABC123")).toBe("34 ABC 123");
    expect(formatPlate("06A1234")).toBe("06 A 1234");
    expect(formatPlate("34TSL24")).toBe("34 TSL 24");
  });

  it("backend gibi normalleştirir ve deseni denetler", () => {
    expect(normalizePlate(" 34 abc 123 ")).toBe("34ABC123");
    // Türkçe "i" büyük harfe çevrilince "İ" olmamalı
    expect(normalizePlate("34 kli 12")).toBe("34KLI12");
    expect(isValidPlate("34 ABC 123")).toBe(true);
    expect(isValidPlate("34ABCD123")).toBe(false);
    expect(isValidPlate("3ABC123")).toBe(false);
  });
});
