import { createFileRoute } from "@tanstack/react-router";

import { ShopScreen } from "@/pages/shop";

export const Route = createFileRoute("/app/shop")({
  component: ShopScreen,
});
