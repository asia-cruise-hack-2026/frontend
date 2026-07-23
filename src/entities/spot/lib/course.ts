import type { Cruise } from "@/entities/cruise";

import type { ReachableSpot } from "../model/types";

// 컨셉 → 실 API 카테고리 키 (backend /spots category.key). null = 전체
const CONCEPTS: Record<string, readonly string[] | null> = {
  highlights: null,
  nature: ["nature", "beach", "wellness"],
  food: ["food"],
  photo: ["attraction", "nature", "beach"],
};

/** 컨셉으로 스팟 자동 선정 — 매칭 카테고리 우선, 모자라면 거리순으로 채워 3곳 (디자인 :1115-1120) */
export function conceptSpotIds(conceptKey: string, spots: ReachableSpot[]): string[] {
  const cats = CONCEPTS[conceptKey];
  const byKm = [...spots].sort((a, b) => a.km - b.km);
  const matched = cats ? byKm.filter((s) => cats.includes(s.categoryKey)) : byKm;
  const rest = byKm.filter((s) => !matched.includes(s));
  return [...matched, ...rest].slice(0, 3).map((s) => s.id);
}

/** 코스 계산에 필요한 최소 필드 — 실 스팟(ReachableSpot) 기준 */
export interface CourseSpotInput {
  id: string;
  km: number;
  stayMinutes: number;
}

export interface CourseStop {
  no: number;
  spotId: string;
  startMin: number; // 도착 시각(자정 기준 분)
  stayMin: number;
  legToNextMin: number | null; // 다음 스팟까지 이동(분), 마지막이면 null
}

export interface Course {
  stops: CourseStop[];
  totalMin: number; // 총 코스 시간(체류 + 이동)
}

/** 항구 도착+30분부터 스팟 순회, 스팟간 이동 20분 (디자인 renderVals :1524-1531) */
export function buildCourse(spots: CourseSpotInput[], cruise: Cruise): Course {
  const LEG = 20;
  let acc = cruise.arrM + 30;
  let total = 0;
  const stops: CourseStop[] = spots.map((s, i) => {
    const start = acc;
    const last = i === spots.length - 1;
    const add = s.stayMinutes + (last ? 0 : LEG);
    acc += add;
    total += add;
    return {
      no: i + 1,
      spotId: s.id,
      startMin: start,
      stayMin: s.stayMinutes,
      legToNextMin: last ? null : LEG,
    };
  });
  return { stops, totalMin: total };
}

/** 체류 가용시간(도착+30분 ~ 탑승마감(출항 60분 전 — 앱 전역 통일)) */
export function availableMinutes(cruise: Cruise): number {
  return cruise.depM - 60 - (cruise.arrM + 30);
}

// 스팟간 실거리 기반 이동 분 (디자인 renderVals :1538)
function legMin(km: number): number {
  return Math.max(8, Math.round(km * 2.2));
}

export interface CourseSlack {
  totalMin: number; // 하선+30분부터 마지막 스팟 후 항구 복귀까지 총 소요
  slackMin: number; // 탑승마감(출항-60분) 대비 여유(양수) / 초과(음수)
  fits: boolean;
}

/**
 * 실거리 slack 모델 (디자인 renderVals :1537-1562). 진입 leg + 스팟 체류 + 스팟간 이동 + 복귀 leg
 * 을 누적해 탑승마감과 비교. buildCourse의 표시용 고정 20분 모델보다 정확한 fits 판정용.
 * 마감은 크루즈 탭과 동일하게 출항-60분으로 통일(기존 -30분 불일치 정합).
 */
export function courseSlack(spots: CourseSpotInput[], cruise: Cruise): CourseSlack {
  const startM = cruise.arrM + 30;
  let clk = startM;
  spots.forEach((s, i) => {
    const prev = spots[i - 1];
    const km = i === 0 || !prev ? s.km : Math.max(1.5, Math.abs(s.km - prev.km) + 2.5);
    clk += legMin(km) + s.stayMinutes;
  });
  const last = spots[spots.length - 1];
  if (last) clk += legMin(last.km); // 항구 복귀 leg
  const deadline = cruise.depM - 60;
  const slack = deadline - clk;
  return { totalMin: clk - startM, slackMin: slack, fits: slack >= 0 };
}
