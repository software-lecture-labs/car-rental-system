import { describe, expect, it } from "vitest";
import { contractDays, nextTier, percentToRate, pickTier, quotePrice } from "./pricing";

// V7__seed_pricing_policies ile aynı kademeler
const tiers = [
  { policyName: "Standart", minDays: 1, discountRate: 0 },
  { policyName: "Haftalık", minDays: 7, discountRate: 0.1 },
  { policyName: "Aylık", minDays: 30, discountRate: 0.2 },
];

describe("pickTier", () => {
  it("gün sayısına uyan en yüksek min_days kademesini seçer", () => {
    expect(pickTier(tiers, 1)?.policyName).toBe("Standart");
    expect(pickTier(tiers, 6)?.policyName).toBe("Standart");
    expect(pickTier(tiers, 7)?.policyName).toBe("Haftalık");
    expect(pickTier(tiers, 29)?.policyName).toBe("Haftalık");
    expect(pickTier(tiers, 30)?.policyName).toBe("Aylık");
    expect(pickTier(tiers, 365)?.policyName).toBe("Aylık");
  });

  it("sıralanmamış listede de doğru çalışır, uygun kademe yoksa null döner", () => {
    expect(pickTier([...tiers].reverse(), 8)?.policyName).toBe("Haftalık");
    expect(pickTier([{ policyName: "Uzun", minDays: 5, discountRate: 0.05 }], 2)).toBeNull();
  });

  it("bir sonraki kademeyi bulur", () => {
    expect(nextTier(tiers, 3)?.minDays).toBe(7);
    expect(nextTier(tiers, 7)?.minDays).toBe(30);
    expect(nextTier(tiers, 30)).toBeNull();
  });
});

describe("quotePrice", () => {
  it("indirimsiz kısa kiralama", () => {
    const q = quotePrice(1250, 3, tiers);
    expect(q.baseAmount).toBe(3750);
    expect(q.totalAmount).toBe(3750);
    expect(q.discountAmount).toBe(0);
    expect(q.depositAmount).toBe(750);
    expect(q.amountDueAtPickup).toBe(3000);
  });

  it("haftalık kademede %10 indirim uygular", () => {
    const q = quotePrice(2100, 7, tiers);
    expect(q.tier?.policyName).toBe("Haftalık");
    expect(q.baseAmount).toBe(14700);
    expect(q.totalAmount).toBe(13230);
    expect(q.discountAmount).toBe(1470);
    expect(q.depositAmount).toBe(2646);
  });

  it("kuruşları backend gibi HALF_UP yuvarlar ve kayan nokta hatası yapmaz", () => {
    // 333.33 × 7 × 0.9 = 2099.979 -> 2099.98 ; depozito 419.996 -> 420.00
    const q = quotePrice(333.33, 7, tiers);
    expect(q.totalAmount).toBe(2099.98);
    expect(q.depositAmount).toBe(420);
    expect(q.amountDueAtPickup).toBe(1679.98);
    // 0.1 + 0.2 tuzağı: 1400.10 × 3
    expect(quotePrice(1400.1, 3, tiers).totalAmount).toBe(4200.3);
  });

  it("depozito + teslimde ödenecek = toplam", () => {
    for (const [daily, days] of [
      [999.99, 1],
      [1234.56, 13],
      [3500, 45],
    ] as const) {
      const q = quotePrice(daily, days, tiers);
      expect(Math.round((q.depositAmount + q.amountDueAtPickup) * 100)).toBe(Math.round(q.totalAmount * 100));
    }
  });
});

describe("contractDays", () => {
  it("erken iadede bile sözleşme gününü tutardan geri hesaplar", () => {
    expect(contractDays({ dailyPrice: 2100, discountRate: 0.1, totalAmount: 13230, fallbackDays: 2 })).toBe(7);
  });

  it("tutar sıfırsa (yedek araç kaydı) tarihlerden gelen güne düşer", () => {
    expect(contractDays({ dailyPrice: 2100, discountRate: 0, totalAmount: 0, fallbackDays: 4 })).toBe(4);
  });
});

describe("percentToRate", () => {
  it("yüzdeyi backend'in beklediği 4 ondalıklı orana çevirir", () => {
    expect(percentToRate("10")).toBe("0.1000");
    expect(percentToRate("12,5")).toBe("0.1250");
    expect(percentToRate("%0")).toBe("0.0000");
    expect(percentToRate("99,99")).toBe("0.9999");
  });
  it("aralık dışını ve fazla ondalığı reddeder", () => {
    expect(percentToRate("100")).toBeNull();
    expect(percentToRate("-5")).toBeNull();
    expect(percentToRate("10,125")).toBeNull();
    expect(percentToRate("")).toBeNull();
  });
});
