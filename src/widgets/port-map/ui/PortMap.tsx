import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";
import { Box } from "@wanteddev/wds";
import { useEffect, useState } from "react";

import type { ReachableSpot } from "@/entities/spot";

import { myDot, portPin, spotPin } from "../lib/marker-icons";

const MAPS_KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// 구글 기본 마커 zIndex는 화면 y좌표 기반 큰 값 — 확실히 위에 오도록 충분히 큰 값 사용
const Z_PORT = 2_000_000;
const Z_ME = 1_999_999;

interface LatLng {
  lat: number;
  lng: number;
}

/**
 * 정박항(pill)·도달 가능 스팟(/spots)·내 위치 마커를 얹은 구글맵 — 홈 카드·풀맵·탐방 공용.
 * 부모가 크기를 정한다(absolute inset 0). 내 위치는 위젯이 직접 구독(watchPosition)하고,
 * 권한 허용 시 key 리마운트로 내 위치 중심으로 이동한다(사용자 실제 위치 반영).
 */
export function PortMap({
  port,
  portName,
  spots,
  zoom = 12,
  interactive = false,
  onSpotClick,
}: {
  port: LatLng;
  portName: string;
  spots: ReachableSpot[];
  zoom?: number;
  interactive?: boolean;
  onSpotClick?: (spot: ReachableSpot) => void;
}) {
  // 내 위치 — 거부/실패 시 항구 중심 유지
  const [myPos, setMyPos] = useState<LatLng | null>(null);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  if (!MAPS_KEY) {
    // 키 미설정 폴백 — 기존 placeholder 색 유지
    return <Box sx={{ position: "absolute", inset: 0, background: "#CFE4F2" }} />;
  }
  const center = myPos ?? port;
  return (
    <Box sx={{ position: "absolute", inset: 0, background: "#CFE4F2" }}>
      <APIProvider apiKey={MAPS_KEY}>
        {/* defaultCenter는 마운트 시 1회 — GPS가 잡히는 순간 key 리마운트로 내 위치 중심 이동 */}
        <GoogleMap
          key={myPos ? "me" : "port"}
          defaultCenter={center}
          defaultZoom={zoom}
          disableDefaultUI
          gestureHandling={interactive ? "greedy" : "none"}
          style={{ width: "100%", height: "100%" }}
        >
          {/* 시안 마커 — 이름 pill+스템(스팟=브랜드색, 정박항=검정 pill+배). 항구는 항상 최상위 */}
          <Marker position={port} icon={portPin(portName)} title={portName} zIndex={Z_PORT} />
          {spots.map((s) => (
            <Marker
              key={s.id}
              position={{ lat: s.lat, lng: s.lng }}
              icon={spotPin(s.name)}
              title={s.name}
              onClick={onSpotClick ? () => onSpotClick(s) : undefined}
            />
          ))}
          {myPos && <Marker position={myPos} icon={myDot()} title="현재 위치" zIndex={Z_ME} />}
        </GoogleMap>
      </APIProvider>
    </Box>
  );
}
