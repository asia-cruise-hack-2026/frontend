import { createFileRoute } from "@tanstack/react-router";

import { TransportSelectPage } from "@/pages/transport-select";

export const Route = createFileRoute("/app/transport")({
  component: TransportSelectPage,
});
