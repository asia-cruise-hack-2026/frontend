import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import { Box } from "@wanteddev/wds";

const MAPS_KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface LatLng {
  lat: number;
  lng: number;
}

/** 이동 탭 지도 — 내 위치·목적지 마커. 디자인 taxi 섹션(taxiMapShow/taxiMapH) 이식 */
export function MoveMap({
  dest,
  myPos,
  height,
}: {
  dest: LatLng | null;
  myPos: LatLng | null;
  height: number;
}) {
  if (!MAPS_KEY) {
    // 키 미설정 폴백 — 디자인 placeholder 색 유지
    return (
      <Box
        sx={{ position: "relative", height: `${height}px`, background: "#CFE4F2", flexShrink: 0 }}
      />
    );
  }
  const center = dest ?? myPos ?? { lat: 33.523, lng: 126.537 };
  return (
    <Box sx={{ position: "relative", height: `${height}px`, flexShrink: 0, background: "#CFE4F2" }}>
      <APIProvider apiKey={MAPS_KEY}>
        <GoogleMap
          defaultCenter={center}
          defaultZoom={12}
          disableDefaultUI
          gestureHandling="greedy"
          style={{ width: "100%", height: "100%" }}
        >
          {myPos && <Marker position={myPos} label="●" title="현재 위치" />}
          {dest && <Marker position={dest} />}
        </GoogleMap>
      </APIProvider>
    </Box>
  );
}
