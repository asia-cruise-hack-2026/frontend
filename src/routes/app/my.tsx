import { createFileRoute } from "@tanstack/react-router";

import { MyPage } from "@/pages/my";

export const Route = createFileRoute("/app/my")({
  component: MyPage,
});
