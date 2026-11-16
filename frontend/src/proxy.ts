import { NextResponse, type NextRequest } from "next/server";
import { isExpired, readTokenClaims, TOKEN_COOKIE } from "@/lib/auth/cookie";

/**
 * İyimser yönlendirme (Next 16'da middleware.ts yerine proxy.ts):
 * - /hesabim ve /admin için cookie yoksa ya da token'ın süresi geçmişse girişe yönlendirir,
 * - token'daki role göre yanlış bölüme gireni doğru bölüme gönderir.
 * Asıl yetki kontrolü bölüm layout'larında GET /api/auth/me ile ve backend'de yapılır.
 * Sunucu bileşenlerinin "kaldığın yere dön" adresini bilmesi için yolu x-rc-path başlığına koyar.
 *
 * /api/* yollarında çalışmaz: proxy istek gövdesini tamponlar (varsayılan 10 MB sınır),
 * görsel yüklemeleri bozulurdu.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const isAccount = pathname === "/hesabim" || pathname.startsWith("/hesabim/");
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAccount || isAdmin) {
    const claims = readTokenClaims(token);
    if (!claims || isExpired(claims)) {
      const login = new URL("/giris", request.url);
      login.searchParams.set("next", `${pathname}${search}`);
      if (token) login.searchParams.set("sure", "doldu");
      const redirect = NextResponse.redirect(login);
      if (token) redirect.cookies.delete(TOKEN_COOKIE);
      return redirect;
    }
    if (isAdmin && claims.role !== "ADMIN") return NextResponse.redirect(new URL("/hesabim", request.url));
    if (isAccount && claims.role === "ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
  }

  const headers = new Headers(request.headers);
  headers.set("x-rc-path", `${pathname}${search}`);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
