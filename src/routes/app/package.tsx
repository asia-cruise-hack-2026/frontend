import { createFileRoute } from "@tanstack/react-router";

import { AiPackagePage } from "@/pages/ai-package";

export const Route = createFileRoute("/app/package")({
  // 진입 출처(디자인 pkgBack) — home(요약 재방문)·picker(수동 선택)는 AI 로딩 연출 생략
  validateSearch: (search: Record<string, unknown>): { from?: "home" | "picker" } => ({
    from: search.from === "home" || search.from === "picker" ? search.from : undefined,
  }),
  component: AiPackagePage,
});
