import type { LocalizedText } from "@/entities/cruise";

export interface Product {
  id: string;
  cat: "food" | "cosmetics" | "alcohol" | "souvenir";
  price: number;
  status: "allowed" | "conditional" | "restricted" | "prohibited";
  color: string;
  iconColor: string;
  icon: string;
  name: LocalizedText;
  desc: LocalizedText;
  customs: LocalizedText; // 세관 안내
  line: LocalizedText; // 선사 규정
}
