"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clientApi } from "@/lib/api/client";
import { addHours, compareParts, formatDateTimeNumeric, istanbulNow, parseLocalDateTime } from "@/lib/datetime";
import { formatTL } from "@/lib/format";
import { errorMessage } from "@/lib/messages";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";

/**
 * PUT /api/rentals/{id}/cancel. Backend kuralı: başlangıçtan 24 saat öncesine kadar iptalde ön ödeme iade edilir.
 * Onay adımında hangi durumda olduğunu gösteriyoruz; asıl karar sunucuda verilir ve sonuç fişte görünür.
 */
export function CancelRental({ rentalId, rentalStart, deposit }: { rentalId: string; rentalStart: string; deposit: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<null | { refundable: boolean }>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const start = parseLocalDateTime(rentalStart);
  const deadline = start ? addHours(start, -24) : null;

  function ask() {
    setError(null);
    setConfirming({ refundable: deadline ? compareParts(istanbulNow(), deadline) < 0 : false });
  }

  function cancel() {
    startTransition(async () => {
      try {
        await clientApi.rentals.cancel(rentalId);
        setConfirming(null);
        router.refresh();
      } catch (e) {
        setError(errorMessage(e, "cancel"));
      }
    });
  }

  return (
    <div className="space-y-3">
      {error ? <Notice tone="err" title={error} /> : null}
      {confirming ? (
        <div className="border-2 border-err p-4">
          <p className="font-semibold text-err">Rezervasyon iptal edilsin mi?</p>
          <p className="mt-1 text-sm text-ink">
            {confirming.refundable ? (
              <>
                Ücretsiz iptal süresi içindesin: <span className="figures font-semibold">{formatTL(deposit)}</span> ön ödeme bakiyene iade edilecek.
              </>
            ) : (
              <>
                Başlangıca 24 saatten az kaldı: <span className="figures font-semibold">{formatTL(deposit)}</span> ön ödeme iade edilmeyecek.
              </>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className={buttonClass("danger")} onClick={cancel} disabled={pending}>
              {pending ? "İptal ediliyor…" : "Evet, iptal et"}
            </button>
            <button type="button" className={buttonClass("outline")} onClick={() => setConfirming(null)} disabled={pending}>
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button type="button" className={buttonClass("danger")} onClick={ask}>
            Rezervasyonu iptal et
          </button>
          {deadline ? (
            <p className="mt-2 text-xs text-muted">
              Ücretsiz iptal için son an: <span className="figures">{formatDateTimeNumeric(deadline)}</span>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
