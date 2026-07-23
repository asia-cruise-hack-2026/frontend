import { createFileRoute } from "@tanstack/react-router";

import { MovePage } from "@/pages/move";

export const Route = createFileRoute("/app/move")({
  component: MovePage,
});
