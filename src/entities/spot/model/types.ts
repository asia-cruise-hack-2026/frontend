/** 실 API(GET /spots?cruiseId) 스팟 — 요청 언어로 해석 완료, 실좌표 보유 */
export interface ReachableSpot {
  id: string;
  name: string;
  categoryKey: string;
  categoryLabel: string;
  description: string;
  thumbnail: string | null;
  km: number; // 항구 기준 거리 (distanceKm)
  lat: number;
  lng: number;
  driveMinutes: number;
  stayMinutes: number;
}

/** 실 API(GET /spots/:id) 상세 — 목록 필드 + 이미지·주소·태그 */
export interface SpotDetail extends ReachableSpot {
  address: string;
  images: string[];
  tags: string[];
  detailUrl: string | null;
}
