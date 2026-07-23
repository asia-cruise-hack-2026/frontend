import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { addOpacity, Box, Button, FlexBox } from "@wanteddev/wds";
import {
  IconArrowLeft,
  IconCheck,
  IconCircleCheckFill,
  IconCoffee,
  IconLocation,
  IconPlus,
  IconSun,
  IconTicket,
  IconTriangleExclamationFill,
  IconUmbrella,
} from "@wanteddev/wds-icon";
import { type ReactNode, useState } from "react";

import { getCruise } from "@/entities/cruise";
import {
  availableMinutes,
  categoryTint,
  courseSlack,
  listReachableSpots,
  type ReachableSpot,
} from "@/entities/spot";
import { useI18n } from "@/shared/i18n";
import { sessionActions, useCruiseId, usePkgSpotIds } from "@/shared/store";

// 디자인 :393 원본 음식/관광 SVG — WDS 대응 아이콘 없어 코드로 직접(D2).
function FoodGlyph({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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

function MountainGlyph({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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

const CATEGORY_CHIP_ICON: Record<string, ReactNode> = {
  culture: <IconTicket sx={{ fontSize: "17px" }} />,
  nature: <MountainGlyph size={17} />,
  attraction: <IconLocation sx={{ fontSize: "17px" }} />,
  activity: <IconSun sx={{ fontSize: "17px" }} />,
  wellness: <IconCoffee sx={{ fontSize: "17px" }} />,
  food: <FoodGlyph size={17} />,
  beach: <IconUmbrella sx={{ fontSize: "17px" }} />,
};

/** 테마(카테고리) 선택 — 디자인 "THEME + SPOTS"(:355-412) 구조에 실 DB 스팟·카테고리·썸네일 적용. */
export function ThemeSelectPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const cruiseId = useCruiseId();
  const pkgSpotIds = usePkgSpotIds();
  const [catKeys, setCatKeys] = useState<string[]>([]);

  const { data: cruise } = useQuery({
    queryKey: ["cruise", cruiseId, locale],
    queryFn: () => getCruise(cruiseId ?? "", locale),
    enabled: !!cruiseId,
  });
  // 실 DB 스팟 — 컨셉/패키지/홈과 동일 소스·캐시 키
  const { data: spots = [] } = useQuery({
    queryKey: ["reachable-spots", cruiseId, locale, 30],
    queryFn: () => listReachableSpots(cruiseId ?? "", locale, 30),
    enabled: !!cruiseId,
  });

  // 카테고리 칩 — 로드된 스팟에서 도출(빈도순), 별도 엔드포인트 불필요
  const categories = (() => {
    const seen = new Map<string, { key: string; label: string; count: number }>();
    for (const s of spots) {
      const c = seen.get(s.categoryKey);
      if (c) c.count += 1;
      else seen.set(s.categoryKey, { key: s.categoryKey, label: s.categoryLabel, count: 1 });
    }
    return [...seen.values()].sort((a, b) => b.count - a.count);
  })();

  const toggleCat = (key: string) =>
    setCatKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  // 디자인 renderVals :1503 — 선택 없으면 전체, 있으면 해당 카테고리
  const filteredSpots: ReachableSpot[] =
    catKeys.length === 0 ? spots : spots.filter((s) => catKeys.includes(s.categoryKey));

  // 디자인 renderVals :1513 pickHeading 이식 — count 보간이라 strings.ts에 카탈로그 키가 없어 confirmCta와 동일하게 로컬 분기
  const pickHeading =
    catKeys.length > 0
      ? locale === "ko"
        ? `이 테마와 어울리는 곳 ${filteredSpots.length}`
        : locale === "zh"
          ? `符合主题 ${filteredSpots.length}`
          : locale === "ja"
            ? `テーマに合う ${filteredSpots.length}件`
            : `${filteredSpots.length} matching spots`
      : locale === "ko"
        ? `전체 관광지 ${filteredSpots.length}`
        : locale === "zh"
          ? `全部景点 ${filteredSpots.length}`
          : locale === "ja"
            ? `すべて ${filteredSpots.length}件`
            : `All spots ${filteredSpots.length}`;

  // 예산 배너(디자인 :375-384) — pkgSpotIds→spots 매핑 후 courseSlack으로 fits 판정, pkgSpotIds 비면 배너 숨김
  const pkgSpots: ReachableSpot[] = pkgSpotIds
    .map((id) => spots.find((s) => s.id === id))
    .filter((s): s is ReachableSpot => s != null);
  const availMin = cruise ? availableMinutes(cruise) : 0;
  const budget = cruise && pkgSpots.length > 0 ? courseSlack(pkgSpots, cruise) : null;

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
        background: theme.semantic.background.normal.normal,
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

      {/* 카테고리 칩 — 디자인 :364-368 구조, 실 DB 카테고리 다중 토글 */}
      <FlexBox gap="8px" sx={{ overflowX: "auto", padding: "2px 20px 14px" }}>
        {categories.map((cat) => {
          const active = catKeys.includes(cat.key);
          const tint = categoryTint(cat.key);
          return (
            <Box
              key={cat.key}
              as="button"
              type="button"
              onClick={() => toggleCat(cat.key)}
              sx={(theme) => ({
                flex: "0 0 auto",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                border: "none",
                cursor: "pointer",
                borderRadius: "999px",
                padding: "9px 15px 9px 12px",
                fontWeight: 600,
                fontSize: "13px",
                whiteSpace: "nowrap",
                background: active ? tint.bg : theme.semantic.background.normal.normal,
                color: active ? tint.fg : theme.semantic.label.neutral,
                boxShadow: active
                  ? `inset 0 0 0 1.5px ${tint.fg}`
                  : `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
              })}
            >
              <Box
                as="span"
                sx={(theme) => ({
                  display: "inline-flex",
                  color: active ? tint.fg : theme.semantic.label.assistive,
                })}
              >
                {CATEGORY_CHIP_ICON[cat.key] ?? <IconLocation sx={{ fontSize: "17px" }} />}
              </Box>
              {cat.label}
            </Box>
          );
        })}
      </FlexBox>

      {/* 예산 배너 — 디자인 :375-384, pkgSpotIds 비면 숨김 */}
      {budget && (
        <FlexBox
          alignItems="center"
          gap="10px"
          sx={{
            margin: "0 20px 12px",
            borderRadius: "12px",
            padding: "11px 14px",
            background: budget.fits ? "#EAF7EE" : "#FFF4E5",
          }}
        >
          <Box
            as="span"
            sx={(theme) => ({
              display: "inline-flex",
              flexShrink: 0,
              color: budget.fits ? theme.semantic.status.positive : "#B5620A",
            })}
          >
            {budget.fits ? (
              <IconCircleCheckFill sx={{ fontSize: "18px" }} />
            ) : (
              <IconTriangleExclamationFill sx={{ fontSize: "18px" }} />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={(theme) => ({
                fontWeight: 700,
                fontSize: "13px",
                color: budget.fits ? theme.semantic.status.positive : "#B5620A",
              })}
            >
              {budget.fits ? t("fits_stay") : t("fits_over")}
            </Box>
            <Box
              sx={(theme) => ({
                fontSize: "11px",
                color: theme.semantic.label.alternative,
                marginTop: "1px",
              })}
            >
              {`${t("budget_est")} ${budget.totalMin}${t("min")} · ${t("budget_stay")} ${availMin}${t("min")}`}
            </Box>
          </Box>
          <Box
            as="span"
            sx={(theme) => ({
              flexShrink: 0,
              fontWeight: 700,
              fontSize: "13px",
              color: budget.fits ? theme.semantic.status.positive : "#B5620A",
            })}
          >
            {`${budget.slackMin >= 0 ? "+" : "-"}${Math.abs(budget.slackMin)}${t("min")}`}
          </Box>
        </FlexBox>
      )}

      {/* 스팟 개수 헤딩 + 전체보기 — 디자인 :386-389 */}
      <FlexBox
        alignItems="center"
        justifyContent="space-between"
        sx={{ padding: "0 20px", marginBottom: "10px" }}
      >
        <Box
          as="span"
          sx={(theme) => ({
            fontSize: "13px",
            fontWeight: 600,
            color: theme.semantic.label.neutral,
          })}
        >
          {pickHeading}
        </Box>
        {catKeys.length > 0 && (
          <Box
            as="button"
            type="button"
            onClick={() => setCatKeys([])}
            sx={(theme) => ({
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              color: theme.semantic.primary.normal,
            })}
          >
            {t("show_all")}
          </Box>
        )}
      </FlexBox>

      {/* 스팟 리스트 — 디자인 :383-402 카드 구조에 실 썸네일 */}
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
                boxShadow: inPkg
                  ? `inset 0 0 0 2px ${theme.semantic.primary.normal}`
                  : `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
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
                  {`${spot.km}km · ${t("approx")} ${spot.driveMinutes}${t("min")} · ${t("budget_stay")} ${spot.stayMinutes}${t("min")}`}
                </Box>
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
