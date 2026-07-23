import type { Locale } from "@/shared/i18n";

/** 승객 세그먼트 — 앱 언어로 근사한다(중국어=중국 모항 주력, 그 외=글로벌/서구·일). */
export type Segment = "china" | "global";

export type MethodId = "alipay" | "wechat" | "unionpay" | "card" | "applepay" | "googlepay";

/** 시뮬레이션할 결제창 종류. */
export type PayWindowKind = "alipay" | "wechat" | "card";

export interface PayMethod {
  id: MethodId;
  /** 브랜드 워드마크(로고 대체 텍스트). */
  wordmark: string;
  sub: Record<Locale, string>;
  brandColor: string;
  onBrand: string;
  window: PayWindowKind;
  recommended?: boolean;
}

export const segmentForLocale = (locale: Locale): Segment => (locale === "zh" ? "china" : "global");

const CHINA_METHODS: PayMethod[] = [
  {
    id: "alipay",
    wordmark: "支付宝",
    window: "alipay",
    brandColor: "#1677FF",
    onBrand: "#ffffff",
    recommended: true,
    sub: { ko: "Alipay+ · 자국 지갑 그대로", en: "Alipay+", zh: "支付宝 · 免登录", ja: "Alipay+" },
  },
  {
    id: "wechat",
    wordmark: "微信",
    window: "wechat",
    brandColor: "#07C160",
    onBrand: "#ffffff",
    sub: { ko: "WeChat Pay", en: "WeChat Pay", zh: "微信支付", ja: "WeChat Pay" },
  },
  {
    id: "unionpay",
    wordmark: "银联",
    window: "card",
    brandColor: "#E21836",
    onBrand: "#ffffff",
    sub: { ko: "UnionPay 카드", en: "UnionPay card", zh: "银联卡", ja: "UnionPay" },
  },
];

const GLOBAL_METHODS: PayMethod[] = [
  {
    id: "card",
    wordmark: "CARD",
    window: "card",
    brandColor: "#1A1F71",
    onBrand: "#ffffff",
    recommended: true,
    sub: {
      ko: "해외 신용·체크카드",
      en: "Visa · Mastercard · Amex",
      zh: "境外信用卡",
      ja: "海外カード",
    },
  },
  {
    id: "applepay",
    wordmark: "Pay",
    window: "card",
    brandColor: "#000000",
    onBrand: "#ffffff",
    sub: { ko: "Apple Pay", en: "Apple Pay", zh: "Apple Pay", ja: "Apple Pay" },
  },
  {
    id: "googlepay",
    wordmark: "GPay",
    window: "card",
    brandColor: "#ffffff",
    onBrand: "#3c4043",
    sub: { ko: "Google Pay", en: "Google Pay", zh: "Google Pay", ja: "Google Pay" },
  },
];

export const methodsForSegment = (segment: Segment): PayMethod[] =>
  segment === "china" ? CHINA_METHODS : GLOBAL_METHODS;

/** mock 환율 — Alipay/WeChat 결제창에 위안(¥) 근사액을 함께 보여주기 위한 표시용. */
const KRW_PER_CNY = 190;
export const approxCny = (krw: number): number => Math.round(krw / KRW_PER_CNY);
