import { api } from "@/shared/api";
import type { Locale } from "@/shared/i18n";

import type { ReachableSpot, SpotDetail } from "../model/types";

// GET /spots 응답 항목 중 프론트가 쓰는 필드 (backend/docs/API-SPEC.md §3)
interface ApiSpot {
  id: string;
  name: string;
  description: string;
  category: { key: string; label: string };
  lat: number;
  lng: number;
  thumbnail: string | null;
  distanceKm: number;
  driveMinutes: number;
  stayMinutes: number;
}

interface ApiSpotDetail extends ApiSpot {
  address: string;
  images: string[];
  tags: string[];
  detailUrl: string | null;
}

const toReachable = (s: ApiSpot): ReachableSpot => ({
  id: s.id,
  name: s.name,
  categoryKey: s.category.key,
  categoryLabel: s.category.label,
  description: s.description,
  thumbnail: s.thumbnail,
  km: s.distanceKm,
  lat: s.lat,
  lng: s.lng,
  driveMinutes: s.driveMinutes,
  stayMinutes: s.stayMinutes,
});

/** 크루즈 체류시간 안에 다녀올 수 있는 스팟 — 항구 거리순 상위 N */
export const listReachableSpots = async (
  cruiseId: string,
  lang: Locale,
  size = 10,
): Promise<ReachableSpot[]> => {
  const res = await api<{ items: ApiSpot[] }>(
    `/spots?cruiseId=${encodeURIComponent(cruiseId)}&sort=distance&size=${size}&lang=${lang}`,
  );
  return res.items.map(toReachable);
};

/** 전체 도달 가능 스팟 대상 이름 검색 (서버 q= LIKE) — "어디로 갈까요?" */
export const searchReachableSpots = async (
  cruiseId: string,
  q: string,
  lang: Locale,
): Promise<ReachableSpot[]> => {
  const res = await api<{ items: ApiSpot[] }>(
    `/spots?cruiseId=${encodeURIComponent(cruiseId)}&q=${encodeURIComponent(q)}&sort=distance&size=20&lang=${lang}`,
  );
  return res.items.map(toReachable);
};

/** 주변 추천 스팟 (GET /spots/:id/nearby — 좌표 기반 실시간 계산, API-SPEC §3) */
export interface NearbySpot {
  id: string;
  name: string;
  type: string;
  description: string;
  distanceKm: number;
  walkMinutes: number;
  thumbnail: string | null;
}

export const listNearbySpots = async (id: string, lang: Locale): Promise<NearbySpot[]> => {
  const res = await api<{ items: NearbySpot[] }>(
    `/spots/${encodeURIComponent(id)}/nearby?radius=3&limit=4&lang=${lang}`,
  );
  return res.items;
};

/** 스팟 상세 (GET /spots/:id — 이미지·주소·태그 포함) */
export const getSpotDetail = async (id: string, lang: Locale): Promise<SpotDetail> => {
  const s = await api<ApiSpotDetail>(`/spots/${encodeURIComponent(id)}?lang=${lang}`);
  return {
    ...toReachable(s),
    address: s.address,
    images: s.images ?? [],
    tags: s.tags ?? [],
    detailUrl: s.detailUrl,
  };
};
