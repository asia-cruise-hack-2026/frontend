import { createFileRoute } from "@tanstack/react-router";

import { ExploreScreen } from "@/pages/explore";

export const Route = createFileRoute("/app/explore")({
  component: ExploreScreen,
});
