import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { addOpacity, Box, Button, FlexBox } from "@wanteddev/wds";
import {
  IconArrowLeft,
  IconCheck,
  IconCoffee,
  IconLocation,
  IconPlus,
  IconSun,
  IconUmbrella,
} from "@wanteddev/wds-icon";
import { type ReactNode, useState } from "react";

import { getCruise } from "@/entities/cruise";
import { listSpots, type Spot, spotIconKind, THEME_TINT } from "@/entities/spot";
import { useI18n } from "@/shared/i18n";
import { sessionActions, useCruiseId, usePkgSpotIds } from "@/shared/store";

// src/pages/explore/ui/ExploreScreen.tsx와 동일 산출물 — entities/spot엔 아이콘 export가 없어 로컬 복제,
// 디자인 :393 원본 음식 SVG(spotIconKind==="food") — WDS 대응 아이콘 없어 코드로 직접(D2).
function FoodGlyph() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3c1.918 0 3.52 1.35 3.91 3.151a4 4 0 0 1 2.09 7.723l0 7.126h-12v-7.126a4 4 0 1 1 2.092 -7.723a4 4 0 0 1 3.908 -3.151" />
      <path d="M6.161 17.009l11.839 -.009" />
    </svg>
  );
}

// ExploreScreen.tsx와 동일 산출물 — 디자인 :393 원본 관광 SVG(spotIconKind==="attraction") — WDS 대응 아이콘 없어 코드로 직접(D2).
function MountainGlyph() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 20h18l-6.921 -14.612a2.3 2.3 0 0 0 -4.158 0l-6.921 14.612" />
      <path d="M7.5 11l2 2.5l2.5 -2.5l2 3l2.5 -2" />
    </svg>
  );
}

// spotIconKind==="other"일 때 spot.icon 이름 → WDS 아이콘 매핑(mock 데이터 기준 coffee/location/sun/umbrella).
// ExploreScreen.tsx와 동일.
const OTHER_SPOT_ICONS: Record<string, ReactNode> = {
  coffee: <IconCoffee sx={{ fontSize: "26px" }} />,
  location: <IconLocation sx={{ fontSize: "26px" }} />,
  sun: <IconSun sx={{ fontSize: "26px" }} />,
  umbrella: <IconUmbrella sx={{ fontSize: "26px" }} />,
};

type ThemeKey = keyof typeof THEME_TINT;
const THEME_KEYS: ThemeKey[] = ["attraction", "food", "cafe", "package"];

/** 테마 선택(수동 스팟 고르기) — 디자인 "THEME + SPOTS"(:355-412) 이식. */
export function ThemeSelectPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const cruiseId = useCruiseId();
  const pkgSpotIds = usePkgSpotIds();
  const [themeIds, setThemeIds] = useState<ThemeKey[]>([]);

  const { data: cruise } = useQuery({
    queryKey: ["cruise", cruiseId],
    queryFn: () => getCruise(cruiseId ?? ""),
    enabled: !!cruiseId,
  });
  const portKey = cruise?.portKey ?? "jeju";
  const { data: spots = [] } = useQuery({
    queryKey: ["spots", portKey],
    queryFn: () => listSpots({ portKey }),
  });

  const toggleTheme = (key: ThemeKey) =>
    setThemeIds((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  // 디자인 renderVals :1503 — themeIds 비면 전체, 있으면 하나라도 겹치는 스팟(교집합)
  const filteredSpots: Spot[] =
    themeIds.length === 0
      ? spots
      : spots.filter((s) => themeIds.some((id) => s.themes.includes(id)));

  // 디자인 renderVals :1515 spotpickCta 이식 — ExploreScreen의 pkgCta와 동일 패턴
  const confirmCta =
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
      {/* 헤더 — 디자인 :358-362 */}
      <FlexBox alignItems="center" sx={{ height: "52px", padding: "0 8px" }}>
        <Box
          as="button"
          type="button"
          onClick={() => navigate({ to: "/app" })}
          sx={(theme) => ({
            width: "40px",
            height: "40px",
            border: "none",
            cursor: "pointer",
            background: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.semantic.label.normal,
          })}
        >
          <IconArrowLeft sx={{ fontSize: "24px" }} />
        </Box>
      </FlexBox>
      <Box sx={{ padding: "2px 20px 12px" }}>
        <Box
          as="h1"
          sx={(theme) => ({
            margin: "0 0 6px",
            fontWeight: 700,
            fontSize: "22px",
            lineHeight: 1.36,
            letterSpacing: "-0.02em",
            color: theme.semantic.label.normal,
          })}
        >
          {t("pick_title")}
        </Box>
        <Box
          as="p"
          sx={(theme) => ({
            margin: 0,
            fontSize: "14px",
            lineHeight: 1.5,
            color: theme.semantic.label.alternative,
          })}
        >
          {t("pick_sub")}
        </Box>
      </Box>

      {/* 테마 칩 — 디자인 :364-368, 다중 토글(로컬 themeIds) */}
      <FlexBox gap="8px" sx={{ overflowX: "auto", padding: "2px 20px 14px" }}>
        {THEME_KEYS.map((key) => {
          const active = themeIds.includes(key);
          return (
            <Box
              key={key}
              as="button"
              type="button"
              onClick={() => toggleTheme(key)}
              sx={(theme) => ({
                flex: "0 0 auto",
                border: "none",
                cursor: "pointer",
                borderRadius: "999px",
                padding: "9px 15px",
                fontWeight: 600,
                fontSize: "13px",
                background: active ? THEME_TINT[key].bg : theme.semantic.fill.normal,
                color: active ? THEME_TINT[key].fg : theme.semantic.label.neutral,
              })}
            >
              {t(`th_${key}`)}
            </Box>
          );
        })}
      </FlexBox>

      {/* 스팟 리스트 — 디자인 :383-402, 카드는 ExploreScreen과 동일 */}
      <FlexBox flexDirection="column" gap="10px" sx={{ padding: "0 20px" }}>
        {filteredSpots.map((spot) => {
          const inPkg = pkgSpotIds.includes(spot.id);
          const iconKind = spotIconKind(spot.themes);
          let iconNode: ReactNode;
          if (iconKind === "food") iconNode = <FoodGlyph />;
          else if (iconKind === "attraction") iconNode = <MountainGlyph />;
          else iconNode = OTHER_SPOT_ICONS[spot.icon] ?? null;

          const goDetail = () => navigate({ to: "/app/spot/$spotId", params: { spotId: spot.id } });

          return (
            <FlexBox
              key={spot.id}
              gap="12px"
              sx={(theme) => ({
                background: theme.semantic.background.normal.normal,
                borderRadius: "16px",
                padding: "12px",
                boxShadow: inPkg
                  ? `inset 0 0 0 2px ${theme.semantic.primary.normal}`
                  : `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
              })}
            >
              <Box
                as="button"
                type="button"
                onClick={goDetail}
                sx={{
                  flex: "0 0 60px",
                  height: "60px",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "12px",
                  background: spot.color,
                  color: spot.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {iconNode}
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
                  {spot.name[locale]}
                </Box>
                <Box
                  sx={(theme) => ({
                    fontSize: "12px",
                    color: theme.semantic.label.alternative,
                    marginTop: "2px",
                  })}
                >
                  {`${spot.cat[locale]} · ${spot.km}km · ${t("approx")} ${spot.min}${t("min")}`}
                </Box>
                <FlexBox gap="5px" sx={{ marginTop: "7px", flexWrap: "wrap" }}>
                  {spot.themes
                    .filter((themeKey): themeKey is ThemeKey => Object.hasOwn(THEME_TINT, themeKey))
                    .map((themeKey) => (
                      <Box
                        key={themeKey}
                        as="span"
                        sx={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: THEME_TINT[themeKey].fg,
                          background: THEME_TINT[themeKey].bg,
                          borderRadius: "999px",
                          padding: "2px 8px",
                        }}
                      >
                        {t(`th_${themeKey}`)}
                      </Box>
                    ))}
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

      <Box sx={{ height: "16px" }} />

      {/* 하단 고정 확정 버튼 — 디자인 :403-407(spotpickCta), 선택 없으면 disabled */}
      <Box
        sx={(theme) => ({
          position: "sticky",
          bottom: 0,
          zIndex: 6,
          padding: "12px 20px 18px",
          borderTop: `1px solid ${theme.semantic.line.normal.neutral}`,
          background: theme.semantic.background.normal.normal,
        })}
      >
        <Button
          variant="solid"
          color="primary"
          size="large"
          fullWidth
          disabled={pkgSpotIds.length === 0}
          onClick={() => navigate({ to: "/app/package" })}
        >
          {confirmCta}
        </Button>
      </Box>
    </Box>
  );
}
