import { APIProvider, Map as GoogleMap } from "@vis.gl/react-google-maps";
import { Box } from "@wanteddev/wds";

const MAPS_KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/** 홈 지도 1단계 — 구글맵만 띄운다(항구 중심). 마커·스팟 연동은 /spots?compact=1로 다음 단계 */
export function HomeMap({ lat, lng }: { lat: number; lng: number }) {
  if (!MAPS_KEY) {
    // 키 미설정 폴백 — 기존 placeholder 유지
    return <Box sx={{ position: "relative", height: "270px", background: "#CFE4F2" }} />;
  }
  return (
    <Box sx={{ position: "relative", height: "270px" }}>
      <APIProvider apiKey={MAPS_KEY}>
        <GoogleMap
          defaultCenter={{ lat, lng }}
          defaultZoom={11.5}
          disableDefaultUI
          gestureHandling="greedy"
          style={{ width: "100%", height: "100%" }}
        />
      </APIProvider>
    </Box>
  );
}
