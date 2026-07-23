// 얇은 API 클라이언트 — 기본 /api/v1 (dev: vite proxy, VM 배포: nginx /api/ 프록시).
// 프록시 없는 정적 호스트(surge 등) 배포는 VITE_API_BASE 로 Cloud Run 절대주소 주입(CORS 허용됨).
const BASE: string = import.meta.env.VITE_API_BASE ?? "/api/v1";

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
