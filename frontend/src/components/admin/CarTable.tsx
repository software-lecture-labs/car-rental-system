"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plate } from "@/components/doc/Plate";
import { Stamp } from "@/components/doc/Stamp";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";
import { clientApi } from "@/lib/api/client";
import type { CarResponse } from "@/lib/api/types";
import { formatTL } from "@/lib/format";
import { CAR_STATUS_LABELS, CAR_STATUS_TONES, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { errorMessage } from "@/lib/messages";
import { ledger } from "./ledger";

/** Araç defteri: bakıma alma / müsait yapma / silme satır içinde, silme iki adımlı onayla. */
export function CarTable({ cars }: { cars: CarResponse[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function run(id: string, action: () => Promise<unknown>, ok: string, context: "car-status" | "car-delete") {
    setBusyId(id);
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        setMessage({ tone: "ok", text: ok });
        setConfirmDelete(null);
        router.refresh();
      } catch (error) {
        setMessage({ tone: "err", text: errorMessage(error, context) });
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      {message ? <Notice tone={message.tone} title={message.text} /> : null}
      <div className={ledger.wrap}>
        <table className={ledger.table}>
          <caption className="sr-only">Araçlar</caption>
          <thead>
            <tr>
              <th scope="col" className={ledger.th}>Plaka</th>
              <th scope="col" className={ledger.th}>Araç</th>
              <th scope="col" className={ledger.thNum}>Yıl</th>
              <th scope="col" className={ledger.th}>Yakıt</th>
              <th scope="col" className={ledger.th}>Vites</th>
              <th scope="col" className={ledger.thNum}>Koltuk</th>
              <th scope="col" className={ledger.thNum}>Günlük</th>
              <th scope="col" className={ledger.th}>Durum</th>
              <th scope="col" className={ledger.th}><span className="sr-only">İşlemler</span></th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => {
              const busy = pending && busyId === car.id;
              const name = `${car.brand} ${car.model}`;
              return (
                <tr key={car.id} className={ledger.tr} aria-busy={busy}>
                  <td className={ledger.td}>
                    <Plate plate={car.plate} size="sm" />
                  </td>
                  <th scope="row" className={`${ledger.td} text-left font-semibold text-navy`}>
                    <Link href={`/admin/araclar/${car.id}`} className="hover:underline">
                      {name}
                    </Link>
                    <span className="block text-xs font-normal text-muted">{car.color}</span>
                  </th>
                  <td className={ledger.tdNum}>{car.productionYear}</td>
                  <td className={ledger.td}>{FUEL_LABELS[car.fuelType]}</td>
                  <td className={ledger.td}>{TRANSMISSION_LABELS[car.transmission]}</td>
                  <td className={ledger.tdNum}>{car.seatCount}</td>
                  <td className={ledger.tdNum}>{formatTL(car.dailyBasePrice)}</td>
                  <td className={ledger.td}>
                    <Stamp label={CAR_STATUS_LABELS[car.status]} tone={CAR_STATUS_TONES[car.status]} size="sm" animate={false} />
                  </td>
                  <td className={`${ledger.td} whitespace-nowrap`}>
                    {confirmDelete === car.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs font-semibold text-err">Silinsin mi?</span>
                        <button
                          type="button"
                          className={buttonClass("danger", "sm")}
                          disabled={busy}
                          onClick={() => run(car.id, () => clientApi.cars.remove(car.id), `${name} silindi.`, "car-delete")}
                        >
                          Evet, sil
                        </button>
                        <button type="button" className={buttonClass("quiet", "sm")} onClick={() => setConfirmDelete(null)}>
                          Vazgeç
                        </button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Link href={`/admin/araclar/${car.id}`} className={buttonClass("outline", "sm")}>
                          Düzenle<span className="sr-only">: {name}</span>
                        </Link>
                        {car.status === "AVAILABLE" ? (
                          <button
                            type="button"
                            className={buttonClass("outline", "sm")}
                            disabled={busy}
                            onClick={() => run(car.id, () => clientApi.cars.setMaintenance(car.id), `${name} bakıma alındı.`, "car-status")}
                          >
                            Bakıma al
                          </button>
                        ) : car.status === "MAINTENANCE" ? (
                          <button
                            type="button"
                            className={buttonClass("outline", "sm")}
                            disabled={busy}
                            onClick={() => run(car.id, () => clientApi.cars.setAvailable(car.id), `${name} müsait yapıldı.`, "car-status")}
                          >
                            Müsait yap
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={buttonClass("danger", "sm")}
                          disabled={busy || car.status === "RENTED"}
                          title={car.status === "RENTED" ? "Kiradaki araç silinemez" : undefined}
                          onClick={() => setConfirmDelete(car.id)}
                        >
                          Sil<span className="sr-only">: {name}</span>
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
