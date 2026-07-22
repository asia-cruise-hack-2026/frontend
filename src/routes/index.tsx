import { createFileRoute } from "@tanstack/react-router";

import { LangSelectPage } from "@/pages/lang-select";

export const Route = createFileRoute("/")({
  component: LangSelectPage,
});
