import type { LocalizedText } from "@/entities/cruise";

export interface Spot {
  id: string;
  portKey: "jeju" | "gangjeong";
  km: number;
  min: number;
  icon: string;
  color: string;
  iconColor: string;
  themes: string[];
  name: LocalizedText;
  cat: LocalizedText;
  blurb: LocalizedText;
}
