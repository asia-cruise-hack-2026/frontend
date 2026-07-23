import type { Locale } from "@/shared/i18n";

/**
 * 체크아웃 슬라이스 전용 i18n 사전.
 * 공유 strings.ts(다른 세션이 활발히 편집)를 건드리지 않기 위해 슬라이스 로컬로 둔다.
 * 추후 공유 사전으로 승격 가능.
 */
const CS = {
  checkout_title: { ko: "결제", en: "Checkout", zh: "结账", ja: "お会計" },
  order_summary: { ko: "주문 요약", en: "Order summary", zh: "订单摘要", ja: "注文内容" },
  total_label: { ko: "총 결제금액", en: "Total", zh: "应付总额", ja: "合計" },
  allowed_badge: { ko: "반입 가능", en: "Allowed", zh: "可携带", ja: "持込可" },
  restricted_badge: { ko: "반입 제한", en: "Restricted", zh: "限制携带", ja: "持込制限" },
  import_gate_title: {
    ko: "반입 규정 확인",
    en: "Import rules",
    zh: "携带规定确认",
    ja: "持ち込み確認",
  },
  import_gate_desc: {
    ko: "한라봉(생과일)은 일부 기항국·선사에서 반입이 제한돼요. 확인했으며 책임을 이해합니다.",
    en: "Fresh Hallabong may be restricted by some ports and cruise lines. I've reviewed and understand.",
    zh: "汉拿峰（鲜果）在部分港口·邮轮公司受限。我已确认并知悉相关责任。",
    ja: "ハラボン（生果物）は一部の寄港国・船社で制限されます。確認し責任を理解しました。",
  },
  pay_cta: { ko: "결제하기", en: "Continue to pay", zh: "去支付", ja: "支払いへ" },
  select_method: {
    ko: "결제수단 선택",
    en: "Payment method",
    zh: "选择支付方式",
    ja: "お支払い方法",
  },
  recommended: { ko: "추천", en: "Recommended", zh: "推荐", ja: "おすすめ" },
  secure_note: {
    ko: "안전 결제 · OMONG 제주관광 공식",
    en: "Secure payment · OMONG official",
    zh: "安全支付 · OMONG 官方",
    ja: "安全決済 · OMONG 公式",
  },
  merchant_sub: {
    ko: "제주관광공사 공식",
    en: "Jeju Tourism Organization",
    zh: "济州观光公社官方",
    ja: "済州観光公社公式",
  },
  pay_amount: { ko: "결제", en: "Pay", zh: "支付", ja: "支払う" },
  alipay_hint: {
    ko: "아래 버튼을 누르면 결제가 완료돼요.",
    en: "Tap below to confirm your payment.",
    zh: "点击下方按钮完成付款。",
    ja: "下のボタンで支払いを完了します。",
  },
  card_number: { ko: "카드 번호", en: "Card number", zh: "卡号", ja: "カード番号" },
  card_expiry: { ko: "유효기간", en: "Expiry", zh: "有效期", ja: "有効期限" },
  card_cvc: { ko: "CVC", en: "CVC", zh: "安全码", ja: "CVC" },
  processing: {
    ko: "결제 처리 중…",
    en: "Processing payment…",
    zh: "正在处理支付…",
    ja: "決済処理中…",
  },
  paid_title: { ko: "결제 완료", en: "Payment complete", zh: "支付成功", ja: "決済完了" },
  paid_desc: {
    ko: "주문이 확정되었어요.",
    en: "Your order is confirmed.",
    zh: "订单已确认。",
    ja: "注文が確定しました。",
  },
  order_no: { ko: "주문번호", en: "Order no.", zh: "订单号", ja: "注文番号" },
  paid_amount_label: { ko: "결제 금액", en: "Amount paid", zh: "支付金额", ja: "お支払い金額" },
  delivery_note: {
    ko: "구매하신 상품은 출항 전 크루즈 선박으로 배송해 드릴게요.",
    en: "We'll deliver your items to your cruise ship before departure.",
    zh: "所购商品将于开航前送至您的邮轮。",
    ja: "ご購入品は出航前にクルーズ船へお届けします。",
  },
  done: { ko: "완료", en: "Done", zh: "完成", ja: "完了" },
} satisfies Record<string, Record<Locale, string>>;

export type CheckoutKey = keyof typeof CS;

export const ct = (key: CheckoutKey, locale: Locale): string => CS[key][locale];
