import "server-only";

/** Backend adresi ortam değişkeninden gelir (bkz. .env.example). Sadece sunucuda okunur. */
export function backendUrl(): string {
  const value = process.env.BACKEND_URL;
  if (!value) {
    throw new Error("BACKEND_URL tanımlı değil. frontend/.env.example dosyasını .env.local olarak kopyala.");
  }
  return value.replace(/\/+$/, "");
}

/** Sunucudan backend'e giden isteklerin zaman aşımı */
export const BACKEND_TIMEOUT_MS = 15_000;
