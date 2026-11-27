import Link from "next/link";
import { Plate } from "@/components/doc/Plate";
import { Stamp } from "@/components/doc/Stamp";
import { CarImage } from "@/components/car/CarImage";
import { buttonClass } from "@/components/ui/button";
import type { AvailableCarResponse, CarResponse, PricingPolicyResponse } from "@/lib/api/types";
import { coverImageUrl } from "@/lib/api/urls";
import { formatPercent, formatTL } from "@/lib/format";
import { CAR_STATUS_LABELS, CAR_STATUS_TONES, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { pickTier } from "@/lib/pricing";

/**
 * Listede bir araç: solda kapak, ortada plaka + ruhsat özetleri, sağda fiyat sütunu.
 * Kart değil, defter satırı: araçları 1px çizgiler ayırır.
 */
export function CarRow({
  car,
  offer,
  policies,
  href,
}: {
  car: CarResponse;
  offer?: AvailableCarResponse;
  policies: PricingPolicyResponse[];
  href: string;
}) {
  const title = `${car.brand} ${car.model}`;
  const tier = offer ? pickTier(policies, offer.rentalDays) : null;

  return (
    <article className="grid gap-x-6 gap-y-4 border-b border-rule py-6 md:grid-cols-12" aria-labelledby={`arac-${car.id}`}>
      <Link href={href} tabIndex={-1} aria-hidden className="block md:col-span-4">
        <CarImage src={coverImageUrl(car.id)} alt="" className="aspect-[4/3] w-full rounded-sm" />
      </Link>

      <div className="min-w-0 md:col-span-5">
        <div className="flex flex-wrap items-center gap-3">
          <Plate plate={car.plate} />
          {car.status !== "AVAILABLE" ? (
            <Stamp label={CAR_STATUS_LABELS[car.status]} tone={CAR_STATUS_TONES[car.status]} size="sm" animate={false} />
          ) : null}
        </div>
        <h3 id={`arac-${car.id}`} className="mt-3 text-[1.4rem]">
          <Link href={href} className="hover:underline hover:decoration-2 hover:underline-offset-4">
            {title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-muted">
          <span className="figures">{car.productionYear}</span> model · {car.color}
        </p>
        <dl className="mt-4 grid grid-cols-3 border-t border-l border-rule text-sm">
          {[
            ["Yakıt", FUEL_LABELS[car.fuelType]],
            ["Vites", TRANSMISSION_LABELS[car.transmission]],
            ["Koltuk", String(car.seatCount)],
          ].map(([label, value]) => (
            <div key={label} className="border-r border-b border-rule px-2.5 py-1.5">
              <dt className="doc-label">{label}</dt>
              <dd className="font-medium text-navy">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col justify-between gap-4 border-rule md:col-span-3 md:border-l md:pl-6">
        {offer ? (
          <div>
            <p className="doc-label">{offer.rentalDays} gün toplam</p>
            <p className="figures mt-1 text-[1.6rem] leading-none font-semibold text-navy">{formatTL(offer.totalAmount)}</p>
            <p className="figures mt-2 text-xs text-muted">günlük {formatTL(car.dailyBasePrice)}</p>
            {offer.discountRate > 0 ? (
              <p className="mt-1 text-xs font-semibold text-ok">
                {tier?.policyName ?? "İndirim"} kademesi: {formatPercent(offer.discountRate)} indirim
              </p>
            ) : null}
          </div>
        ) : (
          <div>
            <p className="doc-label">Günlük</p>
            <p className="figures mt-1 text-[1.6rem] leading-none font-semibold text-navy">{formatTL(car.dailyBasePrice)}</p>
            <p className="mt-2 text-xs text-muted">Tarih seçince toplam ve indirim hesaplanır.</p>
          </div>
        )}
        <Link href={href} className={buttonClass("outline", "md", "w-full md:w-auto")}>
          İncele <span className="sr-only">: {title}</span>
        </Link>
      </div>
    </article>
  );
}
