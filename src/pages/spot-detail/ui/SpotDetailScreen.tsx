import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, Button, ContentBadge, FlexBox, addOpacity } from "@wanteddev/wds";
import {
  IconArrowLeft,
  IconCoffee,
  IconLocation,
  IconPinFill,
  IconPlus,
  IconSun,
  IconUmbrella,
} from "@wanteddev/wds-icon";
import type { ReactNode } from "react";

import { getSpot, type Spot, spotIconKind } from "@/entities/spot";
import { useI18n } from "@/shared/i18n";
import { usePkgSpotIds, sessionActions } from "@/shared/store";

// 디자인 :288 원본 SVG(수저=food) — WDS에 대응 아이콘 없어 코드로 직접(D2).
function FoodHeroIcon() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3c1.918 0 3.52 1.35 3.91 3.151a4 4 0 0 1 2.09 7.723l0 7.126h-12v-7.126a4 4 0 1 1 2.092 -7.723a4 4 0 0 1 3.908 -3.151" />
      <path d="M6.161 17.009l11.839 -.009" />
    </svg>
  );
}

// 디자인 :288 원본 SVG(산=attraction) — WDS에 대응 아이콘 없어 코드로 직접(D2).
function AttractionHeroIcon() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 20h18l-6.921 -14.612a2.3 2.3 0 0 0 -4.158 0l-6.921 14.612" />
      <path d="M7.5 11l2 2.5l2.5 -2.5l2 3l2.5 -2" />
    </svg>
  );
}

// spot.icon(문자열) → WDS 아이콘. "other" 케이스 전용(:1489 spotIconKind 참고).
const OTHER_HERO_ICONS: Record<string, ReactNode> = {
  coffee: <IconCoffee sx={{ fontSize: "56px" }} />,
  location: <IconLocation sx={{ fontSize: "56px" }} />,
  sun: <IconSun sx={{ fontSize: "56px" }} />,
  umbrella: <IconUmbrella sx={{ fontSize: "56px" }} />,
};

function HeroIcon({ spot }: { spot: Spot }) {
  const kind = spotIconKind(spot.themes);
  if (kind === "food") return <FoodHeroIcon />;
  if (kind === "attraction") return <AttractionHeroIcon />;
  return OTHER_HERO_ICONS[spot.icon] ?? <IconLocation sx={{ fontSize: "56px" }} />;
}

/** 스팟 상세 — 프로토타입 "SPOT DETAIL"(:283-317) 이식. */
export function SpotDetailScreen({ spotId }: { spotId: string }) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const pkgSpotIds = usePkgSpotIds();
  const { data: spot } = useQuery({
    queryKey: ["spot", spotId],
    queryFn: () => getSpot(spotId),
  });

  if (!spot) return null;

  const ensureInPackage = () => {
    if (!pkgSpotIds.includes(spotId)) sessionActions.togglePkgSpot(spotId);
  };

  const handleGoOnly = () => {
    sessionActions.setPkgSpots([spotId]);
    navigate({ to: "/app/package" });
  };

  const handleAddMore = () => {
    ensureInPackage();
    navigate({ to: "/app/theme" });
  };

  return (
    <FlexBox flexDirection="column" sx={{ minHeight: "100dvh" }}>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <Box
          sx={{
            position: "relative",
            height: "170px",
            background: spot.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: spot.iconColor,
          }}
        >
          <HeroIcon spot={spot} />
          <Box
            as="button"
            type="button"
            onClick={() => navigate({ to: "/app/explore" })}
            sx={(theme) => ({
              position: "absolute",
              top: "14px",
              left: "16px",
              width: "36px",
              height: "36px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: addOpacity(theme.semantic.static.white, theme.opacity[88]),
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.semantic.label.normal,
            })}
          >
            <IconArrowLeft sx={{ fontSize: "22px" }} />
          </Box>
        </Box>

        <Box sx={{ padding: "18px 20px 8px" }}>
          <Box sx={{ display: "inline-flex" }}>
            <ContentBadge
              size="small"
              variant="solid"
              color="accent"
              accentColor="semantic.primary.normal"
            >
              {spot.cat[locale]}
            </ContentBadge>
          </Box>
          <Box
            as="h1"
            sx={(theme) => ({
              margin: "10px 0 4px",
              fontWeight: 700,
              fontSize: "23px",
              letterSpacing: "-0.02em",
              color: theme.semantic.label.normal,
            })}
          >
            {spot.name[locale]}
          </Box>
          <Box sx={(theme) => ({ fontSize: "13px", color: theme.semantic.label.alternative })}>
            {`${spot.km}km ${t("from_port")} · ${t("approx")} ${spot.min}${t("min")}`}
          </Box>
          <Box
            as="p"
            sx={(theme) => ({
              margin: "14px 0 0",
              fontSize: "15px",
              lineHeight: 1.6,
              color: theme.semantic.label.neutral,
            })}
          >
            {spot.blurb[locale]}
          </Box>
        </Box>

        {spot.subs.length > 0 && (
          <>
            <Box
              sx={(theme) => ({
                padding: "18px 20px 4px",
                fontWeight: 700,
                fontSize: "16px",
                color: theme.semantic.label.normal,
              })}
            >
              {t("nearby_subs")}
            </Box>
            <FlexBox flexDirection="column" gap="10px" sx={{ padding: "6px 20px 0" }}>
              {spot.subs.map((sub) => (
                <FlexBox
                  key={sub.name[locale]}
                  alignItems="center"
                  gap="12px"
                  sx={(theme) => ({
                    background: theme.semantic.background.normal.alternative,
                    borderRadius: "14px",
                    padding: "13px 14px",
                  })}
                >
                  <FlexBox
                    alignItems="center"
                    justifyContent="center"
                    sx={(theme) => ({
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: theme.semantic.background.normal.normal,
                      boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
                      color: theme.semantic.primary.normal,
                      flexShrink: 0,
                    })}
                  >
                    <IconPinFill sx={{ fontSize: "18px" }} />
                  </FlexBox>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={(theme) => ({
                        fontWeight: 600,
                        fontSize: "14px",
                        color: theme.semantic.label.normal,
                      })}
                    >
                      {sub.name[locale]}
                    </Box>
                    <Box
                      sx={(theme) => ({
                        fontSize: "12px",
                        color: theme.semantic.label.alternative,
                      })}
                    >
                      {`${sub.type[locale]} · ${sub.blurb[locale]}`}
                    </Box>
                  </Box>
                </FlexBox>
              ))}
            </FlexBox>
          </>
        )}
        <Box sx={{ height: "150px" }} />
      </Box>

      <FlexBox
        flexDirection="column"
        gap="10px"
        sx={(theme) => ({
          padding: "12px 20px 18px",
          borderTop: `1px solid ${theme.semantic.line.normal.neutral}`,
          flexShrink: 0,
        })}
      >
        <Button variant="solid" color="primary" size="large" fullWidth onClick={handleGoOnly}>
          {t("spot_go_only")}
        </Button>
        <Button
          variant="outlined"
          color="assistive"
          size="large"
          fullWidth
          leadingContent={<IconPlus sx={{ fontSize: "18px" }} />}
          onClick={handleAddMore}
        >
          {t("spot_add_more")}
        </Button>
      </FlexBox>
    </FlexBox>
  );
}
