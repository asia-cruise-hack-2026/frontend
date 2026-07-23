import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/move")({
  component: () => <div style={{ padding: 24 }}>이동 (S4 예정)</div>,
});
