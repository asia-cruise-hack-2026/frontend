import { createFileRoute } from "@tanstack/react-router";

import { PayDemoEntry } from "@/pages/checkout";

export const Route = createFileRoute("/pay-demo")({
  component: PayDemoEntry,
});
