"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState, useTransition } from "react";
import { Plate } from "@/components/doc/Plate";
import { Stamp } from "@/components/doc/Stamp";
import { SelectInput } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";
import { clientApi } from "@/lib/api/client";
import type { BreakdownResolution, CarResponse, RentalResponse, RollbackRequest } from "@/lib/api/types";
import { formatDateTimeNumeric } from "@/lib/datetime";
import { formatPlate, formatTL } from "@/lib/format";
import { rentalStamp } from "@/lib/labels";
import { conflictKind, errorMessage } from "@/lib/messages";
import { ledger } from "./ledger";

type Reason = RollbackRequest["reason"];

const REASONS: { value: Reason; label: string; effect: (pickedUp: boolean) => string }[] = [
  {
    value: "COMPANY_DECISION",
    label: "Şirket kararı",
    effect: (p) => (p ? "Kullanılmayan günlerin ücreti müşteriye iade edilir, araç müsait olur." : "Ön ödeme müşteriye iade edilir."),
  },
  {
    value: "CUSTOMER_VIOLATION",
    label: "Müşteri kural ihlali",
    effect: (p) => (p ? "Ücret iade edilmez, araç müsait olur." : "Ücret iade edilmez."),
  },
  { value: "BREAKDOWN", label: "Arıza (sadece teslim edilmiş araç)", effect: () => "Araç bakıma alınır." },
];

/**
 * Kiralama defteri: teslim etme (pickup), iade alma (return), iptal ve geri alma (rollback).
 * Geri almada sebep ve arızada çözüm (ücret iadesi / yedek araç) satırın altında açılan panelde seçilir.
 */
export function RentalTable({ rentals, cars }: { rentals: RentalResponse[]; cars: CarResponse[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [rollbackFor, setRollbackFor] = useState<string | null>(null);
  const [reason, setReason] = useState<Reason>("COMPANY_DECISION");
  const [resolution, setResolution] = useState<BreakdownResolution>("REFUND");
  const [replacementId, setReplacementId] = useState("");

  function run(rental: RentalResponse, action: () => Promise<unknown>, ok: string) {
    setBusyId(rental.id);
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        setMessage({ tone: "ok", text: ok });
        setRollbackFor(null);
        router.refresh();
      } catch (error) {
        const text =
          conflictKind(error) === "insufficient-balance"
            ? `Müşterinin bakiyesi teslimde alınacak ${formatTL(rental.totalAmount - rental.depositAmount)} tutarı karşılamıyor.`
            : errorMessage(error, "rental-action");
        setMessage({ tone: "err", text });
      } finally {
        setBusyId(null);
      }
    });
  }

  function openRollback(rental: RentalResponse) {
    setRollbackFor(rollbackFor === rental.id ? null : rental.id);
    setReason("COMPANY_DECISION");
    setResolution("REFUND");
    setReplacementId("");
    setMessage(null);
  }

  function submitRollback(rental: RentalResponse) {
    if (reason === "BREAKDOWN" && resolution === "REPLACEMENT" && !replacementId) {
      setMessage({ tone: "err", text: "Yedek araç seç." });
      return;
    }
    const body: RollbackRequest =
      reason === "BREAKDOWN"
        ? { reason, resolution, ...(resolution === "REPLACEMENT" ? { replacementCarId: replacementId } : {}) }
        : { reason };
    run(rental, () => clientApi.rentals.rollback(rental.id, body), `${formatPlate(rental.carPlate)} kiralaması geri alındı.`);
  }

  const replacements = (rental: RentalResponse) => cars.filter((c) => c.status === "AVAILABLE" && c.id !== rental.carId);

  return (
    <div className="space-y-3">
      {message ? <Notice tone={message.tone} title={message.text} /> : null}
      <div className={ledger.wrap}>
        <table className={`${ledger.table} min-w-[980px]`}>
          <caption className="sr-only">Kiralamalar</caption>
          <thead>
            <tr>
              <th scope="col" className={ledger.th}>No</th>
              <th scope="col" className={ledger.th}>Araç</th>
              <th scope="col" className={ledger.th}>Müşteri</th>
              <th scope="col" className={ledger.th}>Dönem</th>
              <th scope="col" className={ledger.thNum}>Toplam</th>
              <th scope="col" className={ledger.thNum}>Ön ödeme</th>
              <th scope="col" className={ledger.th}>Durum</th>
              <th scope="col" className={ledger.th}><span className="sr-only">İşlemler</span></th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((r) => {
              const stamp = rentalStamp(r);
              const busy = pending && busyId === r.id;
              const open = r.status === "PENDING";
              const label = `${formatPlate(r.carPlate)}, ${r.customerFullName}`;
              return (
                <Fragment key={r.id}>
                  <tr className={ledger.tr} aria-busy={busy}>
                    <td className={ledger.tdMono}>{r.id.slice(0, 8).toUpperCase()}</td>
                    <td className={ledger.td}>
                      <span className="flex items-center gap-2">
                        <Plate plate={r.carPlate} size="sm" />
                        <span className="whitespace-nowrap text-muted">
                          {r.carBrand} {r.carModel}
                        </span>
                      </span>
                    </td>
                    <th scope="row" className={`${ledger.td} text-left font-medium whitespace-nowrap text-navy`}>
                      {r.customerFullName}
                    </th>
                    <td className={`${ledger.tdMono} text-xs leading-snug`}>
                      {formatDateTimeNumeric(r.rentalStart)}
                      <br />
                      <span className="text-muted">→ {formatDateTimeNumeric(r.rentalEnd)}</span>
                    </td>
                    <td className={ledger.tdNum}>{formatTL(r.totalAmount)}</td>
                    <td className={ledger.tdNum}>{formatTL(r.depositAmount)}</td>
                    <td className={ledger.td}>
                      <Stamp label={stamp.label} tone={stamp.tone} note={stamp.note} size="sm" animate={false} />
                    </td>
                    <td className={`${ledger.td} whitespace-nowrap`}>
                      {open ? (
                        <span className="inline-flex items-center gap-1.5">
                          {!r.pickedUpAt ? (
                            <>
                              <button type="button" className={buttonClass("primary", "sm")} disabled={busy} onClick={() => run(r, () => clientApi.rentals.pickup(r.id), `${formatPlate(r.carPlate)} teslim edildi.`)}>
                                Teslim et<span className="sr-only">: {label}</span>
                              </button>
                              <button type="button" className={buttonClass("outline", "sm")} disabled={busy} onClick={() => run(r, () => clientApi.rentals.cancel(r.id), "Rezervasyon iptal edildi.")}>
                                İptal<span className="sr-only">: {label}</span>
                              </button>
                            </>
                          ) : (
                            <button type="button" className={buttonClass("primary", "sm")} disabled={busy} onClick={() => run(r, () => clientApi.rentals.complete(r.id), `${formatPlate(r.carPlate)} iade alındı.`)}>
                              İade al<span className="sr-only">: {label}</span>
                            </button>
                          )}
                          <button type="button" className={buttonClass("danger", "sm")} disabled={busy} aria-expanded={rollbackFor === r.id} onClick={() => openRollback(r)}>
                            Geri al…<span className="sr-only">: {label}</span>
                          </button>
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                  {rollbackFor === r.id ? (
                    <tr className="border-b border-rule bg-card">
                      <td colSpan={8} className="px-3 py-4">
                        <fieldset className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" disabled={busy}>
                          <legend className="doc-label mb-2 text-navy!">Geri alma · {label}</legend>
                          <div>
                            <label htmlFor={`sebep-${r.id}`} className="doc-label mb-1 block">Sebep</label>
                            <SelectInput id={`sebep-${r.id}`} value={reason} onChange={(e) => setReason(e.target.value as Reason)}>
                              {REASONS.filter((x) => x.value !== "BREAKDOWN" || r.pickedUpAt).map((x) => (
                                <option key={x.value} value={x.value}>{x.label}</option>
                              ))}
                            </SelectInput>
                            <p className="mt-1 text-xs text-muted">{REASONS.find((x) => x.value === reason)?.effect(Boolean(r.pickedUpAt))}</p>
                          </div>
                          {reason === "BREAKDOWN" ? (
                            <div className="space-y-2">
                              <span className="doc-label block">Çözüm</span>
                              <label className="flex items-center gap-2 text-sm">
                                <input type="radio" name={`cozum-${r.id}`} className="accent-navy" checked={resolution === "REFUND"} onChange={() => setResolution("REFUND")} />
                                Kalan günlerin ücretini iade et
                              </label>
                              <label className="flex items-center gap-2 text-sm">
                                <input type="radio" name={`cozum-${r.id}`} className="accent-navy" checked={resolution === "REPLACEMENT"} onChange={() => setResolution("REPLACEMENT")} />
                                Yedek araç ver (ücretsiz, aynı bitişe kadar)
                              </label>
                              {resolution === "REPLACEMENT" ? (
                                <SelectInput id={`yedek-${r.id}`} aria-label="Yedek araç" value={replacementId} onChange={(e) => setReplacementId(e.target.value)}>
                                  <option value="">Müsait araç seç…</option>
                                  {replacements(r).map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {formatPlate(c.plate)} · {c.brand} {c.model}
                                    </option>
                                  ))}
                                </SelectInput>
                              ) : null}
                            </div>
                          ) : (
                            <div />
                          )}
                          <div className="flex gap-2">
                            <button type="button" className={buttonClass("danger")} onClick={() => submitRollback(r)}>
                              Geri al
                            </button>
                            <button type="button" className={buttonClass("quiet")} onClick={() => setRollbackFor(null)}>
                              Vazgeç
                            </button>
                          </div>
                        </fieldset>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
