import { createFileRoute } from "@tanstack/react-router";

import { ProductDetailScreen } from "@/pages/product";

export const Route = createFileRoute("/app/product/$productId")({
  component: ProductDetailRoute,
});

function ProductDetailRoute() {
  const { productId } = Route.useParams();
  return <ProductDetailScreen productId={productId} />;
}
