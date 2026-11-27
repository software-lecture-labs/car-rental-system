"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TextInput } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";
import { clientApi } from "@/lib/api/client";
import type { PricingPolicyResponse } from "@/lib/api/types";
import { formatPercent } from "@/lib/format";
import { errorMessage } from "@/lib/messages";
import { percentToRate } from "@/lib/pricing";
import { ledger } from "./ledger";

/** PUT /api/pricing/policies/{policyName}?rate=… — backend sadece indirim oranını güncellemeye izin veriyor. */
export function PricingAdmin({ policies }: { policies: PricingPolicyResponse[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(policies.map((p) => [p.id, String(Math.round(p.discountRate * 10_000) / 100).replace(".", ",")])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save(policy: PricingPolicyResponse) {
    const rate = percentToRate(drafts[policy.id] ?? "");
    if (rate === null) {
      setErrors((e) => ({ ...e, [policy.id]: "0 ile 99,99 arasında, en fazla 2 ondalık." }));
      return;
    }
    setErrors((e) => ({ ...e, [policy.id]: "" }));
    setMessage(null);
    startTransition(async () => {
      try {
        await clientApi.pricing.updateRate(policy.policyName, rate);
        setMessage({ tone: "ok", text: `${policy.policyName} kademesi ${formatPercent(Number(rate))} olarak kaydedildi. Mevcut kiralamalar etkilenmez.` });
        router.refresh();
      } catch (error) {
        setMessage({ tone: "err", text: errorMessage(error, "pricing") });
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-4">
      {message ? <Notice tone={message.tone} title={message.text} /> : null}
      <div className={ledger.wrap}>
        <table className={`${ledger.table} min-w-[560px]`}>
          <caption className="sr-only">Fiyat kademeleri</caption>
          <thead>
            <tr>
              <th scope="col" className={ledger.th}>Kademe</th>
              <th scope="col" className={ledger.thNum}>En az gün</th>
              <th scope="col" className={ledger.thNum}>Geçerli indirim</th>
              <th scope="col" className={ledger.th}>Yeni indirim (%)</th>
              <th scope="col" className={ledger.th}><span className="sr-only">Kaydet</span></th>
            </tr>
          </thead>
          <tbody>
            {[...policies]
              .sort((a, b) => a.minDays - b.minDays)
              .map((p) => {
                const id = `oran-${p.id}`;
                return (
                  <tr key={p.id} className={ledger.tr}>
                    <th scope="row" className={`${ledger.td} text-left font-semibold text-navy`}>
                      {p.policyName}
                    </th>
                    <td className={ledger.tdNum}>{p.minDays}</td>
                    <td className={ledger.tdNum}>{formatPercent(p.discountRate)}</td>
                    <td className={ledger.td}>
                      <label htmlFor={id} className="sr-only">
                        {p.policyName} için yeni indirim yüzdesi
                      </label>
                      <TextInput
                        id={id}
                        inputMode="decimal"
                        className="figures h-9! max-w-28"
                        value={drafts[p.id] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                        error={errors[p.id] || undefined}
                      />
                      {errors[p.id] ? (
                        <p id={`${id}-error`} className="mt-1 text-xs text-err">
                          {errors[p.id]}
                        </p>
                      ) : null}
                    </td>
                    <td className={ledger.td}>
                      <button type="button" className={buttonClass("primary", "sm")} disabled={pending} onClick={() => save(p)}>
                        Kaydet<span className="sr-only">: {p.policyName}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Backend’de kademe ekleme, silme ve en az gün sayısını değiştirme ucu yok; burada sadece indirim oranı güncellenir. Kademe, kiralama gün sayısına uyan en yüksek
        “en az gün” değerine göre otomatik seçilir.
      </p>
    </div>
  );
}
