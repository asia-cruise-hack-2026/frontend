import type { Cruise } from "@/entities/cruise";

import type { Spot } from "../model/types";

// 컨셉 → 매칭 테마 (디자인 renderVals :1415). null = 전체
const CONCEPTS: Record<string, readonly string[] | null> = {
  highlights: null,
  nature: ["attraction"],
  food: ["food", "cafe"],
  photo: ["attraction"],
};

/** 컨셉으로 스팟 자동 선정 — 매칭 테마 스팟 중 항구에서 가까운 3곳 (디자인 :1115-1120) */
export function conceptSpotIds(conceptKey: string, spots: Spot[]): string[] {
  const themes = CONCEPTS[conceptKey];
  let matched = themes ? spots.filter((s) => s.themes.some((t) => themes.includes(t))) : spots;
  if (matched.length === 0) matched = spots;
  return [...matched]
    .sort((a, b) => a.km - b.km)
    .slice(0, 3)
    .map((s) => s.id);
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
export function buildCourse(spots: Spot[], cruise: Cruise): Course {
  const LEG = 20;
  let acc = cruise.arrM + 30;
  let total = 0;
  const stops: CourseStop[] = spots.map((s, i) => {
    const start = acc;
    const last = i === spots.length - 1;
    const add = s.min + (last ? 0 : LEG);
    acc += add;
    total += add;
    return {
      no: i + 1,
      spotId: s.id,
      startMin: start,
      stayMin: s.min,
      legToNextMin: last ? null : LEG,
    };
  });
  return { stops, totalMin: total };
}

/** 체류 가용시간(도착+30분 ~ 탑승마감(출항 30분 전)) — 코스가 이 안에 들면 fits */
export function availableMinutes(cruise: Cruise): number {
  return cruise.depM - 30 - (cruise.arrM + 30);
}
