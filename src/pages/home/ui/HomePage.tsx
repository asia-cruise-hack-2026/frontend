import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, Button, FlexBox } from "@wanteddev/wds";
import { IconChevronRight } from "@wanteddev/wds-icon";

import { getCruise } from "@/entities/cruise";
import { buildCourse, listSpots, type Spot } from "@/entities/spot";
import { useI18n } from "@/shared/i18n";
import { useCruiseId, usePkgSpotIds } from "@/shared/store";

// 포트 배지 선박 아이콘 — 디자인 :135
function ShipMini() {
  return (
    <svg
      width="14"
      height="14"
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

// 이동 leg 배지 택시 아이콘 — 디자인 :187
function TaxiGlyph() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5" />
    </svg>
  );
}

/** 홈 — 프로토타입 "Home"(:124-227) 이식. S1은 빈 일정 상태가 기본(코스 생성은 S3). 지도는 S2에서 교체. */
export function HomePage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const cruiseId = useCruiseId();
  const pkgSpotIds = usePkgSpotIds();
  const { data: cruise } = useQuery({
    queryKey: ["cruise", cruiseId],
    queryFn: () => getCruise(cruiseId ?? ""),
    enabled: !!cruiseId,
  });
  const portKey = cruise?.portKey ?? "jeju";
  const { data: allSpots = [] } = useQuery({
    queryKey: ["spots", portKey],
    queryFn: () => listSpots({ portKey }),
  });

  const unitH =
    locale === "ko" ? "시간" : locale === "zh" ? "小时" : locale === "ja" ? "時間" : "h";
  const unitM = locale === "ko" ? "분" : locale === "zh" ? "分" : locale === "ja" ? "分" : "m";
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  // 스팟간 실거리 기반 이동 분 — entities/spot/lib/course.ts의 private legMin과 동일 공식(디자인 :1538)
  const legMin = (km: number) => Math.max(8, Math.round(km * 2.2));

  // 디자인 renderVals :1479-1486 (now = 도착 90분 후로 시뮬레이션)
  const derived = cruise
    ? (() => {
        const nowM = cruise.arrM + 90;
        const remM = Math.max(0, cruise.depM - nowM);
        return {
          remH: Math.floor(remM / 60),
          remMin: remM % 60,
          boardBy: fmt(cruise.depM - 30),
          stayPct: Math.round(((nowM - cruise.arrM) / (cruise.depM - cruise.arrM)) * 100),
        };
      })()
    : null;

  const isEmpty = pkgSpotIds.length === 0;

  // 현재 경로 타임라인(hasPkg) — 디자인 :170-205 + renderVals :1567-1571
  const spots = pkgSpotIds
    .map((id) => allSpots.find((s) => s.id === id))
    .filter((s): s is Spot => s != null);
  const course = cruise ? buildCourse(spots, cruise) : null;
  const firstSpot = spots[0];
  const firstStop = course?.stops[0];
  const moreLabel =
    locale === "ko"
      ? `전체 ${spots.length}곳 경로 보기`
      : locale === "ja"
        ? `全${spots.length}件のルート`
        : locale === "zh"
          ? `查看全部${spots.length}个`
          : `View all ${spots.length} stops`;

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100%",
        background: theme.semantic.background.normal.alternative,
      })}
    >
      {cruise && derived && (
        <Box
          sx={(theme) => ({
            padding: "18px 20px 8px",
            background: theme.semantic.background.normal.normal,
          })}
        >
          <FlexBox alignItems="flex-start" justifyContent="space-between" gap="10px">
            <img
              src="/brand/omong.svg"
              alt="OMONG"
              style={{ height: "26px", width: "auto", display: "block", objectFit: "contain" }}
            />
            <FlexBox
              as="span"
              alignItems="center"
              gap="5px"
              sx={(theme) => ({
                flexShrink: 0,
                background: theme.semantic.fill.normal,
                color: theme.semantic.label.neutral,
                borderRadius: "999px",
                padding: "6px 11px",
                fontSize: "12px",
                fontWeight: 700,
                marginTop: "2px",
              })}
            >
              <Box as="span" sx={{ display: "inline-flex" }}>
                <ShipMini />
              </Box>
              {cruise.portName[locale]}
            </FlexBox>
          </FlexBox>

          <Box
            sx={(theme) => ({
              marginTop: "14px",
              background: `linear-gradient(135deg, ${theme.semantic.primary.normal}, #2E7BFF)`,
              borderRadius: "16px",
              padding: "16px 18px",
              color: theme.semantic.static.white,
            })}
          >
            <FlexBox alignItems="baseline" justifyContent="space-between" gap="10px">
              <Box sx={{ fontSize: "14px", opacity: 0.92, fontWeight: 600 }}>
                {t("until_departure")}
              </Box>
              <FlexBox alignItems="baseline" gap="3px">
                <Box
                  as="span"
                  sx={{
                    fontWeight: 800,
                    fontSize: "28px",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {derived.remH}
                </Box>
                <Box
                  as="span"
                  sx={{ fontSize: "13px", fontWeight: 600, opacity: 0.9, marginRight: "5px" }}
                >
                  {unitH}
                </Box>
                <Box
                  as="span"
                  sx={{
                    fontWeight: 800,
                    fontSize: "28px",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {derived.remMin}
                </Box>
                <Box as="span" sx={{ fontSize: "13px", fontWeight: 600, opacity: 0.9 }}>
                  {unitM}
                </Box>
              </FlexBox>
            </FlexBox>
            <Box
              sx={{
                marginTop: "14px",
                height: "7px",
                borderRadius: "999px",
                background: "rgba(255,255,255,.28)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${derived.stayPct}%`,
                  height: "100%",
                  borderRadius: "999px",
                  background: "#fff",
                }}
              />
            </Box>
            <FlexBox
              justifyContent="space-between"
              sx={{ marginTop: "8px", fontSize: "11px", opacity: 0.9, fontWeight: 600 }}
            >
              <Box as="span">{`${t("arrive_label")} ${cruise.arr}`}</Box>
              <Box as="span">{`${t("board_by")} ${derived.boardBy}`}</Box>
            </FlexBox>
          </Box>
        </Box>
      )}

      <Box sx={{ padding: "16px 20px 4px" }}>
        <Box
          sx={(theme) => ({
            background: theme.semantic.background.normal.normal,
            borderRadius: "20px",
            boxShadow: `0 8px 26px rgba(15,40,80,.08), inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
            overflow: "hidden",
          })}
        >
          {/* 지도 placeholder — S2에서 Google Maps(client-only)로 교체 */}
          <Box sx={{ position: "relative", height: "270px", background: "#CFE4F2" }}>
            {cruise && (
              <FlexBox
                as="span"
                alignItems="center"
                gap="5px"
                sx={(theme) => ({
                  position: "absolute",
                  top: "10px",
                  left: "12px",
                  background: "rgba(255,255,255,.92)",
                  borderRadius: "999px",
                  padding: "5px 11px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: theme.semantic.label.normal,
                })}
              >
                {cruise.portName[locale]}
              </FlexBox>
            )}
          </Box>
          <Box
            sx={(theme) => ({ height: "1px", background: theme.semantic.line.normal.neutral })}
          />

          <Box sx={{ padding: "16px 18px 18px" }}>
            {isEmpty && (
              <>
                <FlexBox flexDirection="column" gap="8px" sx={{ marginBottom: "12px" }}>
                  <Button
                    variant="solid"
                    color="primary"
                    size="large"
                    fullWidth
                    onClick={() => navigate({ to: "/app/concept" })}
                  >
                    {t("home_ai_fill")}
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    fullWidth
                    onClick={() => navigate({ to: "/app/explore" })}
                  >
                    {t("home_add")}
                  </Button>
                </FlexBox>
                <FlexBox gap="13px">
                  <FlexBox
                    flexDirection="column"
                    alignItems="center"
                    sx={{ width: "32px", flexShrink: 0 }}
                  >
                    <Box
                      sx={(theme) => ({
                        width: "30px",
                        height: "30px",
                        borderRadius: "999px",
                        border: `2px dashed ${theme.semantic.line.normal.normal}`,
                        flexShrink: 0,
                      })}
                    />
                  </FlexBox>
                  <Box
                    as="button"
                    type="button"
                    onClick={() => navigate({ to: "/app/concept" })}
                    sx={(theme) => ({
                      flex: 1,
                      textAlign: "left",
                      border: `1.5px dashed ${theme.semantic.line.normal.normal}`,
                      background: theme.semantic.background.normal.alternative,
                      borderRadius: "14px",
                      padding: "14px 15px",
                      cursor: "pointer",
                    })}
                  >
                    <Box
                      sx={(theme) => ({
                        fontWeight: 600,
                        fontSize: "14px",
                        color: theme.semantic.label.normal,
                      })}
                    >
                      {t("home_empty_t")}
                    </Box>
                    <Box
                      sx={(theme) => ({
                        fontSize: "12px",
                        color: theme.semantic.label.alternative,
                        marginTop: "3px",
                        lineHeight: 1.45,
                      })}
                    >
                      {t("home_empty_s")}
                    </Box>
                  </Box>
                </FlexBox>
              </>
            )}
            {!isEmpty && cruise && firstSpot && firstStop && (
              <>
                {/* 헤더행 — 디자인 :171-174 */}
                <FlexBox
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ marginBottom: "14px" }}
                >
                  <Box
                    as="span"
                    sx={(theme) => ({
                      fontWeight: 700,
                      fontSize: "14px",
                      color: theme.semantic.label.normal,
                    })}
                  >
                    {t("in_progress")}
                  </Box>
                  <Box
                    as="button"
                    type="button"
                    onClick={() => navigate({ to: "/app/package" })}
                    sx={(theme) => ({
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: "13px",
                      fontWeight: 700,
                      color: theme.semantic.primary.normal,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    })}
                  >
                    {t("view_detail")}
                    <IconChevronRight sx={{ fontSize: "16px" }} />
                  </Box>
                </FlexBox>

                {/* 현위치 노드 — 디자인 :175-184 */}
                <FlexBox gap="13px">
                  <FlexBox
                    flexDirection="column"
                    alignItems="center"
                    sx={{ width: "32px", flexShrink: 0, paddingTop: "3px" }}
                  >
                    <Box
                      as="span"
                      sx={(theme) => ({
                        width: "13px",
                        height: "13px",
                        borderRadius: "999px",
                        background: theme.semantic.status.positive,
                        boxShadow: "0 0 0 4px #EAF7EE",
                        flexShrink: 0,
                      })}
                    />
                    <Box
                      as="span"
                      sx={(theme) => ({
                        flex: 1,
                        width: "2px",
                        background: theme.semantic.line.normal.neutral,
                        marginTop: "4px",
                        minHeight: "14px",
                      })}
                    />
                  </FlexBox>
                  <Box sx={{ flex: 1, minWidth: 0, paddingBottom: "8px" }}>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: theme.semantic.status.positive,
                      })}
                    >
                      {t("cur_loc")}
                    </Box>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        display: "block",
                        fontWeight: 600,
                        fontSize: "15px",
                        color: theme.semantic.label.normal,
                      })}
                    >
                      {cruise.portName[locale]}
                    </Box>
                  </Box>
                </FlexBox>

                {/* 이동 leg 배지 — 디자인 :185-188 */}
                <FlexBox alignItems="stretch" gap="13px" sx={{ margin: "-2px 0 6px" }}>
                  <FlexBox justifyContent="center" sx={{ width: "32px", flexShrink: 0 }}>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        width: "2px",
                        background: theme.semantic.line.normal.neutral,
                      })}
                    />
                  </FlexBox>
                  <FlexBox
                    as="span"
                    alignItems="center"
                    gap="5px"
                    sx={(theme) => ({
                      alignSelf: "center",
                      background: theme.semantic.background.normal.alternative,
                      borderRadius: "999px",
                      padding: "4px 11px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: theme.semantic.label.neutral,
                    })}
                  >
                    <Box as="span" sx={{ display: "inline-flex" }}>
                      <TaxiGlyph />
                    </Box>
                    {`${t("t_taxi")} ${t("approx")} ${legMin(firstSpot.km)}${t("min")}`}
                  </FlexBox>
                </FlexBox>

                {/* 다음 목적지 노드 — 디자인 :189-198 */}
                <FlexBox gap="13px">
                  <FlexBox
                    flexDirection="column"
                    alignItems="center"
                    sx={{ width: "32px", flexShrink: 0 }}
                  >
                    <Box
                      as="span"
                      sx={(theme) => ({
                        width: "30px",
                        height: "30px",
                        borderRadius: "999px",
                        background: theme.semantic.primary.normal,
                        color: theme.semantic.static.white,
                        fontWeight: 700,
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      })}
                    >
                      1
                    </Box>
                  </FlexBox>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: theme.semantic.primary.normal,
                      })}
                    >
                      {t("next_loc")}
                    </Box>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        display: "block",
                        fontWeight: 600,
                        fontSize: "15px",
                        color: theme.semantic.label.normal,
                      })}
                    >
                      {firstSpot.name[locale]}
                    </Box>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        display: "block",
                        fontSize: "12px",
                        color: theme.semantic.label.alternative,
                        marginTop: "2px",
                      })}
                    >
                      {`${fmt(firstStop.startMin)} · ${firstStop.stayMin}${t("min")}`}
                    </Box>
                  </Box>
                </FlexBox>

                {/* 전체 경로 보기 — 디자인 :199-201, 스팟 2곳 이상만 */}
                {spots.length > 1 && (
                  <Box
                    as="button"
                    type="button"
                    onClick={() => navigate({ to: "/app/package" })}
                    sx={(theme) => ({
                      width: "100%",
                      marginTop: "14px",
                      border: "none",
                      cursor: "pointer",
                      background: theme.semantic.background.normal.alternative,
                      borderRadius: "12px",
                      padding: "12px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: theme.semantic.primary.normal,
                    })}
                  >
                    {moreLabel}
                  </Box>
                )}

                {/* 택시 부르기 CTA — 디자인 :202-204 */}
                <Box sx={{ marginTop: "10px" }}>
                  <Button
                    variant="solid"
                    color="primary"
                    size="large"
                    fullWidth
                    onClick={() => navigate({ to: "/app/transport" })}
                  >
                    {t("call_taxi_home")}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ height: "16px" }} />
    </Box>
  );
}
