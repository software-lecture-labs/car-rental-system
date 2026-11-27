import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginRequest, TOKEN_COOKIE } from "@/lib/auth/cookie";
import { backendUrl } from "@/lib/config";

/**
 * Tarayıcıdan backend'e giden bütün istekler buradan geçer (BFF):
 * - token httpOnly cookie'den okunup Authorization başlığına eklenir,
 * - backend'in CORS ayarına bağımlı kalınmaz (istek aynı kökenden gelir),
 * - gövde tamponlanmadan akış olarak iletilir; çoklu görsel yüklemesi (toplam 55 MB'a kadar) sorunsuz geçer.
 *   Bu yüzden proxy.ts /api/* yollarında çalışmıyor: proxy gövdeyi varsayılan olarak 10 MB'ta keser.
 */

type Context = { params: Promise<{ path: string[] }> };

const REQUEST_HEADERS = ["accept", "content-type", "if-none-match", "if-modified-since"];
// content-length / content-encoding iletilmez: fetch gövdeyi açabilir, uzunluk değişebilir.
const RESPONSE_HEADERS = ["content-type", "cache-control", "etag", "last-modified", "expires"];

function problem(status: number, title: string, detail: string) {
  return NextResponse.json({ title, status, detail }, { status, headers: { "content-type": "application/problem+json" } });
}

async function forward(request: NextRequest, { params }: Context): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return problem(403, "Forbidden", "Cross-site request rejected.");
  }

  const { path } = await params;
  if (path.some((part) => part === "" || part === "." || part === "..")) {
    return problem(400, "Invalid request", "Invalid path.");
  }

  const target = new URL(`/api/${path.map(encodeURIComponent).join("/")}`, backendUrl());
  target.search = request.nextUrl.search;

  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (token) headers.set("authorization", `Bearer ${token}`);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // akış hâlinde gövde göndermek için gerekli (Node fetch)
      duplex: hasBody ? "half" : undefined,
      redirect: "manual",
      cache: "no-store",
      signal: request.signal,
    } as RequestInit & { duplex?: "half" });
  } catch (cause) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error(`[backend-proxy] ${request.method} ${target.pathname} başarısız`, cause);
    return problem(502, "Bad gateway", "Backend is unreachable.");
  }

  const responseHeaders = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const noBody = upstream.status === 204 || upstream.status === 304 || request.method === "HEAD";
  const response = new NextResponse(noBody ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });

  // Token süresi dolmuş ya da geçersiz: cookie'yi temizle, tarayıcı girişe yönlendirir.
  if (upstream.status === 401 && token) response.cookies.delete(TOKEN_COOKIE);
  return response;
}

export { forward as DELETE, forward as GET, forward as POST, forward as PUT };
