import type { StampTone } from "@/components/doc/Stamp";
import type {
  CancellationReason,
  CarStatus,
  FuelType,
  RentalResponse,
  TransactionStatus,
  TransmissionType,
} from "@/lib/api/types";

export const FUEL_LABELS: Record<FuelType, string> = {
  GASOLINE: "Benzin",
  DIESEL: "Dizel",
  ELECTRIC: "Elektrik",
  HYBRID: "Hibrit",
};

export const TRANSMISSION_LABELS: Record<TransmissionType, string> = {
  MANUAL: "Manuel",
  AUTOMATIC: "Otomatik",
};

export const CAR_STATUS_LABELS: Record<CarStatus, string> = {
  AVAILABLE: "Müsait",
  RENTED: "Kirada",
  MAINTENANCE: "Bakımda",
};

export const CAR_STATUS_TONES: Record<CarStatus, StampTone> = {
  AVAILABLE: "ok",
  RENTED: "navy",
  MAINTENANCE: "warn",
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING: "Açık",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal edildi",
  ROLLED_BACK: "Geri alındı",
};

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  CUSTOMER_REQUEST: "Müşteri isteği",
  NO_SHOW: "Teslim alınmadı",
  BREAKDOWN: "Arıza",
  COMPANY_DECISION: "Şirket kararı",
  CUSTOMER_VIOLATION: "Kural ihlali",
};

/** Kiralama damgası: durum + teslim bilgisi birlikte okunur. */
export function rentalStamp(rental: Pick<RentalResponse, "status" | "pickedUpAt" | "cancellationReason">): {
  label: string;
  tone: StampTone;
  note?: string;
} {
  const reason = rental.cancellationReason ? CANCELLATION_REASON_LABELS[rental.cancellationReason] : undefined;
  switch (rental.status) {
    case "PENDING":
      return rental.pickedUpAt ? { label: "Kirada", tone: "navy" } : { label: "Rezerve", tone: "navy" };
    case "COMPLETED":
      return { label: "Tamamlandı", tone: "ok" };
    case "CANCELLED":
      return { label: "İptal", tone: "err", note: reason };
    case "ROLLED_BACK":
      return { label: "Geri alındı", tone: "warn", note: reason };
  }
}
