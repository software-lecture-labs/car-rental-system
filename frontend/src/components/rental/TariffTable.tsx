import type { PricingPolicyResponse } from "@/lib/api/types";
import { formatPercent } from "@/lib/format";
import { pickTier } from "@/lib/pricing";

/** Fiyat kademeleri (GET /api/pricing/policies). Uygulanan kademe işaretlenir. */
export function TariffTable({ policies, days }: { policies: PricingPolicyResponse[]; days?: number }) {
  const sorted = [...policies].sort((a, b) => a.minDays - b.minDays);
  const active = days ? pickTier(sorted, days) : null;

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">İndirim kademeleri</caption>
      <thead>
        <tr className="border-b border-navy text-left">
          <th scope="col" className="doc-label py-1.5 pr-2 font-semibold">Kademe</th>
          <th scope="col" className="doc-label py-1.5 pr-2 text-right font-semibold">En az gün</th>
          <th scope="col" className="doc-label py-1.5 text-right font-semibold">İndirim</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((p) => {
          const isActive = active?.id === p.id;
          return (
            <tr key={p.id} className={`border-b border-rule ${isActive ? "bg-info-bg" : ""}`} aria-current={isActive ? "true" : undefined}>
              <th scope="row" className="py-1.5 pr-2 text-left font-medium text-navy">
                {p.policyName}
                {isActive ? <span className="doc-label ml-2 text-navy!">uygulanır</span> : null}
              </th>
              <td className="figures py-1.5 pr-2 text-right">{p.minDays}</td>
              <td className="figures py-1.5 text-right">{formatPercent(p.discountRate)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
