import type { Product } from "@/entities/product";
import { strings, type Locale } from "@/shared/i18n";

export type ImportStatus = "allowed" | "restricted";

export interface CartItem {
  id: string;
  emoji: string;
  name: Record<Locale, string>;
  meta: Record<Locale, string>;
  price: number;
  qty: number;
  importStatus: ImportStatus;
}

// 카테고리별 대표 이모지 — Product에는 개별 emoji가 없어 체크아웃 카드 표시용으로 근사한다.
const CART_EMOJI: Record<Product["cat"], string> = {
  food: "🍊",
  cosmetics: "💄",
  alcohol: "🍺",
  souvenir: "🎁",
};

/** useCart(store)가 들고 있는 상품 id로 getGood 조회한 Product를 체크아웃 렌더용 CartItem으로 변환. */
export const productToCartItem = (product: Product): CartItem => ({
  id: product.id,
  emoji: CART_EMOJI[product.cat],
  name: product.name,
  meta: strings[`cat_${product.cat}`],
  price: product.price,
  qty: 1,
  importStatus: product.status === "allowed" ? "allowed" : "restricted",
});

export const cartTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0);

export const hasRestricted = (items: CartItem[]): boolean =>
  items.some((item) => item.importStatus === "restricted");
