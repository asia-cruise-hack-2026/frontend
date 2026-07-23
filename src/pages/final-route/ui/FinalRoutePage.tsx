import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, Button, FlexBox } from "@wanteddev/wds";
import { IconArrowLeft } from "@wanteddev/wds-icon";

import { getCruise } from "@/entities/cruise";
import { buildCourse, listReachableSpots, pctProjector, type ReachableSpot } from "@/entities/spot";
import { GLOBAL_CARS, taxiFare, taxiMinutes, vanFare } from "@/entities/transport";
import { useI18n } from "@/shared/i18n";
import { useCruiseId, usePkgSpotIds, useTransportMode } from "@/shared/store";

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
 * 지도는 ExploreScreen.tsx와 동일한 스타일 지도 방식(실 Google Maps 아님, 스팟 x/y% 좌표) +
 * 항구~스팟을 잇는 SVG 폴리라인(디자인 finalPolyline :1606).
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
  const portKey = cruise?.portKey ?? "jeju";
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

  // 디자인 renderVals :1695 — 항구(제주/강정)에 따라 땅 위치가 다름(장식)
  const landTop = portKey === "jeju" ? "34%" : "-30%";
  const portLabel = cruise?.portName ?? "";

  // 양식화 지도 유지 — 실좌표(lat/lng)를 x/y%로 투영(mock x/y% 대체)
  const portPt = { lat: cruise?.portLat ?? 33.523, lng: cruise?.portLng ?? 126.537 };
  const project = pctProjector([portPt, ...spots]);
  const portXY = project(portPt);
  const spotXYs = spots.map((s) => project(s));

  // 디자인 renderVals :1606 — 항구에서 시작해 pkg 스팟을 순서대로 잇는 경로선
  const polylinePoints = [`${portXY.x},${portXY.y}`, ...spotXYs.map((p) => `${p.x},${p.y}`)].join(
    " ",
  );

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

        {/* 스타일 지도 — 디자인 :604-615. ExploreScreen.tsx 방식 참고(좌표 x/y%, 실 Google Maps 아님) */}
        <Box
          sx={{
            position: "relative",
            height: "220px",
            margin: "0 20px",
            borderRadius: "18px",
            background: "linear-gradient(180deg,#CFE4F2 0%,#BFDCF0 100%)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: "-8%",
              top: landTop,
              width: "116%",
              height: "70%",
              background: "linear-gradient(160deg,#DDEBCF,#E9F2E0)",
              borderRadius: "48% 52% 46% 54%/60% 56% 44% 40%",
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,.5)",
            }}
          />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="var(--primary-normal-4)"
              strokeWidth={0.8}
              strokeDasharray="2.4 2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <Box
            as="span"
            sx={(theme) => ({
              position: "absolute",
              left: `${portXY.x}%`,
              top: `${portXY.y}%`,
              transform: "translate(-50%,-50%)",
              zIndex: 3,
              background: theme.semantic.label.normal,
              color: theme.semantic.static.white,
              borderRadius: "999px",
              padding: "3px 9px",
              fontSize: "10px",
              fontWeight: 700,
            })}
          >
            {portLabel}
          </Box>
          {spots.map((spot, i) => (
            <Box
              key={spot.id}
              as="span"
              sx={(theme) => ({
                position: "absolute",
                left: `${spotXYs[i]?.x ?? 50}%`,
                top: `${spotXYs[i]?.y ?? 50}%`,
                transform: "translate(-50%,-100%)",
                zIndex: 4,
                width: "22px",
                height: "22px",
                borderRadius: "999px",
                background: theme.semantic.primary.normal,
                color: theme.semantic.static.white,
                fontWeight: 700,
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 3px 8px rgba(0,0,0,.25)",
              })}
            >
              {i + 1}
            </Box>
          ))}
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
