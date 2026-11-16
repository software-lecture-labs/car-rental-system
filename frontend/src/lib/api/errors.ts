import type { ProblemDetail } from "./types";

/**
 * API'den dönen hata. status 0 = sunucuya hiç ulaşılamadı.
 * Ham backend mesajı (problem.detail) ekrana basılmaz; Türkçe karşılığı lib/messages.ts'de üretilir.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetail;

  constructor(status: number, problem: ProblemDetail = {}) {
    super(`API ${status}: ${problem.title ?? "error"}${problem.detail ? ` – ${problem.detail}` : ""}`);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }

  get detail(): string {
    return this.problem.detail ?? "";
  }

  get fieldErrors(): Record<string, string> {
    return this.problem.errors ?? {};
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Hata gövdesini ProblemDetail olarak okumaya çalışır; JSON değilse boş döner. */
export async function readProblem(response: Response): Promise<ProblemDetail> {
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("json")) return { status: response.status };
  try {
    const body = (await response.json()) as unknown;
    return body && typeof body === "object" ? (body as ProblemDetail) : { status: response.status };
  } catch {
    return { status: response.status };
  }
}

/** Başarılı cevabı içerik türüne göre çözer: 204 → undefined, JSON → nesne, diğerleri → metin. */
export async function readBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("json")) return (await response.json()) as T;
  return (await response.text()) as T;
}
