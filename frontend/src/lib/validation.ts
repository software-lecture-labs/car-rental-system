/**
 * İstemci tarafı doğrulama. Backend kurallarıyla aynı sınırlar (DTO'lardaki @Size, @Min, @Max, @Pattern),
 * ama eksik sayı alanlarında backend anlamsız bir hata döndüğü için zorunlu alanların hepsini burada da denetliyoruz.
 */

export type Errors<K extends string> = Partial<Record<K, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function currentYear(): number {
  return new Date().getFullYear();
}

export function requireText(value: string, label: string, max: number): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} boş bırakılamaz.`;
  if (trimmed.length > max) return `${label} en fazla ${max} karakter olabilir.`;
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "E-posta boş bırakılamaz.";
  if (trimmed.length > 255 || !EMAIL.test(trimmed)) return "Geçerli bir e-posta adresi yaz (ör. ad@ornek.com).";
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "Şifre boş bırakılamaz.";
  if (value.length < 8) return "Şifre en az 8 karakter olmalı.";
  if (value.length > 72) return "Şifre en fazla 72 karakter olabilir.";
  return undefined;
}

/** Tam sayı alanı: boş, ondalıklı ya da sınır dışıysa mesaj döner. */
export function validateInteger(raw: string, label: string, min: number, max: number): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return `${label} boş bırakılamaz.`;
  if (!/^\d+$/.test(trimmed)) return `${label} tam sayı olmalı.`;
  const value = Number(trimmed);
  if (value < min || value > max) return `${label} ${min} ile ${max} arasında olmalı.`;
  return undefined;
}

export function validateLicenseYear(raw: string): string | undefined {
  return validateInteger(raw, "Ehliyet yılı", 1950, currentYear());
}

/**
 * Para tutarı: "1250", "1250,5", "1.250,50" ya da "1250.50" kabul edilir. Kuruş hassasiyetinde
 * sayıya ve backend'e gönderilecek "1250.50" biçimine çevirir.
 */
export function parseMoney(raw: string): { value: number; text: string } | null {
  let s = raw.trim().replace(/\s|₺|TL/gi, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, fraction = ""] = s.split(".");
  const text = `${BigInt(whole)}.${fraction.padEnd(2, "0")}`;
  return { value: Number(text), text };
}

export function validateMoney(raw: string, label: string, { max }: { max: number }): string | undefined {
  if (!raw.trim()) return `${label} boş bırakılamaz.`;
  const parsed = parseMoney(raw);
  if (!parsed) return `${label} geçerli bir tutar olmalı (en fazla 2 ondalık, ör. 1250,50).`;
  if (parsed.value <= 0) return `${label} sıfırdan büyük olmalı.`;
  if (parsed.value > max) return `${label} en fazla ${new Intl.NumberFormat("tr-TR").format(max)} TL olabilir.`;
  return undefined;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
