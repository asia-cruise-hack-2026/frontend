import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/my")({
  component: () => <div style={{ padding: 24 }}>마이 (S6 예정)</div>,
});
