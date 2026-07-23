import type { Product } from "@/entities/product";

export type ImportStatus = "allowed" | "restricted";

export interface CartItem {
  id: string;
  thumbnail: string;
  name: string;
  meta: string; // 카테고리 라벨 (요청 언어로 해석됨)
  price: number;
  qty: number;
  importStatus: ImportStatus;
}

/** useCart(store)가 들고 있는 상품 id로 getGood 조회한 Product를 체크아웃 렌더용 CartItem으로 변환. */
export const productToCartItem = (product: Product): CartItem => ({
  id: product.id,
  thumbnail: product.thumbnail,
  name: product.name,
  meta: product.categoryLabel,
  price: product.price,
  qty: 1,
  importStatus: product.importStatus === "allowed" ? "allowed" : "restricted",
});

export const cartTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0);

export const hasRestricted = (items: CartItem[]): boolean =>
  items.some((item) => item.importStatus === "restricted");
