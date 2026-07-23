import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, Button, FlexBox } from "@wanteddev/wds";

import { getCruise } from "@/entities/cruise";
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

  const unitH =
    locale === "ko" ? "시간" : locale === "zh" ? "小时" : locale === "ja" ? "時間" : "h";
  const unitM = locale === "ko" ? "분" : locale === "zh" ? "分" : locale === "ja" ? "分" : "m";
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

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
            <Box
              sx={(theme) => ({
                fontWeight: 700,
                fontSize: "18px",
                color: theme.semantic.primary.normal,
                letterSpacing: ".02em",
              })}
            >
              Omong
            </Box>
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
            {isEmpty ? (
              <>
                <FlexBox flexDirection="column" gap="8px" sx={{ marginBottom: "12px" }}>
                  <Button
                    variant="solid"
                    color="primary"
                    size="large"
                    fullWidth
                    onClick={() => navigate({ to: "/app/explore" })}
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
                        border: `2px dashed ${theme.semantic.line.normal.neutral}`,
                        flexShrink: 0,
                      })}
                    />
                  </FlexBox>
                  <Box
                    as="button"
                    type="button"
                    onClick={() => navigate({ to: "/app/explore" })}
                    sx={(theme) => ({
                      flex: 1,
                      textAlign: "left",
                      border: `1.5px dashed ${theme.semantic.line.normal.neutral}`,
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
            ) : (
              <Box
                sx={(theme) => ({
                  fontWeight: 700,
                  fontSize: "14px",
                  color: theme.semantic.label.normal,
                })}
              >
                {`${t("in_progress")} · ${pkgSpotIds.length}`}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ height: "16px" }} />
    </Box>
  );
}
