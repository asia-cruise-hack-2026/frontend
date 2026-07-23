import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { addOpacity, Box, Button, FlexBox } from "@wanteddev/wds";
import { IconArrowLeft, IconCheck, IconLocation, IconPlus } from "@wanteddev/wds-icon";
import { useEffect, useState } from "react";

import { getCruise } from "@/entities/cruise";
import { categoryTint, listReachableSpots } from "@/entities/spot";
import { useI18n } from "@/shared/i18n";
import { sessionActions, useCruiseId, usePkgSpotIds } from "@/shared/store";
import { PortMap } from "@/widgets/port-map";

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
  // 실 DB 스팟 — 패키지/홈/테마와 동일 소스·캐시 키
  const { data: spots = [] } = useQuery({
    queryKey: ["reachable-spots", cruiseId, locale, 30],
    queryFn: () => listReachableSpots(cruiseId ?? "", locale, 30),
    enabled: !!cruiseId,
  });

  // 실 목록에 없는 잔여 id(과거 mock 등) 정리 — 카운트 오염 방지
  useEffect(() => {
    if (spots.length > 0) sessionActions.prunePkgSpots(spots.map((s) => s.id));
  }, [spots]);

  const resolvedCount = pkgSpotIds.filter((id) => spots.some((s) => s.id === id)).length;
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

  const portLabel = cruise?.portName ?? "";
  const portPt = { lat: cruise?.portLat ?? 33.523, lng: cruise?.portLng ?? 126.537 };
  const mapSpots = spots.slice(0, 10);

  // 디자인 renderVals :1713 — pkgCta 문구 이식
  const pkgCta =
    locale === "ko"
      ? `${resolvedCount}곳으로 경로 만들기`
      : locale === "zh"
        ? `${resolvedCount}个地点·生成路线`
        : locale === "ja"
          ? `${resolvedCount}件でルート作成`
          : `Build route · ${resolvedCount} to my day`;

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

      {/* 실지도 — 정박항·스팟 pill 마커(PortMap), 마커 탭 = 스팟 상세 */}
      <Box sx={{ position: "relative", height: "250px" }}>
        <PortMap
          port={portPt}
          portName={portLabel}
          spots={mapSpots}
          interactive
          onSpotClick={(s) => navigate({ to: "/app/spot/$spotId", params: { spotId: s.id } })}
        />
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
      {resolvedCount > 0 && (
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
            onClick={() => navigate({ to: "/app/package", search: { from: "picker" } })}
          >
            {pkgCta}
          </Button>
        </Box>
      )}
    </Box>
  );
}
