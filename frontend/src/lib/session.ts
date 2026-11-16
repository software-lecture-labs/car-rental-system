import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { serverApi } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import type { CurrentUser, Role } from "@/lib/api/types";
import { TOKEN_COOKIE } from "@/lib/auth/cookie";

/**
 * Giriş yapmış kullanıcı. Rol bilgisi her zaman GET /api/auth/me'den gelir (token'daki claim'e güvenilmez).
 * Aynı istek içinde bir kez çağrılır (React cache).
 */
export const getSessionUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    return await serverApi.auth.me();
  } catch (error) {
    // 401: token geçersiz/süresi dolmuş. 404: kullanıcı silinmiş.
    if (isApiError(error) && (error.status === 401 || error.status === 404)) return null;
    throw error;
  }
});

/** proxy.ts'in koyduğu x-rc-path: girişten sonra dönülecek adres */
export async function currentPath(): Promise<string> {
  return (await headers()).get("x-rc-path") ?? "/";
}

/** Rol şartı: giriş yoksa girişe, yanlış roldeyse kendi bölümüne yönlendirir. */
export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await getSessionUser();
  if (!user) {
    const hadToken = Boolean((await cookies()).get(TOKEN_COOKIE)?.value);
    const params = new URLSearchParams({ next: await currentPath() });
    if (hadToken) params.set("sure", "doldu");
    redirect(`/giris?${params.toString()}`);
  }
  if (user.role !== role) redirect(user.role === "ADMIN" ? "/admin" : "/hesabim");
  return user;
}

/** Güvenli "kaldığın yere dön": sadece site içi yollar. */
export function safeNextPath(value: string | string[] | undefined, fallback: string): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
