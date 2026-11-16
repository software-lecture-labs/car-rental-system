/**
 * Tarayıcı backend'e doğrudan gitmez; her şey Next'teki /api/backend/* route handler'ından geçer.
 * Backend yolu "/api/cars/..." → tarayıcı yolu "/api/backend/cars/...".
 */
export const BROWSER_API_PREFIX = "/api/backend";

export function toBrowserPath(backendPath: string): string {
  if (!backendPath.startsWith("/api/")) throw new Error(`Beklenmeyen backend yolu: ${backendPath}`);
  return `${BROWSER_API_PREFIX}${backendPath.slice("/api".length)}`;
}

/** Kapak görseli: araç cevabında görsel alanı yok, sabit adres kullanılır (yoksa 404). */
export function coverImageUrl(carId: string): string {
  return toBrowserPath(`/api/cars/${encodeURIComponent(carId)}/images/cover`);
}
