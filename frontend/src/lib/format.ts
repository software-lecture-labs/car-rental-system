/**
 * Para, oran ve plaka biçimlendirme. Hepsi saf fonksiyon; sunucuda da tarayıcıda da aynı sonucu verir.
 */

const tl = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat("tr-TR", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

/** 1250 -> "₺1.250,00" */
export function formatTL(amount: number): string {
  // -0 gibi değerler "-₺0,00" görünmesin
  const value = Object.is(amount, -0) ? 0 : amount;
  return tl.format(value);
}

/** 0.1 -> "%10", 0.125 -> "%12,5" */
export function formatPercent(rate: number): string {
  return percent.format(rate);
}

/** 12000 -> "12.000" */
export function formatInteger(value: number): string {
  return integer.format(value);
}

/** 5242880 -> "5 MB", 734003 -> "717 KB" */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(mb)} MB`;
  }
  return `${integer.format(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

const PLATE_PATTERN = /^([0-9]{2})([A-Z]{1,3})([0-9]{2,4})$/;

/** Backend'in sakladığı biçimi (34ABC123) gerçek plakadaki gibi gruplar: "34 ABC 123" */
export function formatPlate(plate: string): string {
  const normalized = normalizePlate(plate);
  const match = PLATE_PATTERN.exec(normalized);
  if (!match) return plate.trim().toUpperCase();
  return `${match[1]} ${match[2]} ${match[3]}`;
}

/**
 * Backend'deki CarRequest.normalizePlate ile aynı: boşlukları at, büyük harfe çevir.
 * Türkçe yerel ayarda "i".toUpperCase() "İ" olabileceği için en-US kullanıyoruz (backend Locale.ROOT kullanıyor).
 */
export function normalizePlate(plate: string): string {
  return plate.replace(/\s+/g, "").toLocaleUpperCase("en-US");
}

/** Veritabanındaki CHECK kısıtıyla aynı desen */
export function isValidPlate(plate: string): boolean {
  return PLATE_PATTERN.test(normalizePlate(plate));
}
