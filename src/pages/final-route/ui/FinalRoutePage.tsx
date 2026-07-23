import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { APIProvider, Map as GoogleMap, Marker, useMap } from "@vis.gl/react-google-maps";
import { Box, Button, FlexBox } from "@wanteddev/wds";
import { IconArrowLeft } from "@wanteddev/wds-icon";
import { useEffect } from "react";

import { getCruise } from "@/entities/cruise";
import { buildCourse, listReachableSpots, type ReachableSpot } from "@/entities/spot";
import { GLOBAL_CARS, taxiFare, taxiMinutes, vanFare } from "@/entities/transport";
import { useI18n } from "@/shared/i18n";
import { useCruiseId, usePkgSpotIds, useTransportMode } from "@/shared/store";
import { numberedPin, portPin } from "@/widgets/port-map";

const MAPS_KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// 항구→스팟 순서→항구 점선 경로 — 디자인 finalPolyline(:1606)을 실지도 위 구글 Polyline으로
function RoutePolyline({ path }: { path: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || path.length < 2 || typeof google === "undefined") return;
    const line = new google.maps.Polyline({
      map,
      path,
      strokeOpacity: 0,
      icons: [
        {
          icon: {
            path: "M 0,-1 0,1",
            strokeOpacity: 0.9,
            strokeWeight: 2.5,
            strokeColor: "#2563EB",
          },
          offset: "0",
          repeat: "12px",
        },
      ],
    });
    return () => line.setMap(null);
  }, [map, path]);
  return null;
}

// 시각 포맷 HH:MM — AiPackagePage.tsx/HomePage.tsx의 fmt와 동일 패턴(엔티티에 미노출이라 로컬 복제).
function fmt(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

// 요약 카드(예상 이동시간·비용·복귀 권장) — 디자인 :625-628 카드 스타일 이식.
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={(theme) => ({
        background: theme.semantic.background.normal.normal,
        borderRadius: "14px",
        padding: "14px",
        boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
      })}
    >
      <Box sx={(theme) => ({ fontSize: "12px", color: theme.semantic.label.alternative })}>
        {label}
      </Box>
      <Box
        sx={(theme) => ({
          fontWeight: 700,
          fontSize: "17px",
          color: theme.semantic.label.normal,
          marginTop: "3px",
        })}
      >
        {value}
      </Box>
    </Box>
  );
}

/**
 * 최종 경로 안내 — 프로토타입 "FINAL ROUTE"(:594-638) 이식.
 * 지도는 실 Google Maps(정박항 pill + 순번 마커 + 점선 경로) — 양식화 지도에서 전환.
 */
export function FinalRoutePage() {
  const { t, locale, money } = useI18n();
  const navigate = useNavigate();
  const cruiseId = useCruiseId();
  const pkgSpotIds = usePkgSpotIds();
  const mode = useTransportMode();

  const { data: cruise } = useQuery({
    queryKey: ["cruise", cruiseId, locale],
    queryFn: () => getCruise(cruiseId ?? "", locale),
    enabled: !!cruiseId,
  });
  // 실 DB 스팟 — 패키지/홈과 동일 소스·캐시 키
  const { data: allSpots = [] } = useQuery({
    queryKey: ["reachable-spots", cruiseId, locale, 30],
    queryFn: () => listReachableSpots(cruiseId ?? "", locale, 30),
    enabled: !!cruiseId,
  });

  // pkgSpotIds 순서 유지하며 spots로 변환 — AiPackagePage.tsx와 동일 패턴
  const spots = pkgSpotIds
    .map((id) => allSpots.find((s) => s.id === id))
    .filter((s): s is ReachableSpot => s != null);

  const course = cruise ? buildCourse(spots, cruise) : null;
  const totalKm = spots.reduce((sum, s) => sum + s.km, 0);

  const portLabel = cruise?.portName ?? "";
  const portPt = { lat: cruise?.portLat ?? 33.523, lng: cruise?.portLng ?? 126.537 };
  // 실지도 중심 — 항구+스팟 경계 박스 중앙
  const pts = [portPt, ...spots.map((s) => ({ lat: s.lat, lng: s.lng }))];
  const center = {
    lat: (Math.min(...pts.map((p) => p.lat)) + Math.max(...pts.map((p) => p.lat))) / 2,
    lng: (Math.min(...pts.map((p) => p.lng)) + Math.max(...pts.map((p) => p.lng))) / 2,
  };
  // 항구 → 스팟 순서 → 항구 복귀
  const routePath = [portPt, ...spots.map((s) => ({ lat: s.lat, lng: s.lng })), portPt];

  const finalTimeText = mode === "gtaxi" ? t("gt_dayfull") : `${taxiMinutes(totalKm)}${t("min")}`;
  const finalCostText =
    mode === "van"
      ? money(vanFare(taxiFare(totalKm)))
      : mode === "gtaxi"
        ? money(GLOBAL_CARS[0].day)
        : money(taxiFare(totalKm));
  const finalReturnText = cruise ? fmt(cruise.depM - 60) : ""; // 탑승 마감 = 출항-60분(앱 전역 통일)

  return (
    <FlexBox flexDirection="column" sx={{ minHeight: "100dvh" }}>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {/* 헤더 — 디자인 :598-599 */}
        <FlexBox alignItems="center" sx={{ height: "52px", padding: "0 8px" }}>
          <Box
            as="button"
            type="button"
            aria-label="back"
            onClick={() => navigate({ to: "/app/transport" })}
            sx={(theme) => ({
              width: "40px",
              height: "40px",
              border: "none",
              background: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.semantic.label.normal,
            })}
          >
            <IconArrowLeft sx={{ fontSize: "24px" }} />
          </Box>
        </FlexBox>

        {/* 타이틀 — 디자인 :600-603 */}
        <Box sx={{ padding: "0 20px 12px" }}>
          <Box
            as="h1"
            sx={(theme) => ({
              margin: "0 0 4px",
              fontWeight: 700,
              fontSize: "22px",
              letterSpacing: "-0.02em",
              color: theme.semantic.label.normal,
            })}
          >
            {t("final_title")}
          </Box>
        </Box>

        {/* 실지도 — 정박항 pill + 순번 마커 + 점선 경로(항구→스팟들→항구) */}
        <Box
          sx={{
            position: "relative",
            height: "220px",
            margin: "0 20px",
            borderRadius: "18px",
            background: "#CFE4F2",
            overflow: "hidden",
          }}
        >
          {MAPS_KEY && (
            <APIProvider apiKey={MAPS_KEY}>
              <GoogleMap
                key={spots.map((s) => s.id).join(",")}
                defaultCenter={center}
                defaultZoom={13}
                disableDefaultUI
                gestureHandling="none"
                style={{ width: "100%", height: "100%" }}
              >
                <Marker
                  position={portPt}
                  icon={portPin(portLabel)}
                  title={portLabel}
                  zIndex={2_000_000}
                />
                {spots.map((spot, i) => (
                  <Marker
                    key={spot.id}
                    position={{ lat: spot.lat, lng: spot.lng }}
                    icon={numberedPin(i + 1)}
                    title={spot.name}
                  />
                ))}
                <RoutePolyline path={routePath} />
              </GoogleMap>
            </APIProvider>
          )}
        </Box>

        {cruise && course && (
          <>
            {/* 요약 — 디자인 :625-628(final_time·final_cost) + final_return 추가(작업 지시 요구사항, 디자인 SoT 구간엔 없음) */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                padding: "16px 20px 4px",
              }}
            >
              <SummaryCard label={t("final_time")} value={finalTimeText} />
              <SummaryCard label={t("final_cost")} value={finalCostText} />
            </Box>
            <Box sx={{ padding: "10px 20px 4px" }}>
              <SummaryCard label={t("final_return")} value={finalReturnText} />
            </Box>

            {/* 코스 스톱 목록(간단 표시) — 디자인 :616-624 */}
            <FlexBox flexDirection="column" gap="10px" sx={{ padding: "16px 20px 4px" }}>
              {course.stops.map((stop, i) => {
                const spot = spots[i];
                return (
                  <FlexBox key={stop.spotId} alignItems="center" gap="10px">
                    <Box
                      as="span"
                      sx={(theme) => ({
                        width: "24px",
                        height: "24px",
                        borderRadius: "999px",
                        background: theme.semantic.primary.normal,
                        color: theme.semantic.static.white,
                        fontWeight: 700,
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      })}
                    >
                      {stop.no}
                    </Box>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        flex: 1,
                        fontWeight: 600,
                        fontSize: "14px",
                        color: theme.semantic.label.normal,
                      })}
                    >
                      {spot.name}
                    </Box>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        fontSize: "12px",
                        color: theme.semantic.label.alternative,
                      })}
                    >
                      {`${fmt(stop.startMin)} · ${stop.stayMin}${t("min")}`}
                    </Box>
                  </FlexBox>
                );
              })}
            </FlexBox>
          </>
        )}

        <Box sx={{ height: "96px" }} />
      </Box>

      {/* 하단 CTA — 디자인 :632 구조 참고. 문구·동작은 작업 지시대로 단일 버튼("홈으로" → /app) */}
      <Box
        sx={(theme) => ({
          padding: "12px 20px 18px",
          borderTop: `1px solid ${theme.semantic.line.normal.neutral}`,
          flexShrink: 0,
        })}
      >
        <Button
          variant="solid"
          color="primary"
          size="large"
          fullWidth
          onClick={() => navigate({ to: "/app" })}
        >
          {t("final_cta")}
        </Button>
      </Box>
    </FlexBox>
  );
}
