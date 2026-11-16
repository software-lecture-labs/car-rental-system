import { Plate } from "@/components/doc/Plate";
import { Receipt, ReceiptLine, ReceiptTotal } from "@/components/doc/Receipt";
import { Stamp } from "@/components/doc/Stamp";
import type { RentalResponse } from "@/lib/api/types";
import { formatDateTimeNumeric, rentalDaysBetween } from "@/lib/datetime";
import { formatPercent, formatTL } from "@/lib/format";
import { CANCELLATION_REASON_LABELS, rentalStamp } from "@/lib/labels";
import { contractDays } from "@/lib/pricing";

/**
 * Kayıtlı bir kiralamanın sözleşmesi. Fiyatlar aracın bugünkü fiyatından değil, kiralamadaki kopyadan
 * (dailyPrice, discountRate) gelir; toplam her zaman sunucunun totalAmount değeridir.
 */
export function RentalReceipt({
  rental,
  showCustomer = false,
  animateStamp = true,
}: {
  rental: RentalResponse;
  showCustomer?: boolean;
  animateStamp?: boolean;
}) {
  const days = contractDays({
    dailyPrice: rental.dailyPrice,
    discountRate: rental.discountRate,
    totalAmount: rental.totalAmount,
    fallbackDays: rentalDaysBetween(rental.rentalStart, rental.rentalEnd),
  });
  const base = Math.round(rental.dailyPrice * days * 100) / 100;
  const discount = Math.max(0, Math.round((base - rental.totalAmount) * 100) / 100);
  const stamp = rentalStamp(rental);
  const paid = rental.pickedUpAt ? rental.totalAmount : rental.depositAmount;

  return (
    <Receipt
        title="Kiralama sözleşmesi"
        serial={`NO ${rental.id.slice(0, 8).toUpperCase()}`}
        footer={
          rental.replacesRentalId
            ? `Arıza nedeniyle verilen yedek araç kaydı (önceki sözleşme NO ${rental.replacesRentalId.slice(0, 8).toUpperCase()}). Ücret alınmaz.`
            : undefined
        }
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-dashed border-rule pb-4 mb-2">
          <Plate plate={rental.carPlate} size="sm" />
          <span className="font-semibold text-navy">
            {rental.carBrand} {rental.carModel}
          </span>
          <span className="ml-auto pr-1">
            <Stamp label={stamp.label} tone={stamp.tone} note={stamp.note} animate={animateStamp} />
          </span>
        </div>
        {showCustomer ? <ReceiptLine label="Müşteri" value={rental.customerFullName} tone="muted" /> : null}
        <ReceiptLine label="İşlem tarihi" value={formatDateTimeNumeric(rental.transactionDate)} tone="muted" />
        <ReceiptLine label="Başlangıç" value={formatDateTimeNumeric(rental.rentalStart)} tone="muted" />
        <ReceiptLine label={rental.status === "COMPLETED" ? "İade" : "Bitiş"} value={formatDateTimeNumeric(rental.rentalEnd)} tone="muted" />
        {rental.pickedUpAt ? <ReceiptLine label="Teslim alındı" value={formatDateTimeNumeric(rental.pickedUpAt)} tone="muted" /> : null}
        <div className="my-2 border-t border-dashed border-rule" />
        <ReceiptLine label={`Günlük ${formatTL(rental.dailyPrice)} × ${days} gün`} value={formatTL(base)} />
        <ReceiptLine
          label={`İndirim (${formatPercent(rental.discountRate)})`}
          value={discount > 0 ? `−${formatTL(discount)}` : formatTL(0)}
          tone={discount > 0 ? "credit" : "default"}
        />
        <ReceiptTotal label="Toplam" value={formatTL(rental.totalAmount)} />
        <div className="mt-3">
          <ReceiptLine label={rental.pickedUpAt ? "Ödenen (ön ödeme + teslim)" : "Ödenen ön ödeme"} value={formatTL(paid)} />
          {rental.status === "PENDING" && !rental.pickedUpAt ? (
            <ReceiptLine label="Teslimde ödenecek" value={formatTL(rental.totalAmount - rental.depositAmount)} tone="muted" />
          ) : null}
          {rental.refundedAmount > 0 ? <ReceiptLine label="İade edilen" value={formatTL(rental.refundedAmount)} tone="credit" /> : null}
          {rental.cancellationReason ? (
            <ReceiptLine label="Kapanış sebebi" value={CANCELLATION_REASON_LABELS[rental.cancellationReason]} tone="muted" />
          ) : null}
        </div>
    </Receipt>
  );
}
