import type { Locale } from "@/shared/i18n";

/** 다른 entity(transport·product·spot)가 공유하는 4개국어 텍스트 타입 — 유지 */
export type LocalizedText = Record<Locale, string>;

/** 서버 응답을 요청 언어로 해석 완료한 크루즈 (GET /cruises) */
export interface Cruise {
  id: string;
  ship: string;
  berth: string; // 예: "강정1"
  date: string; // "2026-07-23"
  portKey: "jeju" | "gangjeong";
  portName: string; // 요청 lang으로 해석됨
  portLat: number;
  portLng: number;
  arr: string; // "13:00"
  dep: string; // "21:00"
  arrM: number; // 분 단위 도착
  depM: number; // 분 단위 출항
  nextDest: string; // 요청 lang으로 해석됨
}
