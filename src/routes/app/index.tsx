import { createFileRoute } from "@tanstack/react-router";

// 홈 자리 — S1 Task 5에서 HomePage로 교체.
export const Route = createFileRoute("/app/")({
  component: () => <div style={{ padding: 24 }}>홈 (구현 예정)</div>,
});
