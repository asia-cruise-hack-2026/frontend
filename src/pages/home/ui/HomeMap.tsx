import { Box } from "@wanteddev/wds";

import type { ReachableSpot } from "@/entities/spot";
import { PortMap } from "@/widgets/port-map";

// 풀맵 확대 배지 — 디자인 :171 원본 SVG
function ExpandGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
}

/** 홈 지도 카드 — 정박항·스팟·내위치 마커(PortMap, 내위치는 위젯 내장). 지도 전체가 탭 영역 = 풀맵(/app/map) 확대 전환. */
export function HomeMap({
  port,
  portName,
  spots,
  onExpand,
}: {
  port: { lat: number; lng: number };
  portName: string;
  spots: ReachableSpot[];
  onExpand: () => void;
}) {
  return (
    <Box sx={{ position: "relative", height: "270px", viewTransitionName: "home-map" }}>
      <PortMap port={port} portName={portName} spots={spots} />
      {/* 디자인 :170 — 카드에선 팬 대신 탭(풀맵으로), 팬은 풀맵에서 */}
      <Box
        as="button"
        type="button"
        onClick={onExpand}
        aria-label="expand map"
        sx={{
          position: "absolute",
          inset: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 0,
        }}
      />
      <Box
        as="span"
        sx={(theme) => ({
          position: "absolute",
          bottom: "10px",
          right: "10px",
          pointerEvents: "none",
          background: "rgba(255,255,255,.95)",
          borderRadius: "9px",
          padding: "6px",
          color: theme.semantic.label.normal,
          display: "inline-flex",
          boxShadow: "0 1px 5px rgba(0,0,0,.2)",
        })}
      >
        <ExpandGlyph />
      </Box>
    </Box>
  );
}
