import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, Button, ContentBadge, FlexBox, addOpacity } from "@wanteddev/wds";
import { IconArrowLeft, IconLocation, IconPlus } from "@wanteddev/wds-icon";

import { getSpotDetail, listNearbySpots } from "@/entities/spot";
import { useI18n } from "@/shared/i18n";
import { usePkgSpotIds, sessionActions } from "@/shared/store";

/** 스팟 상세 — 프로토타입 "SPOT DETAIL"(:283-317) 구조에 실 API(GET /spots/:id) 이미지·설명·태그 적용. */
export function SpotDetailScreen({ spotId }: { spotId: string }) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const pkgSpotIds = usePkgSpotIds();
  const { data: spot } = useQuery({
    queryKey: ["spot-detail", spotId, locale],
    queryFn: () => getSpotDetail(spotId, locale),
  });
  // 주변 추천(디자인 nearby_subs) — 실 nearby 엔드포인트
  const { data: nearby = [] } = useQuery({
    queryKey: ["spot-nearby", spotId, locale],
    queryFn: () => listNearbySpots(spotId, locale),
  });

  if (!spot) return null;

  const hero = spot.images[0] ?? spot.thumbnail;

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
        {/* 히어로 — 실 이미지(images[0] → thumbnail 폴백), 없으면 아이콘 플레이스홀더 */}
        <Box
          sx={(theme) => ({
            position: "relative",
            height: "200px",
            background: theme.semantic.fill.normal,
            color: theme.semantic.label.assistive,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          })}
        >
          {hero ? (
            <img
              src={hero}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <IconLocation sx={{ fontSize: "56px" }} />
          )}
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
              {spot.categoryLabel}
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
            {spot.name}
          </Box>
          <Box sx={(theme) => ({ fontSize: "13px", color: theme.semantic.label.alternative })}>
            {`${spot.km}km ${t("from_port")} · ${t("approx")} ${spot.driveMinutes}${t("min")}`}
          </Box>
          {spot.description && (
            <Box
              as="p"
              sx={(theme) => ({
                margin: "14px 0 0",
                fontSize: "15px",
                lineHeight: 1.6,
                color: theme.semantic.label.neutral,
              })}
            >
              {spot.description}
            </Box>
          )}
          {spot.address && (
            <Box
              sx={(theme) => ({
                marginTop: "10px",
                fontSize: "12px",
                color: theme.semantic.label.alternative,
              })}
            >
              {spot.address}
            </Box>
          )}
          {spot.tags.length > 0 && (
            <FlexBox gap="5px" sx={{ marginTop: "12px", flexWrap: "wrap" }}>
              {spot.tags.slice(0, 6).map((tag) => (
                <Box
                  key={tag}
                  as="span"
                  sx={(theme) => ({
                    fontSize: "11px",
                    fontWeight: 600,
                    color: theme.semantic.label.neutral,
                    background: theme.semantic.fill.normal,
                    borderRadius: "999px",
                    padding: "3px 9px",
                  })}
                >
                  {tag}
                </Box>
              ))}
            </FlexBox>
          )}
        </Box>

        {nearby.length > 0 && (
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
              {nearby.map((sub) => (
                <FlexBox
                  key={sub.id}
                  as="button"
                  type="button"
                  onClick={() => navigate({ to: "/app/spot/$spotId", params: { spotId: sub.id } })}
                  alignItems="center"
                  gap="12px"
                  sx={(theme) => ({
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    cursor: "pointer",
                    background: theme.semantic.background.normal.alternative,
                    borderRadius: "14px",
                    padding: "13px 14px",
                  })}
                >
                  <Box
                    as="span"
                    sx={(theme) => ({
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: theme.semantic.background.normal.normal,
                      boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
                      color: theme.semantic.primary.normal,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    })}
                  >
                    {sub.thumbnail ? (
                      <img
                        src={sub.thumbnail}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <IconLocation sx={{ fontSize: "18px" }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={(theme) => ({
                        fontWeight: 600,
                        fontSize: "14px",
                        color: theme.semantic.label.normal,
                      })}
                    >
                      {sub.name}
                    </Box>
                    <Box
                      sx={(theme) => ({
                        fontSize: "12px",
                        color: theme.semantic.label.alternative,
                      })}
                    >
                      {`${sub.type} · ${sub.distanceKm}km · ${t("approx")} ${sub.walkMinutes}${t("min")}`}
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
