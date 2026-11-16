"use client";

import { buildQuery, createApi, type RequestOptions } from "./endpoints";
import { ApiError, readBody, readProblem } from "./errors";
import type { CurrentUser, LoginRequest } from "./types";
import { toBrowserPath } from "./urls";

/** Oturum düşünce (401) girişe yönlendir; giriş sonrası kullanıcı kaldığı sayfaya döner. */
export function redirectToLogin(reason: "expired" | "required" = "expired") {
  const next = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams({ next });
  if (reason === "expired") params.set("sure", "doldu");
  // Tam sayfa yükleme: istemcideki eski oturum durumu temizlensin
  window.location.assign(new URL(`/giris?${params.toString()}`, window.location.origin).href);
}

/**
 * Tarayıcı taşıyıcısı: istekler aynı kökenden /api/backend/* route handler'ına gider, o da token'ı
 * httpOnly cookie'den alıp backend'e iletir. Tarayıcı token'ı hiç görmez.
 */
async function clientRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ accept: "application/json" });
  let body: BodyInit | undefined;
  if (options.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.json);
  } else if (options.form) {
    body = options.form; // content-type'ı (boundary ile) tarayıcı koyar
  }

  let response: Response;
  try {
    response = await fetch(`${toBrowserPath(path)}${buildQuery(options.query)}`, {
      method: options.method ?? "GET",
      headers,
      body,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, { title: "Network error" });
  }

  if (response.status === 401 && (options.auth ?? "required") === "required") {
    redirectToLogin("expired");
  }
  if (!response.ok) throw new ApiError(response.status, await readProblem(response));
  return readBody<T>(response);
}

export const clientApi = createApi(clientRequest);

/** Giriş: Next route handler'ı token'ı cookie'ye yazar, tarayıcıya sadece kullanıcı bilgisi döner. */
export async function login(credentials: LoginRequest): Promise<CurrentUser> {
  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(credentials),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, { title: "Network error" });
  }
  if (!response.ok) throw new ApiError(response.status, await readProblem(response));
  const data = (await response.json()) as { user: CurrentUser };
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
}
