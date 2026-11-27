import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginRequest, shouldUseSecureCookie, TOKEN_COOKIE } from "@/lib/auth/cookie";
import { BACKEND_TIMEOUT_MS, backendUrl } from "@/lib/config";
import type { CurrentUser, LoginResponse } from "@/lib/api/types";

/**
 * Giriş Next üzerinden yapılır: backend'in verdiği JWT httpOnly cookie'ye yazılır,
 * tarayıcıya sadece kullanıcı bilgisi döner. Token hiçbir zaman sayfadaki script'lere ulaşmaz.
 */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ title: "Forbidden", status: 403 }, { status: 403 });
  }

  let credentials: { email?: unknown; password?: unknown };
  try {
    credentials = (await request.json()) as typeof credentials;
  } catch {
    return NextResponse.json({ title: "Invalid request", status: 400 }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${backendUrl()}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      cache: "no-store",
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json({ title: "Bad gateway", status: 502 }, { status: 502 });
  }

  if (!upstream.ok) {
    // ProblemDetail gövdesini olduğu gibi ilet; Türkçe mesajı arayüz üretir.
    const body = await upstream.text();
    return new NextResponse(body || null, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/problem+json" },
    });
  }

  const data = (await upstream.json()) as LoginResponse;
  const user: CurrentUser = {
    id: data.userId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
  };

  const response = NextResponse.json({ user });
  const expires = new Date(data.expiresAt);
  response.cookies.set(TOKEN_COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    expires: Number.isNaN(expires.getTime()) ? undefined : expires,
  });
  return response;
}
