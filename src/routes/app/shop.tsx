import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/shop")({
  component: () => <div style={{ padding: 24 }}>쇼핑 (S5 예정)</div>,
});
