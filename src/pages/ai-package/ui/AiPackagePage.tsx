import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, Button, FlexBox } from "@wanteddev/wds";
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconCircleCheckFill,
  IconClose,
  IconCoffee,
  IconLocation,
  IconPencil,
  IconPlus,
  IconSun,
  IconTriangleExclamationFill,
  IconUmbrella,
} from "@wanteddev/wds-icon";
import { type ReactNode, useEffect, useState } from "react";

import { getCruise } from "@/entities/cruise";
import {
  availableMinutes,
  buildCourse,
  courseSlack,
  listSpots,
  spotIconKind,
  type CourseStop,
  type Spot,
} from "@/entities/spot";
import { type Locale, type StringKey, useI18n } from "@/shared/i18n";
import { sessionActions, useCruiseId, usePkgSpotIds } from "@/shared/store";
import { BottomSheet } from "@/shared/ui";

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
  "@keyframes aip-spin{to{transform:rotate(360deg)}}" +
  "@keyframes aip-blink{0%,100%{opacity:.35}50%{opacity:1}}";

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
      {/* AI 로딩 — 디자인 최종: 블루 레이더/글로브 */}
      <Box
        sx={{
          position: "relative",
          width: "190px",
          height: "190px",
          marginBottom: "26px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {[0, 1].map((r) => (
          <Box
            key={r}
            as="span"
            sx={{
              position: "absolute",
              width: "150px",
              height: "150px",
              borderRadius: "999px",
              boxShadow: "inset 0 0 0 1.5px rgba(37,99,235,.32)",
              animation: `aip-pulse 2.8s ease-out infinite ${r === 1 ? "1.4s" : ""}`,
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          />
        ))}
        <Box
          sx={{
            position: "relative",
            width: "150px",
            height: "150px",
            borderRadius: "999px",
            overflow: "hidden",
            background: "radial-gradient(120% 120% at 30% 25%,#F1F6FF 0%,#D3E1FF 55%,#AFCCFF 100%)",
            boxShadow: "inset 0 0 0 1px rgba(37,99,235,.14),inset 0 10px 28px rgba(37,99,235,.16)",
          }}
        >
          <Box
            as="span"
            sx={{
              position: "absolute",
              inset: "26px",
              borderRadius: "999px",
              border: "1px solid rgba(37,99,235,.13)",
            }}
          />
          <Box
            as="span"
            sx={{
              position: "absolute",
              inset: "52px",
              borderRadius: "999px",
              border: "1px solid rgba(37,99,235,.13)",
            }}
          />
          <Box
            as="span"
            sx={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: "1px",
              background: "rgba(37,99,235,.1)",
            }}
          />
          <Box
            as="span"
            sx={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "1px",
              background: "rgba(37,99,235,.1)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "999px",
              background:
                "conic-gradient(from 0deg,rgba(37,99,235,0) 0deg,rgba(37,99,235,0) 290deg,rgba(37,99,235,.4) 360deg)",
              animation: "aip-spin 2.4s linear infinite",
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          />
          {[
            {
              left: "33%",
              top: "37%",
              s: "10px",
              bg: "var(--primary-normal-4)",
              ring: "rgba(37,99,235,.16)",
              d: "",
            },
            {
              left: "63%",
              top: "31%",
              s: "10px",
              bg: "#8B3FF0",
              ring: "rgba(139,63,240,.16)",
              d: ".5s",
            },
            {
              left: "60%",
              top: "63%",
              s: "10px",
              bg: "#E8820E",
              ring: "rgba(232,130,14,.16)",
              d: "1s",
            },
            {
              left: "31%",
              top: "61%",
              s: "9px",
              bg: "#12A150",
              ring: "rgba(18,161,80,.16)",
              d: "1.4s",
            },
          ].map((dot) => (
            <Box
              key={dot.left + dot.top}
              as="span"
              sx={{
                position: "absolute",
                left: dot.left,
                top: dot.top,
                width: dot.s,
                height: dot.s,
                borderRadius: "999px",
                background: dot.bg,
                boxShadow: `0 0 0 4px ${dot.ring}`,
                animation: `aip-blink 1.8s ease-in-out infinite ${dot.d}`,
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              }}
            />
          ))}
        </Box>
        <Box
          as="span"
          sx={(theme) => ({
            position: "absolute",
            width: "52px",
            height: "52px",
            borderRadius: "999px",
            background: "#fff",
            boxShadow: "0 6px 18px rgba(37,99,235,.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.semantic.primary.normal,
            animation: "aip-float 3s ease-in-out infinite",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          })}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1" />
            <path d="M4 18l-1 -5h18l-2 4" />
            <path d="M5 13v-6h8l4 6" />
            <path d="M7 7v-4h-1" />
          </svg>
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
                <Box
                  as="span"
                  sx={(theme) => ({
                    display: "inline-flex",
                    color: theme.semantic.primary.normal,
                    flexShrink: 0,
                  })}
                >
                  <IconCircleCheckFill sx={{ fontSize: "22px" }} />
                </Box>
              )}
              {active && (
                <Box
                  as="span"
                  sx={(theme) => ({
                    width: "22px",
                    height: "22px",
                    borderRadius: "999px",
                    border: "2.5px solid #93C5FD",
                    borderTopColor: theme.semantic.primary.normal,
                    animation: "aip-spin .7s linear infinite",
                    flexShrink: 0,
                    "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                  })}
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
                    ? theme.semantic.primary.normal
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

// 여행 코스 타임라인 한 줄 — 디자인 :456-474. 편집모드면 순서변경(▲▼)·스왑·제거, 아니면 제거만(기존 유지).
function CourseStopRow({
  stop,
  spot,
  locale,
  t,
  editMode,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onSwap,
  onRemove,
}: {
  stop: CourseStop;
  spot: Spot;
  locale: Locale;
  t: (key: StringKey) => string;
  editMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onSwap: (id: string) => void;
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
      <FlexBox alignItems="center" gap="6px" sx={{ flexShrink: 0, paddingBottom: "16px" }}>
        {editMode && (
          <>
            {/* 순서변경 — 디자인 renderVals :1529-1530 up/down·canUp/canDown·upOp/downOp(.28) 이식. 템플릿(:465-503)엔 버튼 미노출이나 로직 존재. */}
            <Box
              as="button"
              type="button"
              aria-label="move up"
              disabled={isFirst}
              onClick={() => onMoveUp(spot.id)}
              sx={(theme) => ({
                width: "30px",
                height: "30px",
                border: "none",
                background: theme.semantic.fill.normal,
                borderRadius: "8px",
                cursor: isFirst ? "default" : "pointer",
                opacity: isFirst ? 0.28 : 1,
                color: theme.semantic.label.neutral,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <IconChevronUp sx={{ fontSize: "16px" }} />
            </Box>
            <Box
              as="button"
              type="button"
              aria-label="move down"
              disabled={isLast}
              onClick={() => onMoveDown(spot.id)}
              sx={(theme) => ({
                width: "30px",
                height: "30px",
                border: "none",
                background: theme.semantic.fill.normal,
                borderRadius: "8px",
                cursor: isLast ? "default" : "pointer",
                opacity: isLast ? 0.28 : 1,
                color: theme.semantic.label.neutral,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <IconChevronDown sx={{ fontSize: "16px" }} />
            </Box>
            {/* 장소 변경 — 디자인 :468 이식(스왑 시트 오픈) */}
            <Box
              as="button"
              type="button"
              onClick={() => onSwap(spot.id)}
              sx={(theme) => ({
                height: "30px",
                padding: "0 11px",
                border: "none",
                background: theme.semantic.fill.normal,
                borderRadius: "8px",
                cursor: "pointer",
                color: theme.semantic.label.neutral,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: 700,
                fontSize: "12px",
                lineHeight: 1,
                whiteSpace: "nowrap",
              })}
            >
              <SwapGlyph />
              {t("swap_action")}
            </Box>
          </>
        )}
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
      </FlexBox>
    </FlexBox>
  );
}

// 장소 변경(스왑) 액션 아이콘 — 디자인 :468 인라인 svg 이식. WDS 대응 아이콘(swap/exchange) 없어 코드로 직접(D2).
function SwapGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 8h13l-3 -3" />
      <path d="M20 16h-13l3 3" />
    </svg>
  );
}

// 스왑 후보 카드 아이콘 — ExploreScreen.tsx/ThemeSelectPage.tsx와 동일 산출물(로컬 복제, entities/spot엔 아이콘 export 없음).
// 디자인 SWAP SPOT SHEET :1046 sp.iconIsFood/iconIsAttr/iconIsOther 분기 이식.
function FoodGlyph() {
  return (
    <svg
      width="24"
      height="24"
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

function MountainGlyph() {
  return (
    <svg
      width="24"
      height="24"
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

// spotIconKind==="other"일 때 spot.icon 이름 → WDS 아이콘 매핑(mock 데이터 기준). ExploreScreen.tsx/ThemeSelectPage.tsx와 동일.
const OTHER_SPOT_ICONS: Record<string, ReactNode> = {
  coffee: <IconCoffee sx={{ fontSize: "24px" }} />,
  location: <IconLocation sx={{ fontSize: "24px" }} />,
  sun: <IconSun sx={{ fontSize: "24px" }} />,
  umbrella: <IconUmbrella sx={{ fontSize: "24px" }} />,
};

// 스왑 후보 스팟 카드 한 줄 — 디자인 SWAP SPOT SHEET :1045-1052 이식.
function SwapCandidateCard({
  spot,
  locale,
  t,
  onPick,
}: {
  spot: Spot;
  locale: Locale;
  t: (key: StringKey) => string;
  onPick: (id: string) => void;
}) {
  const iconKind = spotIconKind(spot.themes);
  let iconNode: ReactNode;
  if (iconKind === "food") iconNode = <FoodGlyph />;
  else if (iconKind === "attraction") iconNode = <MountainGlyph />;
  else iconNode = OTHER_SPOT_ICONS[spot.icon] ?? null;

  return (
    <Box
      as="button"
      type="button"
      onClick={() => onPick(spot.id)}
      sx={(theme) => ({
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "13px",
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        background: theme.semantic.background.normal.alternative,
        borderRadius: "14px",
        padding: "12px 14px",
      })}
    >
      <Box
        sx={{
          width: "46px",
          height: "46px",
          borderRadius: "12px",
          background: spot.color,
          color: spot.iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {iconNode}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
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
          {`${spot.cat[locale]} · ${spot.km}km · ${t("approx")} ${spot.min}${t("min")}`}
        </Box>
      </Box>
      <Box
        as="span"
        sx={(theme) => ({
          display: "inline-flex",
          color: theme.semantic.label.assistive,
          flexShrink: 0,
        })}
      >
        <IconChevronRight sx={{ fontSize: "18px" }} />
      </Box>
    </Box>
  );
}

// 스왑 바텀시트 — 디자인 SWAP SPOT SHEET :1029-1060 이식. 오버레이+시트는 코드로 직접(fixed, 딤 배경) —
// 디자인은 absolute(프리뷰 프레임이 relative 컨테이너)지만 이 페이지 루트엔 그런 컨테이너가 없어 fixed로 전체 뷰포트를 덮는다.
function SwapSpotSheet({
  candidates,
  locale,
  t,
  onPick,
  onClose,
}: {
  candidates: Spot[];
  locale: Locale;
  t: (key: StringKey) => string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet onClose={onClose} title={t("swap_title")} subtitle={t("swap_sub")}>
      <FlexBox flexDirection="column" gap="10px" sx={{ padding: "6px 22px 26px" }}>
        {candidates.map((spot) => (
          <SwapCandidateCard key={spot.id} spot={spot} locale={locale} t={t} onPick={onPick} />
        ))}
        {candidates.length === 0 && (
          <Box
            as="p"
            sx={(theme) => ({
              textAlign: "center",
              fontSize: "13px",
              color: theme.semantic.label.assistive,
              padding: "22px 0",
            })}
          >
            {t("swap_empty")}
          </Box>
        )}
      </FlexBox>
    </BottomSheet>
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
  const [editMode, setEditMode] = useState(false);
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null);

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
    queryKey: ["cruise", cruiseId, locale],
    queryFn: () => getCruise(cruiseId ?? "", locale),
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
  // 실거리 slack 모델(진입leg+체류+스팟간 이동+복귀leg 누적 vs 탑승마감) — 디자인 renderVals :1537-1562와 동일.
  const slack = cruise ? courseSlack(spots, cruise) : null;
  const fits = slack ? slack.fits : true;
  const fitsBg = fits ? "#EAF7EE" : "#FFF4E5";
  const FitsIcon = fits ? IconCircleCheckFill : IconTriangleExclamationFill;
  const courseTime = course ? hm(course.totalMin, locale) : "";
  const availableTime = hm(available, locale);
  const canAddMore = slack ? slack.slackMin >= 50 : true;

  // 스왑 후보 — 현재 항구 스팟 중 pkgSpotIds에 없는 것 (디자인 renderVals :1535 swapCandidates 이식)
  const swapCandidates = allSpots.filter((s) => !pkgSpotIds.includes(s.id));
  const handleSwapPick = (newId: string) => {
    if (!swapTargetId) return;
    sessionActions.swapPkgSpot(swapTargetId, newId);
    setSwapTargetId(null);
  };

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

            {/* 여행 코스 — 디자인 :450-474, 편집 토글 :452 */}
            <FlexBox
              alignItems="center"
              justifyContent="space-between"
              sx={{ marginBottom: "8px" }}
            >
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
              <Box
                as="button"
                type="button"
                onClick={() => setEditMode((prev) => !prev)}
                sx={(theme) => ({
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: theme.semantic.primary.normal,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px",
                })}
              >
                <IconPencil sx={{ fontSize: "15px" }} />
                {editMode ? t("done_edit") : t("edit")}
              </Box>
            </FlexBox>

            {course.stops.length > 0 ? (
              <FlexBox flexDirection="column">
                {course.stops.map((stop, i) => (
                  <CourseStopRow
                    key={stop.spotId}
                    stop={stop}
                    spot={spots[i]}
                    locale={locale}
                    t={t}
                    editMode={editMode}
                    isFirst={i === 0}
                    isLast={i === course.stops.length - 1}
                    onMoveUp={(id) => sessionActions.movePkgSpot(id, -1)}
                    onMoveDown={(id) => sessionActions.movePkgSpot(id, 1)}
                    onSwap={setSwapTargetId}
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

            {/* 장소 추가 — 디자인 :478-487. 편집모드+여유(slackMin>=50)면 추가 버튼, 아니면 경고 배너 */}
            {editMode &&
              (canAddMore ? (
                <Box
                  as="button"
                  type="button"
                  onClick={() => navigate({ to: "/app/theme" })}
                  sx={(theme) => ({
                    width: "100%",
                    marginTop: "8px",
                    border: `1.5px dashed ${theme.semantic.line.normal.normal}`,
                    background: theme.semantic.background.normal.normal,
                    borderRadius: "12px",
                    padding: "13px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                    color: theme.semantic.primary.normal,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  })}
                >
                  <IconPlus sx={{ fontSize: "18px" }} />
                  {t("spot_add_more")}
                </Box>
              ) : (
                <FlexBox
                  alignItems="flex-start"
                  gap="9px"
                  sx={{
                    width: "100%",
                    marginTop: "8px",
                    border: "1.5px dashed rgba(232,130,14,.4)",
                    background: "#FFF7EC",
                    borderRadius: "12px",
                    padding: "12px 14px",
                  }}
                >
                  <Box
                    as="span"
                    sx={{
                      display: "inline-flex",
                      color: "#B5620A",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    <IconTriangleExclamationFill sx={{ fontSize: "18px" }} />
                  </Box>
                  <Box>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        display: "block",
                        fontWeight: 700,
                        fontSize: "13px",
                        color: theme.semantic.label.normal,
                      })}
                    >
                      {t("add_full")}
                    </Box>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        display: "block",
                        fontSize: "12px",
                        color: theme.semantic.label.alternative,
                        marginTop: "2px",
                        lineHeight: 1.45,
                      })}
                    >
                      {t("add_full_sub")}
                    </Box>
                  </Box>
                </FlexBox>
              ))}
          </Box>

          {/* CTA — 디자인 최종: 지금 확정(→교통수단) / 나중에 확정(→홈) 2버튼 */}
          <Box
            sx={(theme) => ({
              padding: "12px 20px 18px",
              borderTop: `1px solid ${theme.semantic.line.normal.neutral}`,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            })}
          >
            <Button
              variant="solid"
              color="primary"
              size="large"
              fullWidth
              disabled={course.stops.length === 0}
              onClick={() => navigate({ to: "/app/transport" })}
            >
              {t("confirm_now")}
            </Button>
            <Box
              as="button"
              type="button"
              onClick={() => navigate({ to: "/app" })}
              sx={(theme) => ({
                width: "100%",
                height: "48px",
                borderRadius: "12px",
                border: `1.5px solid ${theme.semantic.line.normal.normal}`,
                background: theme.semantic.background.normal.normal,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "15px",
                color: theme.semantic.label.normal,
              })}
            >
              {t("confirm_later")}
            </Box>
          </Box>
        </>
      )}

      {swapTargetId && (
        <SwapSpotSheet
          candidates={swapCandidates}
          locale={locale}
          t={t}
          onPick={handleSwapPick}
          onClose={() => setSwapTargetId(null)}
        />
      )}
    </FlexBox>
  );
}
