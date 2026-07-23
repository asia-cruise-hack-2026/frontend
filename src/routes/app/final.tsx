import { createFileRoute } from "@tanstack/react-router";

import { FinalRoutePage } from "@/pages/final-route";

export const Route = createFileRoute("/app/final")({
  component: FinalRoutePage,
});
