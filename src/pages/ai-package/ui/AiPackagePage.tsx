import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, Button, FlexBox } from "@wanteddev/wds";
import {
  IconArrowLeft,
  IconCircleCheckFill,
  IconClose,
  IconSparkleFill,
  IconTriangleExclamationFill,
} from "@wanteddev/wds-icon";
import { useEffect, useState } from "react";

import { getCruise } from "@/entities/cruise";
import {
  availableMinutes,
  buildCourse,
  listSpots,
  type CourseStop,
  type Spot,
} from "@/entities/spot";
import { type Locale, type StringKey, useI18n } from "@/shared/i18n";
import { sessionActions, useCruiseId, usePkgSpotIds } from "@/shared/store";

const AI_STEP_KEYS = [
  "ai_step1",
  "ai_step2",
  "ai_step3",
  "ai_step4",
] as const satisfies readonly StringKey[];
const AI_STEP_INTERVAL_MS = 850; // 디자인 startAi :1140-1141

const AI_LOADING_KEYFRAMES =
  "@keyframes aip-pulse{0%{transform:scale(.5);opacity:.65}100%{transform:scale(2.6);opacity:0}}" +
  "@keyframes aip-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}" +
  "@keyframes aip-spin{to{transform:rotate(360deg)}}";

// 시각 포맷 HH:MM — HomePage.tsx의 fmt와 동일 패턴.
function fmt(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

// 소요/가용 시간 포맷 "h시간 m분" 등, locale별 — 디자인 renderVals :1475 hm() 이식.
function hm(min: number, locale: Locale): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (locale === "ko") return `${h}시간 ${m}분`;
  if (locale === "zh") return `${h}小时${m}分`;
  if (locale === "ja") return `${h}時間${m}分`;
  return `${h}h ${m}m`;
}

// AI 로딩 — 디자인 :419-436. 스텝 진행은 startAi 타이밍(:1140-1141)을 상위에서 setInterval로 재생.
function AiLoadingView({ aiStep, t }: { aiStep: number; t: (key: StringKey) => string }) {
  return (
    <FlexBox
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ flex: 1, padding: "0 32px", textAlign: "center" }}
    >
      <style>{AI_LOADING_KEYFRAMES}</style>
      <Box
        sx={{
          position: "relative",
          width: "88px",
          height: "88px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "26px",
        }}
      >
        <Box
          as="span"
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "999px",
            background: "#8B3FF0",
            opacity: 0.18,
            animation: "aip-pulse 1.6s ease-out infinite",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        />
        <Box
          as="span"
          sx={{
            width: "72px",
            height: "72px",
            borderRadius: "22px",
            background: "linear-gradient(135deg,#9747FF,#6A5CFF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            animation: "aip-float 2.4s ease-in-out infinite",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          <IconSparkleFill sx={{ fontSize: "34px" }} />
        </Box>
      </Box>
      <Box
        as="h1"
        sx={(theme) => ({
          margin: 0,
          fontWeight: 700,
          fontSize: "19px",
          color: theme.semantic.label.normal,
        })}
      >
        {t("ai_making")}
      </Box>
      <FlexBox
        flexDirection="column"
        gap="14px"
        sx={{ width: "100%", marginTop: "24px", textAlign: "left" }}
      >
        {AI_STEP_KEYS.map((key, i) => {
          const done = aiStep > i;
          const active = aiStep === i;
          return (
            <FlexBox
              key={key}
              alignItems="center"
              gap="12px"
              sx={{ opacity: done || active ? 1 : 0.45, transition: "opacity .3s" }}
            >
              {done && (
                <Box as="span" sx={{ display: "inline-flex", color: "#8B3FF0", flexShrink: 0 }}>
                  <IconCircleCheckFill sx={{ fontSize: "22px" }} />
                </Box>
              )}
              {active && (
                <Box
                  as="span"
                  sx={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "999px",
                    border: "2.5px solid #E4D5FA",
                    borderTopColor: "#8B3FF0",
                    animation: "aip-spin .7s linear infinite",
                    flexShrink: 0,
                    "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                  }}
                />
              )}
              {!done && !active && (
                <Box
                  as="span"
                  sx={(theme) => ({
                    width: "22px",
                    height: "22px",
                    borderRadius: "999px",
                    background: theme.semantic.fill.normal,
                    flexShrink: 0,
                  })}
                />
              )}
              <Box
                as="span"
                sx={(theme) => ({
                  fontSize: "15px",
                  fontWeight: active || done ? 700 : 500,
                  color: done
                    ? "#8B3FF0"
                    : active
                      ? theme.semantic.label.normal
                      : theme.semantic.label.alternative,
                })}
              >
                {t(key)}
              </Box>
            </FlexBox>
          );
        })}
      </FlexBox>
    </FlexBox>
  );
}

// 여행 코스 타임라인 한 줄 — 디자인 :456-474. 편집은 제거 버튼만(순서변경/스왑 없음).
function CourseStopRow({
  stop,
  spot,
  locale,
  t,
  onRemove,
}: {
  stop: CourseStop;
  spot: Spot;
  locale: Locale;
  t: (key: StringKey) => string;
  onRemove: (id: string) => void;
}) {
  return (
    <FlexBox gap="14px">
      <FlexBox flexDirection="column" alignItems="center" sx={{ width: "30px", flexShrink: 0 }}>
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
          {stop.no}
        </Box>
        {stop.legToNextMin !== null && (
          <Box
            sx={(theme) => ({
              position: "relative",
              flex: 1,
              width: "2px",
              background: theme.semantic.line.normal.neutral,
              margin: "2px 0",
            })}
          >
            <Box
              as="span"
              sx={(theme) => ({
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                whiteSpace: "nowrap",
                fontSize: "10px",
                fontWeight: 700,
                color: theme.semantic.label.alternative,
                background: theme.semantic.background.normal.normal,
                padding: "1px 6px",
                borderRadius: "999px",
                boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
              })}
            >
              {`${stop.legToNextMin}${t("min")}`}
            </Box>
          </Box>
        )}
      </FlexBox>
      <Box sx={{ flex: 1, minWidth: 0, paddingBottom: "16px" }}>
        <Box
          as="span"
          sx={(theme) => ({
            display: "block",
            fontWeight: 600,
            fontSize: "15px",
            color: theme.semantic.label.normal,
          })}
        >
          {spot.name[locale]}
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
          {`${spot.cat[locale]} · ${fmt(stop.startMin)} · ${stop.stayMin}${t("min")}`}
        </Box>
      </Box>
      <Box sx={{ flexShrink: 0, paddingBottom: "16px" }}>
        <Box
          as="button"
          type="button"
          aria-label="remove"
          onClick={() => onRemove(spot.id)}
          sx={{
            width: "30px",
            height: "30px",
            border: "none",
            background: "#FDECEC",
            borderRadius: "8px",
            cursor: "pointer",
            color: "#E23B3B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconClose sx={{ fontSize: "16px" }} />
        </Box>
      </Box>
    </FlexBox>
  );
}

/**
 * AI 패키지(코스 결과) — 프로토타입 "AI PACKAGE"(:413-503) 이식.
 * 마운트 시 항상 AI 로딩 애니메이션을 1회 재생한 뒤(데모 연출) 코스 결과로 전환한다.
 */
export function AiPackagePage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const cruiseId = useCruiseId();
  const pkgSpotIds = usePkgSpotIds();

  const [aiStep, setAiStep] = useState(0);
  const ready = aiStep >= AI_STEP_KEYS.length;

  // 마운트 시 항상 로딩 1회 재생 — 데모 연출 (디자인 startAi :1140-1141)
  useEffect(() => {
    const id = setInterval(() => {
      setAiStep((prev) => {
        const next = prev + 1;
        if (next >= AI_STEP_KEYS.length) {
          clearInterval(id);
          return AI_STEP_KEYS.length;
        }
        return next;
      });
    }, AI_STEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

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

  const spots = pkgSpotIds
    .map((id) => allSpots.find((s) => s.id === id))
    .filter((s): s is Spot => s != null);

  const available = cruise ? availableMinutes(cruise) : 0;
  const course = cruise ? buildCourse(spots, cruise) : null;
  const fits = course ? course.totalMin <= available : true;
  const fitsBg = fits ? "#EAF7EE" : "#FFF4E5";
  const FitsIcon = fits ? IconCircleCheckFill : IconTriangleExclamationFill;
  const courseTime = course ? hm(course.totalMin, locale) : "";
  const availableTime = hm(available, locale);

  return (
    <FlexBox flexDirection="column" sx={{ minHeight: "100dvh" }}>
      {/* 헤더 — 디자인 :416-418, 로딩/결과 공통 */}
      <FlexBox alignItems="center" sx={{ height: "52px", padding: "0 8px", flexShrink: 0 }}>
        <Box
          as="button"
          type="button"
          aria-label="back"
          onClick={() => navigate({ to: "/app" })}
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

      {!ready && <AiLoadingView aiStep={aiStep} t={t} />}

      {ready && cruise && course && (
        <>
          <Box sx={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
            {/* 타이틀 — 디자인 :442-443 */}
            <Box
              as="h1"
              sx={(theme) => ({
                margin: "12px 0 4px",
                fontWeight: 700,
                fontSize: "23px",
                letterSpacing: "-0.02em",
                color: theme.semantic.label.normal,
              })}
            >
              {t("package_ready")}
            </Box>
            <Box
              as="p"
              sx={(theme) => ({
                margin: "0 0 16px",
                fontSize: "14px",
                lineHeight: 1.5,
                color: theme.semantic.label.alternative,
              })}
            >
              {t("package_sub")}
            </Box>

            {/* 예산 배너 — 디자인 :445-448 */}
            <FlexBox
              alignItems="center"
              gap="10px"
              sx={{
                background: fitsBg,
                borderRadius: "14px",
                padding: "13px 16px",
                marginBottom: "10px",
              }}
            >
              <Box
                as="span"
                sx={(theme) => ({
                  display: "inline-flex",
                  color: fits ? theme.semantic.status.positive : "#B5620A",
                })}
              >
                <FitsIcon sx={{ fontSize: "22px" }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={(theme) => ({ fontSize: "12px", color: theme.semantic.label.alternative })}
                >
                  {`${t("total_course")} · ${courseTime}`}
                </Box>
                <Box
                  sx={(theme) => ({
                    fontWeight: 700,
                    fontSize: "14px",
                    color: fits ? theme.semantic.status.positive : "#B5620A",
                  })}
                >
                  {fits ? t("fits_stay") : t("fits_over")}
                </Box>
              </Box>
            </FlexBox>
            <Box
              as="p"
              sx={(theme) => ({
                margin: "0 0 18px",
                fontSize: "12px",
                color: theme.semantic.label.alternative,
              })}
            >
              {`${t("budget_est")} ${courseTime} · ${t("budget_stay")} ${availableTime}`}
            </Box>

            {/* 여행 코스 — 디자인 :450-474 */}
            <Box sx={{ marginBottom: "8px" }}>
              <Box
                as="span"
                sx={(theme) => ({
                  fontWeight: 700,
                  fontSize: "15px",
                  color: theme.semantic.label.normal,
                })}
              >
                {t("route_stops")}
              </Box>
            </Box>

            {course.stops.length > 0 ? (
              <FlexBox flexDirection="column">
                {course.stops.map((stop, i) => (
                  <CourseStopRow
                    key={stop.spotId}
                    stop={stop}
                    spot={spots[i]}
                    locale={locale}
                    t={t}
                    onRemove={sessionActions.togglePkgSpot}
                  />
                ))}
              </FlexBox>
            ) : (
              <Box
                as="p"
                sx={(theme) => ({
                  textAlign: "center",
                  fontSize: "13px",
                  color: theme.semantic.label.assistive,
                  padding: "6px 0 12px",
                })}
              >
                {t("pkg_empty")}
              </Box>
            )}
          </Box>

          {/* CTA — 디자인 :496-497. S4 transport 미구현이라 /app으로 임시 이동 */}
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
              disabled={course.stops.length === 0}
              onClick={() => navigate({ to: "/app" })}
            >
              {t("transport_cta")}
            </Button>
          </Box>
        </>
      )}
    </FlexBox>
  );
}
