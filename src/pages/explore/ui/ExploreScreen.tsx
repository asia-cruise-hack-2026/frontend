import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { addOpacity, Box, Button, FlexBox } from "@wanteddev/wds";
import { IconArrowLeft, IconCheck, IconLocation, IconPlus } from "@wanteddev/wds-icon";
import { useState } from "react";

import { getCruise } from "@/entities/cruise";
import { categoryTint, listReachableSpots, pctProjector } from "@/entities/spot";
import { useI18n } from "@/shared/i18n";
import { sessionActions, useCruiseId, usePkgSpotIds } from "@/shared/store";

// 디자인 :240 원본 선박 SVG(항구 마커 배지) — WDS 대응 아이콘 없어 코드로 직접(D2).
function ShipGlyph() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1" />
      <path d="M4 18l-1 -5h18l-2 4" />
      <path d="M5 13v-6h8l4 6" />
      <path d="M7 7v-4h-1" />
    </svg>
  );
}

/** 탐방(지도) — 프로토타입 "Explore"(:229-281) 구조에 실 DB 스팟·카테고리·썸네일 적용. */
export function ExploreScreen() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const cruiseId = useCruiseId();
  const pkgSpotIds = usePkgSpotIds();
  const [activeCat, setActiveCat] = useState("all");

  const { data: cruise } = useQuery({
    queryKey: ["cruise", cruiseId, locale],
    queryFn: () => getCruise(cruiseId ?? "", locale),
    enabled: !!cruiseId,
  });
  const portKey = cruise?.portKey ?? "jeju";
  // 실 DB 스팟 — 패키지/홈/테마와 동일 소스·캐시 키
  const { data: spots = [] } = useQuery({
    queryKey: ["reachable-spots", cruiseId, locale, 30],
    queryFn: () => listReachableSpots(cruiseId ?? "", locale, 30),
    enabled: !!cruiseId,
  });

  const filteredSpots = spots.filter((s) => activeCat === "all" || s.categoryKey === activeCat);
  // 카테고리 탭 — 로드된 스팟에서 도출(빈도순) + 전체
  const catTabs = (() => {
    const seen = new Map<string, { key: string; label: string; count: number }>();
    for (const s of spots) {
      const c = seen.get(s.categoryKey);
      if (c) c.count += 1;
      else seen.set(s.categoryKey, { key: s.categoryKey, label: s.categoryLabel, count: 1 });
    }
    return [
      { key: "all", label: t("filter_all") },
      ...[...seen.values()].sort((a, b) => b.count - a.count),
    ];
  })();

  // 디자인 renderVals :1695 — 항구(제주/강정)에 따라 땅 위치가 다름(장식)
  const landTop = portKey === "jeju" ? "34%" : "-30%";
  const portLabel = cruise?.portName ?? "";

  // 양식화 지도 유지 — 실좌표를 x/y%로 투영(항구 + 지도 노출 스팟 상위 8곳)
  const portPt = { lat: cruise?.portLat ?? 33.523, lng: cruise?.portLng ?? 126.537 };
  const mapSpots = spots.slice(0, 8);
  const project = pctProjector([portPt, ...mapSpots]);
  const portXY = project(portPt);

  // 디자인 renderVals :1713 — pkgCta 문구 이식
  const pkgCta =
    locale === "ko"
      ? `${pkgSpotIds.length}곳으로 경로 만들기`
      : locale === "zh"
        ? `${pkgSpotIds.length}个地点·生成路线`
        : locale === "ja"
          ? `${pkgSpotIds.length}件でルート作成`
          : `Build route · ${pkgSpotIds.length} to my day`;

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100%",
        background: theme.semantic.background.normal.alternative,
      })}
    >
      {/* 헤더 — 디자인 :232-236 */}
      <Box
        sx={(theme) => ({
          padding: "14px 20px 8px",
          background: theme.semantic.background.normal.normal,
        })}
      >
        <Box
          as="button"
          type="button"
          onClick={() => navigate({ to: "/app" })}
          sx={(theme) => ({
            width: "36px",
            height: "36px",
            margin: "0 0 8px -8px",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            background: theme.semantic.fill.normal,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.semantic.label.normal,
          })}
        >
          <IconArrowLeft sx={{ fontSize: "22px" }} />
        </Box>
        <Box
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: "20px",
            color: theme.semantic.label.normal,
          })}
        >
          {t("spot_map")}
        </Box>
        {cruise && (
          <FlexBox
            alignItems="center"
            gap="6px"
            sx={(theme) => ({
              marginTop: "5px",
              fontSize: "13px",
              color: theme.semantic.label.alternative,
            })}
          >
            <Box
              as="span"
              sx={(theme) => ({ display: "inline-flex", color: theme.semantic.primary.normal })}
            >
              <IconLocation sx={{ fontSize: "15px" }} />
            </Box>
            {portLabel}
          </FlexBox>
        )}
      </Box>

      {/* 스타일 지도 — 디자인 :237-248, 마커는 실좌표 투영 */}
      <Box
        sx={{
          position: "relative",
          height: "250px",
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
        <FlexBox
          flexDirection="column"
          alignItems="center"
          gap="3px"
          sx={{
            position: "absolute",
            left: `${portXY.x}%`,
            top: `${portXY.y}%`,
            transform: "translate(-50%,-50%)",
            zIndex: 5,
          }}
        >
          <FlexBox
            as="span"
            alignItems="center"
            gap="3px"
            sx={(theme) => ({
              background: theme.semantic.label.normal,
              color: theme.semantic.static.white,
              borderRadius: "999px",
              padding: "3px 9px",
              fontSize: "10px",
              fontWeight: 700,
            })}
          >
            <ShipGlyph />
            {portLabel}
          </FlexBox>
        </FlexBox>
        {mapSpots.map((spot) => {
          const inPkg = pkgSpotIds.includes(spot.id);
          const xy = project(spot);
          return (
            <Box
              key={spot.id}
              as="button"
              type="button"
              onClick={() => navigate({ to: "/app/spot/$spotId", params: { spotId: spot.id } })}
              sx={{
                position: "absolute",
                left: `${xy.x}%`,
                top: `${xy.y}%`,
                transform: "translate(-50%,-100%)",
                border: "none",
                background: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 4,
                padding: 0,
              }}
            >
              <Box
                as="span"
                sx={(theme) => ({
                  background: inPkg ? "#8B3FF0" : theme.semantic.primary.normal,
                  color: theme.semantic.static.white,
                  fontWeight: 600,
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                  borderRadius: "999px",
                  padding: "4px 10px",
                  boxShadow: "0 3px 10px rgba(0,0,0,.22)",
                })}
              >
                {spot.name}
              </Box>
              <Box
                as="span"
                sx={(theme) => ({
                  width: "2px",
                  height: "9px",
                  background: inPkg ? "#8B3FF0" : theme.semantic.primary.normal,
                })}
              />
            </Box>
          );
        })}
      </Box>

      {/* 섹션 타이틀 — 디자인 :249-252 */}
      <Box sx={{ padding: "16px 20px 8px" }}>
        <Box
          as="span"
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: "17px",
            color: theme.semantic.label.normal,
          })}
        >
          {t("main_spots")}
        </Box>
      </Box>
      <Box
        as="p"
        sx={(theme) => ({
          margin: 0,
          padding: "0 20px 12px",
          fontSize: "13px",
          lineHeight: 1.5,
          color: theme.semantic.label.alternative,
        })}
      >
        {t("pick_main_hint")}
      </Box>

      {/* 카테고리 칩 — 디자인 :253-257, 실 DB 카테고리 */}
      <FlexBox gap="8px" sx={{ overflowX: "auto", padding: "2px 20px 12px" }}>
        {catTabs.map((tab) => {
          const active = activeCat === tab.key;
          return (
            <Box
              key={tab.key}
              as="button"
              type="button"
              onClick={() => setActiveCat(tab.key)}
              sx={(theme) => ({
                flex: "0 0 auto",
                border: "none",
                cursor: "pointer",
                borderRadius: "999px",
                padding: "8px 15px",
                fontWeight: 600,
                fontSize: "13px",
                whiteSpace: "nowrap",
                background: active ? theme.semantic.primary.normal : theme.semantic.fill.normal,
                color: active ? theme.semantic.static.white : theme.semantic.label.neutral,
              })}
            >
              {tab.label}
            </Box>
          );
        })}
      </FlexBox>

      {/* 스팟 리스트 — 디자인 :258-273, 실 썸네일·설명 */}
      <FlexBox flexDirection="column" gap="10px" sx={{ padding: "0 20px" }}>
        {filteredSpots.map((spot) => {
          const inPkg = pkgSpotIds.includes(spot.id);
          const tint = categoryTint(spot.categoryKey);
          const goDetail = () => navigate({ to: "/app/spot/$spotId", params: { spotId: spot.id } });

          return (
            <FlexBox
              key={spot.id}
              gap="12px"
              sx={(theme) => ({
                background: theme.semantic.background.normal.normal,
                borderRadius: "16px",
                padding: "12px",
                boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
              })}
            >
              <Box
                as="button"
                type="button"
                onClick={goDetail}
                sx={(theme) => ({
                  flex: "0 0 60px",
                  height: "60px",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "12px",
                  padding: 0,
                  overflow: "hidden",
                  background: theme.semantic.fill.normal,
                  color: theme.semantic.label.assistive,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                {spot.thumbnail ? (
                  <img
                    src={spot.thumbnail}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <IconLocation sx={{ fontSize: "24px" }} />
                )}
              </Box>
              <Box
                as="button"
                type="button"
                onClick={goDetail}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: "left",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <Box
                  sx={(theme) => ({
                    fontWeight: 600,
                    fontSize: "15px",
                    color: theme.semantic.label.normal,
                  })}
                >
                  {spot.name}
                </Box>
                <Box
                  sx={(theme) => ({
                    fontSize: "12px",
                    color: theme.semantic.label.alternative,
                    marginTop: "2px",
                  })}
                >
                  {`${spot.km}km · ${t("approx")} ${spot.driveMinutes}${t("min")}`}
                </Box>
                {spot.description && (
                  <Box
                    sx={(theme) => ({
                      fontSize: "12px",
                      color: theme.semantic.label.neutral,
                      marginTop: "5px",
                      lineHeight: 1.45,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    })}
                  >
                    {spot.description}
                  </Box>
                )}
                <FlexBox gap="5px" sx={{ marginTop: "7px", flexWrap: "wrap" }}>
                  <Box
                    as="span"
                    sx={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: tint.fg,
                      background: tint.bg,
                      borderRadius: "999px",
                      padding: "2px 8px",
                    }}
                  >
                    {spot.categoryLabel}
                  </Box>
                </FlexBox>
              </Box>
              <Box
                as="button"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sessionActions.togglePkgSpot(spot.id);
                }}
                sx={(theme) => ({
                  alignSelf: "center",
                  flexShrink: 0,
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "10px",
                  width: "38px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: inPkg
                    ? addOpacity(theme.semantic.primary.normal, theme.opacity[8])
                    : theme.semantic.fill.normal,
                  color: inPkg ? theme.semantic.primary.normal : theme.semantic.label.neutral,
                })}
              >
                {inPkg ? (
                  <IconCheck sx={{ fontSize: "20px" }} />
                ) : (
                  <IconPlus sx={{ fontSize: "20px" }} />
                )}
              </Box>
            </FlexBox>
          );
        })}
      </FlexBox>

      <Box sx={{ height: "96px" }} />

      {/* 하단 CTA — 디자인 :276-280 */}
      {pkgSpotIds.length > 0 && (
        <Box
          sx={(theme) => ({
            position: "sticky",
            bottom: 0,
            zIndex: 6,
            padding: "12px 20px 16px",
            background: `linear-gradient(180deg, rgba(255,255,255,0), ${theme.semantic.background.normal.normal} 34%)`,
          })}
        >
          <Button
            variant="solid"
            color="primary"
            size="large"
            fullWidth
            onClick={() => navigate({ to: "/app/package" })}
          >
            {pkgCta}
          </Button>
        </Box>
      )}
    </Box>
  );
}
