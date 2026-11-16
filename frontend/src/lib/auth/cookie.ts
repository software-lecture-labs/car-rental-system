/**
 * Oturum cookie'si. JWT tarayıcıda localStorage'a konmaz; httpOnly cookie'de durur, sayfadaki
 * script'ler okuyamaz. Backend'e giden isteklere Next sunucusu Authorization başlığı olarak ekler.
 */
export const TOKEN_COOKIE = "rc_session";

export interface TokenClaims {
  sub: string;
  role: "ADMIN" | "CUSTOMER";
  email?: string;
  exp: number; // saniye
}

/**
 * JWT gövdesini İMZA DOĞRULAMADAN okur. Sadece proxy.ts'teki iyimser yönlendirme için
 * (süresi geçmiş mi, hangi role ait). Gerçek yetki kontrolü backend'de ve GET /api/auth/me ile yapılır.
 */
export function readTokenClaims(token: string | undefined): TokenClaims | null {
  if (!token) return null;
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const json = JSON.parse(atob(base64)) as Partial<TokenClaims>;
    if (typeof json.sub !== "string" || typeof json.exp !== "number") return null;
    if (json.role !== "ADMIN" && json.role !== "CUSTOMER") return null;
    return json as TokenClaims;
  } catch {
    return null;
  }
}

export function isExpired(claims: TokenClaims, now = Date.now()): boolean {
  return claims.exp * 1000 <= now;
}

/** Secure bayrağı: COOKIE_SECURE verilmişse o, verilmemişse istek HTTPS ise açık. */
export function shouldUseSecureCookie(request: { headers: Headers; nextUrl: URL }): boolean {
  const setting = process.env.COOKIE_SECURE;
  if (setting === "true") return true;
  if (setting === "false") return false;
  const forwarded = request.headers.get("x-forwarded-proto");
  return (forwarded ?? request.nextUrl.protocol.replace(":", "")) === "https";
}

/**
 * Durum değiştiren istekler için kaynak kontrolü (CSRF'e karşı, SameSite=Lax'a ek olarak).
 * Origin başlığı varsa ve başka bir siteyi gösteriyorsa reddeder.
 */
export function isSameOriginRequest(request: { method: string; headers: Headers }): boolean {
  if (request.method === "GET" || request.method === "HEAD") return true;
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
