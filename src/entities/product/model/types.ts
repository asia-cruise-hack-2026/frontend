/** 서버 응답을 요청 언어로 해석 완료한 상품 (GET /goods) */
export interface Product {
  id: string;
  category: string; // "food" | "cosmetics" | "souvenir" — 키는 서버 주도라 열어둠
  categoryLabel: string;
  name: string;
  description: string;
  price: number;
  thumbnail: string;
  importStatus: "allowed" | "conditional" | "restricted" | "prohibited";
  importLabel: string;
  customsNote: string;
  cruiseLineNote: string;
  detailUrl: string;
}
