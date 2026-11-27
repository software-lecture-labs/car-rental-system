/**
 * Backend DTO'larının birebir karşılığı. Kaynak: backend/src/main/java/com/rentacar/rentalsystem/**
 * (feature/profile-car-update ve feature/car-images dalları dahil).
 *
 * - UUID'ler string.
 * - BigDecimal alanları JSON'da sayı olarak gelir (Jackson varsayılanı).
 * - LocalDateTime saat dilimsiz "2026-11-20T10:00:00"; Instant (expiresAt) "...Z" ile biter.
 */

import type { LocalDateTime } from "@/lib/datetime";

export type UUID = string;
export type { LocalDateTime };

/* ---------- enum'lar ---------- */

export type Role = "ADMIN" | "CUSTOMER";
export type FuelType = "GASOLINE" | "DIESEL" | "ELECTRIC" | "HYBRID";
export type TransmissionType = "MANUAL" | "AUTOMATIC";
export type CarStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE";
export type TransactionStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "ROLLED_BACK";
export type CancellationReason = "CUSTOMER_REQUEST" | "NO_SHOW" | "BREAKDOWN" | "COMPANY_DECISION" | "CUSTOMER_VIOLATION";
export type BreakdownResolution = "REFUND" | "REPLACEMENT";

export const FUEL_TYPES: readonly FuelType[] = ["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID"];
export const TRANSMISSION_TYPES: readonly TransmissionType[] = ["MANUAL", "AUTOMATIC"];
export const TRANSACTION_STATUSES: readonly TransactionStatus[] = ["PENDING", "COMPLETED", "CANCELLED", "ROLLED_BACK"];

/** CarAvailabilityService.SORT_PRICE_ASC / SORT_PRICE_DESC */
export type AvailabilitySort = "price,asc" | "price,desc";

/* ---------- auth ---------- */

/** auth/LoginRequest */
export interface LoginRequest {
  email: string;
  password: string;
}

/** auth/LoginResponse */
export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: string;
  userId: UUID;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

/** auth/CurrentUserResponse (GET /api/auth/me) */
export interface CurrentUser {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

/* ---------- müşteri ---------- */

/** user/CustomerRegisterRequest */
export interface CustomerRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  licenseYear: number;
}

/** user/CustomerUpdateRequest (feature/profile-car-update) */
export interface CustomerUpdateRequest {
  firstName: string;
  lastName: string;
  licenseYear: number;
}

/** user/CustomerResponse */
export interface CustomerResponse {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
  licenseYear: number;
  balance: number;
}

/* ---------- araç ---------- */

/** car/CarRequest (POST /api/cars) */
export interface CarRequest {
  brand: string;
  model: string;
  productionYear: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  color: string;
  plate: string;
  seatCount: number;
  dailyBasePrice: number;
}

/** car/CarUpdateRequest (PUT /api/cars/{id}) — plaka ve durum yok */
export type CarUpdateRequest = Omit<CarRequest, "plate">;

/** car/CarResponse */
export interface CarResponse {
  id: UUID;
  brand: string;
  model: string;
  productionYear: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  color: string;
  plate: string;
  seatCount: number;
  dailyBasePrice: number;
  status: CarStatus;
}

/** car/CarImageResponse (feature/car-images) */
export interface CarImageResponse {
  id: UUID;
  /** "/api/cars/{carId}/images/{imageId}" — backend köküne göre */
  url: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  cover: boolean;
}

/** car/CarImageService sabitleri */
export const MAX_IMAGES_PER_CAR = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** rental/AvailableCarResponse (GET /api/cars/available) */
export interface AvailableCarResponse {
  car: CarResponse;
  rentalDays: number;
  discountRate: number;
  totalAmount: number;
  depositAmount: number;
  amountDueAtPickup: number;
}

/* ---------- fiyatlandırma ---------- */

/** pricing/PricingPolicyResponse */
export interface PricingPolicyResponse {
  id: UUID;
  policyName: string;
  minDays: number;
  discountRate: number;
}

/* ---------- kiralama ---------- */

/** rental/RentalRequest. selectedPackage backend'de var ama kullanılmıyor; kademe otomatik seçilir. */
export interface RentalRequest {
  customerId: UUID;
  carId: UUID;
  startDate: LocalDateTime;
  rentalDays: number;
}

/** rental/RentalResponse */
export interface RentalResponse {
  id: UUID;
  carId: UUID;
  carPlate: string;
  carBrand: string;
  carModel: string;
  customerId: UUID;
  customerFullName: string;
  rentalStart: LocalDateTime;
  rentalEnd: LocalDateTime;
  transactionDate: LocalDateTime;
  dailyPrice: number;
  discountRate: number;
  totalAmount: number;
  depositAmount: number;
  refundedAmount: number;
  pickedUpAt: LocalDateTime | null;
  status: TransactionStatus;
  cancellationReason: CancellationReason | null;
  replacesRentalId: UUID | null;
}

/** rental/RollbackRequest */
export interface RollbackRequest {
  reason: Extract<CancellationReason, "BREAKDOWN" | "COMPANY_DECISION" | "CUSTOMER_VIOLATION">;
  resolution?: BreakdownResolution;
  replacementCarId?: UUID;
}

/* ---------- hata gövdesi ---------- */

/**
 * Spring ProblemDetail (exception/GlobalExceptionHandler, security/SecurityConfig.writeProblem).
 * Doğrulama hatalarında "errors" alanı: { alanAdı: mesaj }.
 */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string>;
}
