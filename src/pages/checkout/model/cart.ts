import type { Locale } from "@/shared/i18n";

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

/**
 * 데모용 mock 장바구니.
 * backend goods(탐나오 특산품)·partners(미니밴) 데이터에 근거한 샘플 구성이며,
 * 실제 서버 연동 대신 화면이 "동작하는 것처럼" 보이게 하기 위한 고정 데이터다.
 */
export const MOCK_CART: CartItem[] = [
  {
    id: "SV00002777",
    emoji: "🍫",
    name: {
      ko: "제주 감귤 초콜릿",
      en: "Jeju Tangerine Chocolate",
      zh: "济州柑橘巧克力",
      ja: "済州みかんチョコ",
    },
    meta: {
      ko: "간식 · 수량 2",
      en: "Snack · Qty 2",
      zh: "零食 · 数量 2",
      ja: "お菓子 · 数量 2",
    },
    price: 12000,
    qty: 2,
    importStatus: "allowed",
  },
  {
    id: "van-half",
    emoji: "🚐",
    name: {
      ko: "미니밴 반나절 패키지",
      en: "Minivan Half-day Package",
      zh: "商务车半日套餐",
      ja: "ミニバン半日パッケージ",
    },
    meta: {
      ko: "성산일출봉 코스 · 김성호 기사",
      en: "Seongsan course · Driver Kim",
      zh: "城山日出峰路线 · 金司机",
      ja: "城山日出峰コース · キム運転手",
    },
    price: 120000,
    qty: 1,
    importStatus: "allowed",
  },
  {
    id: "hallabong-set",
    emoji: "🍊",
    name: {
      ko: "한라봉 선물세트",
      en: "Hallabong Gift Set",
      zh: "汉拿峰礼盒",
      ja: "ハラボン ギフトセット",
    },
    meta: {
      ko: "과일 · 수량 1",
      en: "Fruit · Qty 1",
      zh: "水果 · 数量 1",
      ja: "果物 · 数量 1",
    },
    price: 19000,
    qty: 1,
    importStatus: "restricted",
  },
];

export const cartTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0);

export const hasRestricted = (items: CartItem[]): boolean =>
  items.some((item) => item.importStatus === "restricted");
