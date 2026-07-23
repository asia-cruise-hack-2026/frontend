import { createFileRoute } from "@tanstack/react-router";

import { ThemeSelectPage } from "@/pages/theme-select";

export const Route = createFileRoute("/app/theme")({
  component: ThemeSelectPage,
});
