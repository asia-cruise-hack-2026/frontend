import type { Locale } from "@/shared/i18n";

export type LocalizedText = Record<Locale, string>;

export interface Cruise {
  id: string;
  line: string;
  ship: string;
  portKey: "jeju" | "gangjeong";
  portName: LocalizedText;
  arr: string; // "08:00"
  dep: string; // "18:00"
  arrM: number; // 분 단위 도착
  depM: number; // 분 단위 출항
  nextDest: LocalizedText;
}
