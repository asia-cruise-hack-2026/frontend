import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/explore")({
  component: () => <div style={{ padding: 24 }}>탐방 (S2 예정)</div>,
});
