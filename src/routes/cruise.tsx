import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cruise")({
  component: CruiseSelectRoute,
});

function CruiseSelectRoute() {
  return <div style={{ padding: 24 }}>크루즈 선택 (구현 예정)</div>;
}
