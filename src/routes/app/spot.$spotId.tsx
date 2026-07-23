import { createFileRoute } from "@tanstack/react-router";

import { SpotDetailScreen } from "@/pages/spot-detail";

export const Route = createFileRoute("/app/spot/$spotId")({
  component: SpotDetailRoute,
});

function SpotDetailRoute() {
  const { spotId } = Route.useParams();
  return <SpotDetailScreen spotId={spotId} />;
}
