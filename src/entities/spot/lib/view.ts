// 프레젠테이션 헬퍼 — 실 API 카테고리 틴트·양식화 지도 투영.

// 실 API 카테고리 키(backend /spots category.key) → 칩/태그 틴트. 미지의 키는 프라이머리 톤 폴백
export const CATEGORY_TINT: Record<string, { fg: string; bg: string }> = {
  culture: { fg: "#8B3FF0", bg: "#F3ECFF" },
  nature: { fg: "#12A150", bg: "#EAF7EE" },
  attraction: { fg: "#2563EB", bg: "#E8F1FF" },
  activity: { fg: "#E8820E", bg: "#FFF1E6" },
  wellness: { fg: "#0E7C3F", bg: "#EAF7EE" },
  food: { fg: "#E8820E", bg: "#FFF1E6" },
  beach: { fg: "#0891B2", bg: "#E6F7FA" },
};

export const categoryTint = (key: string): { fg: string; bg: string } =>
  CATEGORY_TINT[key] ?? { fg: "#2563EB", bg: "#E8F1FF" };

/** 실좌표(lat/lng)들을 양식화 지도 x/y%로 투영 — 경계 박스 + 여백(x 14~86 / y 16~76) */
export function pctProjector(points: { lat: number; lng: number }[]) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return (p: { lat: number; lng: number }) => ({
    x: maxLng === minLng ? 50 : 14 + ((p.lng - minLng) / (maxLng - minLng)) * 72,
    y: maxLat === minLat ? 50 : 16 + ((maxLat - p.lat) / (maxLat - minLat)) * 60,
  });
}
