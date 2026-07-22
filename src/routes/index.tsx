import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <div style={{ padding: 24, fontFamily: "sans-serif" }}>TAMRA PASS — scaffold OK</div>;
}
