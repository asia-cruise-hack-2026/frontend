import { api } from "@/shared/api";
import type { Locale } from "@/shared/i18n";

import type { ReachableSpot } from "../model/types";

// GET /spots 응답 항목 중 이동 탭이 쓰는 필드 (backend/docs/API-SPEC.md §3)
interface ApiSpot {
  id: string;
  name: string;
  category: { key: string; label: string };
  lat: number;
  lng: number;
  distanceKm: number;
  driveMinutes: number;
}

/** 크루즈 체류시간 안에 다녀올 수 있는 스팟 — 항구 거리순 상위 N */
export const listReachableSpots = async (
  cruiseId: string,
  lang: Locale,
  size = 10,
): Promise<ReachableSpot[]> => {
  const res = await api<{ items: ApiSpot[] }>(
    `/spots?cruiseId=${encodeURIComponent(cruiseId)}&sort=distance&size=${size}&lang=${lang}`,
  );
  return res.items.map((s) => ({
    id: s.id,
    name: s.name,
    categoryLabel: s.category.label,
    km: s.distanceKm,
    lat: s.lat,
    lng: s.lng,
    driveMinutes: s.driveMinutes,
  }));
};
