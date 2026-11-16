/**
 * Rezervasyon öncesi fiyat ÖNİZLEMESİ. Backend'deki PricingService.quote ve PriceQuote ile aynı kurallar:
 * - kademe: gün sayısına uyan en yüksek min_days (kullanıcı paket seçmez)
 * - toplam = günlük fiyat × gün × (1 − indirim), 2 haneye HALF_UP yuvarlanır
 * - ön ödeme (depozito) = toplamın %20'si, HALF_UP; kalan teslimde ödenir
 * Kayıtlı tutar her zaman sunucunun döndürdüğü totalAmount'tur; bu dosya sadece önizleme içindir.
 * Kayan nokta hatası olmasın diye hesap kuruş cinsinden BigInt ile yapılır.
 */

export interface PricingTier {
  policyName: string;
  minDays: number;
  discountRate: number;
}

export const DEPOSIT_RATE_PERCENT = 20;

export interface PriceQuote {
  days: number;
  dailyPrice: number;
  tier: PricingTier | null;
  discountRate: number;
  baseAmount: number;
  discountAmount: number;
  totalAmount: number;
  depositAmount: number;
  amountDueAtPickup: number;
}

export function pickTier<T extends PricingTier>(tiers: readonly T[], days: number): T | null {
  let best: T | null = null;
  for (const tier of tiers) {
    if (tier.minDays <= days && (best === null || tier.minDays > best.minDays)) best = tier;
  }
  return best;
}

/** Bir sonraki kademe: "2 gün daha eklersen %10 indirim" ipucu için */
export function nextTier<T extends PricingTier>(tiers: readonly T[], days: number): T | null {
  let next: T | null = null;
  for (const tier of tiers) {
    if (tier.minDays > days && (next === null || tier.minDays < next.minDays)) next = tier;
  }
  return next;
}

const toKurus = (amount: number) => BigInt(Math.round(amount * 100));
const fromKurus = (kurus: bigint) => Number(kurus) / 100;

/** pay / payda, pozitif sayılar için HALF_UP yuvarlama */
function divHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n);
}

export function quotePrice(dailyPrice: number, days: number, tiers: readonly PricingTier[]): PriceQuote {
  const safeDays = Math.max(1, Math.floor(days));
  const tier = pickTier(tiers, safeDays);
  const rate = tier?.discountRate ?? 0;
  const rateBasisPoints = BigInt(Math.round(rate * 10_000)); // NUMERIC(5,4): en fazla 4 ondalık

  const dailyKurus = toKurus(dailyPrice);
  const baseKurus = dailyKurus * BigInt(safeDays);
  const totalKurus = divHalfUp(baseKurus * (10_000n - rateBasisPoints), 10_000n);
  const depositKurus = divHalfUp(totalKurus * BigInt(DEPOSIT_RATE_PERCENT), 100n);

  return {
    days: safeDays,
    dailyPrice,
    tier,
    discountRate: rate,
    baseAmount: fromKurus(baseKurus),
    discountAmount: fromKurus(baseKurus - totalKurus),
    totalAmount: fromKurus(totalKurus),
    depositAmount: fromKurus(depositKurus),
    amountDueAtPickup: fromKurus(totalKurus - depositKurus),
  };
}

/**
 * Bir kiralamanın sözleşmedeki gün sayısı. Erken iadede backend rentalEnd'i iade anına çeker ama tutarı
 * değiştirmez; bu yüzden günü önce kayıtlı tutardan geri hesaplıyoruz, olmazsa tarihlerden.
 */
export function contractDays(rental: {
  dailyPrice: number;
  discountRate: number;
  totalAmount: number;
  fallbackDays: number;
}): number {
  const perDay = rental.dailyPrice * (1 - rental.discountRate);
  if (rental.totalAmount > 0 && perDay > 0) {
    const days = Math.round(rental.totalAmount / perDay);
    if (days >= 1) return days;
  }
  return rental.fallbackDays;
}

/** "12,5" -> 0.125 ; geçersizse null. discount_rate NUMERIC(5,4): yüzde olarak en fazla 2 ondalık, 0 ≤ oran < 1 */
export function percentToRate(text: string): string | null {
  const s = text.trim().replace(",", ".").replace(/^%/, "");
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const basisPoints = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return (basisPoints / 10_000).toFixed(4);
}
