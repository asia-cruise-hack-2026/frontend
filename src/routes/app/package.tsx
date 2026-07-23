import { createFileRoute } from "@tanstack/react-router";

import { AiPackagePage } from "@/pages/ai-package";

export const Route = createFileRoute("/app/package")({
  component: AiPackagePage,
});
