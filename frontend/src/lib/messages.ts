import { ApiError, isApiError } from "@/lib/api/errors";

/**
 * Backend'in mesajları Türkçe-İngilizce karışık; ham mesaj ekrana basılmaz.
 * Mesaj, durum koduna ve bağlama göre burada Türkçe üretilir.
 *
 * Backend 409 cevaplarında hata kodu taşımıyor (hepsi "Business rule violation"), bu yüzden bazı durumları
 * ayırt etmek için İngilizce detail metnine bakmak zorundayız. Eşleştirmeler sadece bu dosyada.
 */

export type ErrorContext =
  | "load"
  | "login"
  | "register"
  | "profile"
  | "balance"
  | "reservation"
  | "cancel"
  | "car-save"
  | "car-delete"
  | "car-status"
  | "images"
  | "pricing"
  | "customer-delete"
  | "customer-search"
  | "rental-action";

/** 409 durumlarının sınıflandırması: arayüz akışı bunlara göre dallanır (ör. bakiye yetersizse yüklemeye yönlendir). */
export type ConflictKind =
  | "insufficient-balance"
  | "car-booked"
  | "car-maintenance"
  | "duplicate"
  | "in-use"
  | "image-limit"
  | "other";

// [backend detail içinde geçen parça, sınıf, Türkçe mesaj]
const KNOWN_DETAILS: ReadonlyArray<[string, ConflictKind, string]> = [
  ["Insufficient balance", "insufficient-balance", "Bakiye yetersiz."],
  ["already booked for the selected dates", "car-booked", "Araç seçtiğin tarihlerde dolu."],
  ["already rented for the selected dates", "car-booked", "Araç seçtiğin tarihlerde dolu."],
  ["selected car is under maintenance", "car-maintenance", "Araç şu an bakımda, rezervasyona kapalı."],
  ["The car is under maintenance", "car-maintenance", "Araç bakımda."],
  ["user with this email already exists", "duplicate", "Bu e-posta adresiyle kayıtlı bir hesap zaten var."],
  ["is already registered", "duplicate", "Bu plakayla kayıtlı bir araç zaten var."],
  ["same unique value already exists", "duplicate", "Bu bilgilerle kayıtlı bir kayıt zaten var."],
  ["other records refer to it", "in-use", "Bu kayda bağlı kiralama kayıtları olduğu için silinemiyor."],
  ["at most 10 images", "image-limit", "Bir araçta en fazla 10 görsel olabilir."],
  ["rented car cannot be deleted", "other", "Kiradaki araç silinemez; önce iade edilmesi gerekiyor."],
  ["Only an available car can be put into maintenance", "other", "Sadece müsait bir araç bakıma alınabilir."],
  ["Car is not in maintenance", "other", "Araç zaten bakımda değil."],
  ["Only a pending rental can be picked up", "other", "Sadece açık bir rezervasyon teslim edilebilir."],
  ["already been picked up", "other", "Bu kiralamada araç zaten teslim edilmiş."],
  ["on or after the rental start date", "other", "Araç, kiralamanın başladığı günden önce teslim edilemez."],
  ["pickup time for this reservation has expired", "other", "Teslim alma süresi dolmuş (başlangıçtan sonraki 4 saat)."],
  ["not been returned from a previous rental", "other", "Araç önceki kiralamadan henüz dönmedi."],
  ["already completed or cancelled", "other", "Bu kiralama zaten kapanmış."],
  ["has not been picked up for this rental", "other", "Araç henüz teslim edilmemiş."],
  ["Only a reservation that has not been picked up can be cancelled", "other", "Sadece teslim alınmamış açık bir rezervasyon iptal edilebilir."],
  ["Only an active rental can be rolled back", "other", "Sadece açık bir kiralama geri alınabilir."],
  ["breakdown can only be reported", "other", "Arıza sadece teslim edilmiş araç için bildirilebilir."],
  ["replacement car is not available", "other", "Seçilen yedek araç müsait değil."],
  ["replacement car is already booked", "other", "Yedek araç kalan günlerde dolu."],
  ["no remaining rental days to replace", "other", "Kiralamanın kalan günü yok; yedek araç verilemez."],
  ["Each image must be at most 5 MB", "other", "Her görsel en fazla 5 MB olabilir."],
  ["Only JPEG, PNG and WebP", "other", "Sadece JPEG, PNG ve WebP görseller yüklenebilir."],
  ["is empty", "other", "Boş bir dosya seçildi."],
];

function match(error: ApiError): [ConflictKind, string] | null {
  const detail = error.detail;
  const title = error.problem.title ?? "";
  if (title === "Car already booked") return ["car-booked", "Araç seçtiğin tarihlerde dolu."];
  for (const [needle, kind, text] of KNOWN_DETAILS) {
    if (detail.includes(needle)) return [kind, text];
  }
  return null;
}

export function conflictKind(error: unknown): ConflictKind | null {
  if (!isApiError(error) || error.status !== 409) return null;
  return match(error)?.[0] ?? "other";
}

const NOT_FOUND: Partial<Record<ErrorContext, string>> = {
  reservation: "Araç ya da hesap bulunamadı.",
  cancel: "Kiralama kaydı bulunamadı.",
  "rental-action": "Kiralama kaydı bulunamadı.",
  "car-save": "Araç bulunamadı.",
  "car-delete": "Araç bulunamadı; başka biri silmiş olabilir.",
  "car-status": "Araç bulunamadı.",
  images: "Araç ya da görsel bulunamadı.",
  pricing: "Fiyat kademesi bulunamadı.",
  "customer-delete": "Müşteri bulunamadı.",
  "customer-search": "Bu bilgilerle kayıtlı müşteri yok.",
};

export function errorMessage(error: unknown, context: ErrorContext): string {
  if (!isApiError(error)) return "Beklenmeyen bir hata oluştu. Sayfayı yenileyip tekrar dene.";

  const known = match(error);
  switch (error.status) {
    case 0:
    case 502:
    case 503:
    case 504:
      return "Sunucuya ulaşılamadı. Bağlantını kontrol edip biraz sonra tekrar dene.";
    case 400:
      if (known) return known[1];
      if (Object.keys(error.fieldErrors).length > 0) return "Bazı alanlar hatalı. İşaretli alanları düzeltip tekrar dene.";
      return context === "pricing"
        ? "İndirim oranı %0 ile %99,99 arasında olmalı."
        : "İstek eksik ya da hatalı. Zorunlu alanları kontrol et.";
    case 401:
      return context === "login" ? "E-posta ya da şifre hatalı." : "Oturumun sona erdi. Lütfen yeniden giriş yap.";
    case 403:
      return "Bu işlem için yetkin yok.";
    case 404:
      return NOT_FOUND[context] ?? "Kayıt bulunamadı.";
    case 409:
      if (known) return known[1];
      return context === "customer-delete"
        ? "Bu müşterinin kiralama kayıtları olduğu için silinemiyor."
        : "İşlem mevcut kayıtlarla çakışıyor. Sayfayı yenileyip tekrar dene.";
    case 413:
      return "Dosyalar çok büyük. Her görsel en fazla 5 MB, tek seferde toplam 55 MB yüklenebilir.";
    default:
      return "Sunucuda beklenmeyen bir hata oluştu. Biraz sonra tekrar dene.";
  }
}

/**
 * Backend'in alan hatalarını (ProblemDetail.errors) bizim Türkçe alan mesajlarımıza çevirir.
 * Backend'in mesajını değil, hangi alanın hatalı olduğunu kullanır.
 */
export function fieldErrorsFrom(error: unknown, messages: Record<string, string>): Record<string, string> {
  if (!isApiError(error)) return {};
  const result: Record<string, string> = {};
  for (const field of Object.keys(error.fieldErrors)) {
    result[field] = messages[field] ?? "Bu alan hatalı.";
  }
  return result;
}
