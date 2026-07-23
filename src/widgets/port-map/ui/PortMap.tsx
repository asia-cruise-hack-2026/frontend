import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import { Box } from "@wanteddev/wds";

import type { ReachableSpot } from "@/entities/spot";

import { myDot, portPin, spotPin } from "../lib/marker-icons";

const MAPS_KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface LatLng {
  lat: number;
  lng: number;
}

// 승객 시나리오는 항상 항구 인근 — GPS가 항구에서 크게 벗어나면(개발 머신 등) 항구 중심 폴백 (~28km 박스)
const isNearPort = (pos: LatLng, port: LatLng) =>
  Math.abs(pos.lat - port.lat) < 0.25 && Math.abs(pos.lng - port.lng) < 0.3;

/**
 * 정박항(⚓)·도달 가능 스팟(/spots)·내 위치 마커를 얹은 구글맵 — 홈 카드·풀맵 공용.
 * 부모가 크기를 정한다(absolute inset 0). 내 위치가 항구 인근으로 잡히면 key 리마운트로 그쪽 중심.
 */
export function PortMap({
  port,
  portName,
  myPos,
  spots,
  zoom = 12,
  interactive = false,
}: {
  port: LatLng;
  portName: string;
  myPos: LatLng | null;
  spots: ReachableSpot[];
  zoom?: number;
  interactive?: boolean;
}) {
  if (!MAPS_KEY) {
    // 키 미설정 폴백 — 기존 placeholder 색 유지
    return <Box sx={{ position: "absolute", inset: 0, background: "#CFE4F2" }} />;
  }
  const centerOnMe = myPos != null && isNearPort(myPos, port);
  const center = centerOnMe && myPos ? myPos : port;
  return (
    <Box sx={{ position: "absolute", inset: 0, background: "#CFE4F2" }}>
      <APIProvider apiKey={MAPS_KEY}>
        <GoogleMap
          key={centerOnMe ? "me" : "port"}
          defaultCenter={center}
          defaultZoom={zoom}
          disableDefaultUI
          gestureHandling={interactive ? "greedy" : "none"}
          style={{ width: "100%", height: "100%" }}
        >
          {/* 시안 마커 — 이름 pill+스템(스팟=브랜드색, 정박항=검정 pill+배) */}
          <Marker position={port} icon={portPin(portName)} title={portName} zIndex={3} />
          {spots.map((s) => (
            <Marker
              key={s.id}
              position={{ lat: s.lat, lng: s.lng }}
              icon={spotPin(s.name)}
              title={s.name}
            />
          ))}
          {myPos && <Marker position={myPos} icon={myDot()} title="현재 위치" zIndex={4} />}
        </GoogleMap>
      </APIProvider>
    </Box>
  );
}
