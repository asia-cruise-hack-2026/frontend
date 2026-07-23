import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import { Box } from "@wanteddev/wds";

import type { ReachableSpot } from "@/entities/spot";

const MAPS_KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface LatLng {
  lat: number;
  lng: number;
}

/**
 * 이동 탭 전면 지도 — 페이지를 덮는 배경. 후보 스팟 마커(탭=목적지 선택)·목적지·내 위치.
 * 목적지가 바뀌면 key 리마운트로 중심을 옮긴다(선택 스팟이 화면 밖일 수 있는 검색 케이스 대응).
 */
export function MoveMap({
  dest,
  myPos,
  spots = [],
  onSpotClick,
}: {
  dest: ReachableSpot | null;
  myPos: LatLng | null;
  spots?: ReachableSpot[];
  onSpotClick?: (spot: ReachableSpot) => void;
}) {
  if (!MAPS_KEY) {
    // 키 미설정 폴백 — 디자인 placeholder 색 유지
    return <Box sx={{ position: "absolute", inset: 0, background: "#CFE4F2" }} />;
  }
  // 시트가 하단 ~70%를 덮으므로 중심을 남쪽으로 크게 보정해 핀들이 상단 가시 영역에 오게 한다
  // (zoom 12 ≈ 0.00035°/px 기준, 뷰포트 절반 이상 이동)
  const base = dest ? { lat: dest.lat, lng: dest.lng } : { lat: 33.523, lng: 126.537 };
  const center = { lat: base.lat - (dest ? 0.05 : 0.1), lng: base.lng };
  return (
    <Box sx={{ position: "absolute", inset: 0, background: "#CFE4F2" }}>
      <APIProvider apiKey={MAPS_KEY}>
        <GoogleMap
          key={dest?.id ?? "port"}
          defaultCenter={center}
          defaultZoom={dest ? 13 : 12}
          disableDefaultUI
          gestureHandling="greedy"
          style={{ width: "100%", height: "100%" }}
        >
          {myPos && <Marker position={myPos} label="●" title="현재 위치" />}
          {spots
            .filter((s) => s.id !== dest?.id)
            .map((s) => (
              <Marker
                key={s.id}
                position={{ lat: s.lat, lng: s.lng }}
                title={s.name}
                opacity={dest ? 0.55 : 0.92}
                onClick={onSpotClick ? () => onSpotClick(s) : undefined}
              />
            ))}
          {dest && <Marker position={{ lat: dest.lat, lng: dest.lng }} title={dest.name} />}
        </GoogleMap>
      </APIProvider>
    </Box>
  );
}
