import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { TOKEN_COOKIE } from "@/lib/auth/cookie";
import { BACKEND_TIMEOUT_MS, backendUrl } from "@/lib/config";
import { buildQuery, createApi, type RequestOptions } from "./endpoints";
import { ApiError, readBody, readProblem } from "./errors";

/**
 * Sunucu bileşenleri için taşıyıcı: backend'e doğrudan (BACKEND_URL) gider, token'ı cookie'den alıp
 * Authorization başlığına koyar. Sonuçlar önbelleğe alınmaz; Cache Components'te bu çağrıları yapan
 * bileşenler <Suspense> içinde durur.
 */
async function serverRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ accept: "application/json" });

  if (options.auth !== "none") {
    const token = (await cookies()).get(TOKEN_COOKIE)?.value;
    if (token) headers.set("authorization", `Bearer ${token}`);
  } else {
    // Herkese açık veriler de istek anında çekilir (prerender'a gömülmez); zaman aşımı sayacı bundan sonra kurulur.
    await connection();
  }

  let body: BodyInit | undefined;
  if (options.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.json);
  } else if (options.form) {
    body = options.form;
  }

  let response: Response;
  try {
    response = await fetch(`${backendUrl()}${path}${buildQuery(options.query)}`, {
      method: options.method ?? "GET",
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
  } catch (cause) {
    console.error(`[api] ${path} isteği backend'e ulaşamadı`, cause);
    throw new ApiError(0, { title: "Backend unreachable" });
  }

  if (!response.ok) throw new ApiError(response.status, await readProblem(response));
  return readBody<T>(response);
}

export const serverApi = createApi(serverRequest);
