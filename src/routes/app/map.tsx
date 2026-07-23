import { createFileRoute } from "@tanstack/react-router";

import { MapFullPage } from "@/pages/map-full";

export const Route = createFileRoute("/app/map")({
  component: MapFullPage,
});
