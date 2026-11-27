import Link from "next/link";
import { Plate } from "@/components/doc/Plate";
import { Stamp } from "@/components/doc/Stamp";
import type { RentalResponse } from "@/lib/api/types";
import { formatDateTimeNumeric } from "@/lib/datetime";
import { formatTL } from "@/lib/format";
import { rentalStamp } from "@/lib/labels";

/** Müşterinin kiralama defteri: her satır bir sözleşme. */
export function RentalLedger({ rentals, hrefFor }: { rentals: RentalResponse[]; hrefFor: (r: RentalResponse) => string }) {
  return (
    <ul className="border-t border-navy">
      {rentals.map((r) => {
        const stamp = rentalStamp(r);
        return (
          <li key={r.id} className="border-b border-rule">
            <Link
              href={hrefFor(r)}
              className="grid items-center gap-x-6 gap-y-2 py-4 hover:bg-card sm:grid-cols-[auto_1fr_auto_auto] sm:px-2"
            >
              <Plate plate={r.carPlate} size="sm" />
              <span className="min-w-0">
                <span className="block font-semibold text-navy">
                  {r.carBrand} {r.carModel}
                </span>
                <span className="figures block text-xs text-muted">
                  {formatDateTimeNumeric(r.rentalStart)} → {formatDateTimeNumeric(r.rentalEnd)}
                </span>
              </span>
              <span className="figures text-right font-semibold text-navy">{formatTL(r.totalAmount)}</span>
              <span className="justify-self-start sm:justify-self-end">
                <Stamp label={stamp.label} tone={stamp.tone} size="sm" animate={false} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
