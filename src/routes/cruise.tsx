import { createFileRoute } from "@tanstack/react-router";

import { CruiseSelectPage } from "@/pages/cruise-select";

export const Route = createFileRoute("/cruise")({
  component: CruiseSelectPage,
});
