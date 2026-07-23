import { createFileRoute } from "@tanstack/react-router";

import { AiConceptPage } from "@/pages/ai-concept";

export const Route = createFileRoute("/app/concept")({
  component: AiConceptPage,
});
