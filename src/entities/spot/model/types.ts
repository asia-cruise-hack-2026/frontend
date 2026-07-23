import type { LocalizedText } from "@/entities/cruise";

export interface SpotSub {
  name: LocalizedText;
  type: LocalizedText;
  blurb: LocalizedText;
}

export interface Spot {
  id: string;
  portKey: "jeju" | "gangjeong";
  km: number;
  min: number;
  x: number;
  y: number;
  icon: string;
  color: string;
  iconColor: string;
  themes: string[];
  name: LocalizedText;
  cat: LocalizedText;
  blurb: LocalizedText;
  subs: SpotSub[];
}
