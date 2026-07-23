// 얇은 API 클라이언트 — base /api/v1 (dev: vite proxy, 배포: nginx /api/ 프록시)
const BASE = "/api/v1";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

export async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // JSON 아님 — 상태코드만으로 에러 구성
    }
    throw new ApiError(
      res.status,
      body.error?.code ?? "UNKNOWN",
      body.error?.message ?? `HTTP ${res.status}`,
    );
  }
  return (await res.json()) as T;
}
