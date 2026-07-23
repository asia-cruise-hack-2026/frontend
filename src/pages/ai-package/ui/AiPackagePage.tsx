import { useQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { addOpacity, Box, Button, FlexBox, useToast } from "@wanteddev/wds";
import {
  IconArrowLeft,
  IconCheck,
  IconChevronRight,
  IconCircleCheckFill,
  IconClose,
  IconLocation,
  IconPencil,
  IconPlus,
  IconTriangleExclamationFill,
} from "@wanteddev/wds-icon";
import { type ReactNode, useEffect, useState } from "react";

import { getCruise } from "@/entities/cruise";
import {
  buildCourse,
  courseSlack,
  listReachableSpots,
  type CourseStop,
  type ReachableSpot,
} from "@/entities/spot";
import { type Locale, type StringKey, useI18n } from "@/shared/i18n";
import { sessionActions, useCruiseId, usePkgSpotIds, useTaxiCalled } from "@/shared/store";
import { BottomSheet } from "@/shared/ui";

const AI_STEP_KEYS = [
  "ai_step1",
  "ai_step2",
  "ai_step3",
  "ai_step4",
] as const satisfies readonly StringKey[];
const AI_STEP_INTERVAL_MS = 850; // 디자인 startAi :1140-1141

const routeApi = getRouteApi("/app/package");

// 디자인 "AI 경로 인터랙션"(design_handoff_jeju_ai) 키프레임
const AI_LOADING_KEYFRAMES =
  "@keyframes aip-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}" +
  "@keyframes aip-pulse{0%{transform:scale(.72);opacity:.9}100%{transform:scale(1.28);opacity:0}}" +
  "@keyframes aip-orbit{to{transform:rotate(360deg)}}" +
  "@keyframes aip-spin{to{transform:rotate(360deg)}}" +
  "@keyframes aip-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}";

// 궤도 점(디자인 orbit dot) — 각도별 배치, 궤도 회전에 대해 역회전으로 수평 유지
const ORBIT_DOTS = [
  { deg: 0, color: "#2563EB", size: 12 },
  { deg: 95, color: "#F2860C", size: 11 },
  { deg: 190, color: "#2AAE48", size: 10 },
  { deg: 275, color: "#227CFD", size: 11 },
];

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

// AI 로딩 — 디자인 "AI 경로 인터랙션": 마스코트+펄스+궤도, 진행 바, 4단계 스텝.
function AiLoadingView({ aiStep, t }: { aiStep: number; t: (key: StringKey) => string }) {
  const progressPct = Math.min(100, Math.round((aiStep / AI_STEP_KEYS.length) * 100));
  return (
    <FlexBox
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ flex: 1, padding: "0 32px 40px", textAlign: "center" }}
    >
      <style>{AI_LOADING_KEYFRAMES}</style>
      <MascotStage>
        {[0, 1].map((r) => (
          <Box
            key={r}
            as="span"
            sx={{
              position: "absolute",
              inset: "29px",
              borderRadius: "999px",
              boxShadow: "inset 0 0 0 1.5px rgba(37,99,235,0.35)",
              animation: `aip-pulse 2.8s ease-out infinite ${r === 1 ? "1.4s" : ""}`,
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          />
        ))}
        {/* 궤도 — 대시 링 + 색점 4개(역회전으로 수평 유지) */}
        <Box
          sx={{
            position: "absolute",
            inset: "8px",
            animation: "aip-orbit 14s linear infinite",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          <Box
            as="span"
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "999px",
              border: "1.5px dashed rgba(37,99,235,0.30)",
            }}
          />
          {ORBIT_DOTS.map((d) => (
            <Box
              key={d.deg}
              as="span"
              sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: `${d.size}px`,
                height: `${d.size}px`,
                margin: `${-d.size / 2}px`,
                borderRadius: "999px",
                background: d.color,
                boxShadow: `0 0 0 4px ${d.color}29, 0 2px 6px rgba(26,26,26,0.12)`,
                transform: `rotate(${d.deg}deg) translateY(-107px) rotate(${-d.deg}deg)`,
              }}
            />
          ))}
        </Box>
      </MascotStage>
      <Box
        as="h1"
        sx={(theme) => ({
          margin: 0,
          fontWeight: 700,
          fontSize: "20px",
          letterSpacing: "-0.02em",
          color: theme.semantic.label.normal,
        })}
      >
        {t("ai_making")}
      </Box>
      <Box
        as="p"
        sx={(theme) => ({
          margin: "8px 0 0",
          fontSize: "13px",
          color: theme.semantic.label.alternative,
        })}
      >
        {t("ai_making_sub")}
      </Box>
      {/* 진행 바 */}
      <Box
        sx={{
          width: "100%",
          height: "8px",
          borderRadius: "999px",
          background: "rgba(37,99,235,0.10)",
          marginTop: "22px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            borderRadius: "999px",
            background: "linear-gradient(90deg,#2563EB,#83C3FE)",
            width: `${progressPct}%`,
            transition: "width .8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </Box>
      <FlexBox
        flexDirection="column"
        gap="13px"
        sx={{ width: "100%", marginTop: "22px", textAlign: "left" }}
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
                    border: "2.5px solid #BAD8FE",
                    borderTopColor: theme.semantic.primary.normal,
                    animation: "aip-spin .7s linear infinite",
                    flexShrink: 0,
                    boxSizing: "border-box",
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

// 마스코트 원판(230px 스테이지 + 172px 원 + 떠 있는 마스코트) — 로딩·완성 공용
function MascotStage({ children }: { children?: ReactNode }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "230px",
        height: "230px",
        marginBottom: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
      <Box
        sx={{
          position: "relative",
          width: "172px",
          height: "172px",
          borderRadius: "999px",
          background:
            "radial-gradient(120% 120% at 32% 26%, #F3F8FF 0%, #DCEAFF 60%, #BAD8FE 100%)",
          boxShadow: "inset 0 0 0 1px rgba(37,99,235,0.14), inset 0 12px 30px rgba(37,99,235,0.16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/images/mascot.svg"
          alt=""
          aria-hidden="true"
          style={{
            width: "108px",
            height: "112px",
            display: "block",
            marginTop: "6px",
            animation: "aip-float 3s ease-in-out infinite",
          }}
        />
      </Box>
    </Box>
  );
}

// 완성 화면 — 디자인 "AI 경로 인터랙션" ready 상태: pop + 체크 배지 + 다시 만들기/경로 보기
function AiDoneView({
  t,
  onRemake,
  onView,
}: {
  t: (key: StringKey) => string;
  onRemake: () => void;
  onView: () => void;
}) {
  return (
    <FlexBox
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{
        flex: 1,
        padding: "0 32px 40px",
        textAlign: "center",
        animation: "aip-pop .45s cubic-bezier(0.34,1.4,0.64,1) both",
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <style>{AI_LOADING_KEYFRAMES}</style>
      <Box sx={{ position: "relative" }}>
        <MascotStage />
        <Box
          as="span"
          sx={(theme) => ({
            position: "absolute",
            right: "24px",
            top: "26px",
            width: "44px",
            height: "44px",
            borderRadius: "999px",
            background: theme.semantic.primary.normal,
            color: theme.semantic.static.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
          })}
        >
          <IconCheck sx={{ fontSize: "24px" }} />
        </Box>
      </Box>
      <Box
        as="h1"
        sx={(theme) => ({
          margin: 0,
          fontWeight: 700,
          fontSize: "22px",
          letterSpacing: "-0.02em",
          color: theme.semantic.label.normal,
        })}
      >
        {t("package_ready")}
      </Box>
      <Box
        as="p"
        sx={(theme) => ({
          margin: "8px 0 0",
          fontSize: "14px",
          lineHeight: 1.5,
          color: theme.semantic.label.alternative,
        })}
      >
        {t("package_sub")}
      </Box>
      <FlexBox gap="10px" sx={{ marginTop: "26px", alignSelf: "stretch" }}>
        {/* 다시 만들기 — AI 핸드오프 1b(그라데이션 헤어라인) 스타일 */}
        <Box
          as="button"
          type="button"
          onClick={onRemake}
          sx={(theme) => ({
            flex: "0 0 auto",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: "48px",
            padding: "0 20px",
            border: "1px solid transparent",
            borderRadius: "12px",
            background: `linear-gradient(${theme.semantic.background.normal.normal},${theme.semantic.background.normal.normal}) padding-box, linear-gradient(96deg,${theme.semantic.primary.normal},#83C3FE) border-box`,
            fontWeight: 600,
            fontSize: "16px",
            color: theme.semantic.primary.normal,
            cursor: "pointer",
          })}
        >
          {t("ai_remake")}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Button variant="solid" color="primary" size="large" fullWidth onClick={onView}>
            {t("ai_view_route")}
          </Button>
        </Box>
      </FlexBox>
    </FlexBox>
  );
}

// 여행 코스 타임라인 한 줄 — 디자인 :456-474. 편집모드에만 스왑·제거 노출(디자인 editPkg 게이트, ▲▼는 디자인 템플릿에 없음).
function CourseStopRow({
  stop,
  spot,
  t,
  editMode,
  onSwap,
  onRemove,
}: {
  stop: CourseStop;
  spot: ReachableSpot;
  t: (key: StringKey) => string;
  editMode: boolean;
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
            as="span"
            sx={(theme) => ({
              flex: 1,
              width: "2px",
              background: theme.semantic.line.normal.neutral,
              margin: "2px 0",
            })}
          />
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
          {spot.name}
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
          {`${spot.categoryLabel} · ${fmt(stop.startMin)} · ${stop.stayMin}${t("min")}`}
        </Box>
      </Box>
      {editMode && (
        <FlexBox alignItems="center" gap="6px" sx={{ flexShrink: 0, paddingBottom: "16px" }}>
          {/* 장소 변경 — 디자인 :468 (스왑 시트 오픈) */}
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
      )}
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

// 스왑 후보 스팟 카드 한 줄 — 디자인 SWAP SPOT SHEET :1045-1052 구조에 실 DB 썸네일 적용.
function SwapCandidateCard({
  spot,
  t,
  onPick,
}: {
  spot: ReachableSpot;
  t: (key: StringKey) => string;
  onPick: (id: string) => void;
}) {
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
      <SpotThumb thumbnail={spot.thumbnail} size={46} radius={12} />
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
          {spot.name}
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
          {`${spot.categoryLabel} · ${spot.km}km · ${t("approx")} ${spot.driveMinutes}${t("min")}`}
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

// 스팟 썸네일(실 DB thumbnail) — 없으면 위치 아이콘 폴백
function SpotThumb({
  thumbnail,
  size,
  radius,
}: {
  thumbnail: string | null;
  size: number;
  radius: number;
}) {
  return (
    <Box
      as="span"
      sx={(theme) => ({
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${radius}px`,
        background: theme.semantic.fill.normal,
        color: theme.semantic.label.assistive,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      })}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <IconLocation sx={{ fontSize: "22px" }} />
      )}
    </Box>
  );
}

// 스왑 바텀시트 — 디자인 SWAP SPOT SHEET :1029-1060 이식. 오버레이+시트는 코드로 직접(fixed, 딤 배경) —
// 디자인은 absolute(프리뷰 프레임이 relative 컨테이너)지만 이 페이지 루트엔 그런 컨테이너가 없어 fixed로 전체 뷰포트를 덮는다.
function SwapSpotSheet({
  candidates,
  t,
  onPick,
  onClose,
}: {
  candidates: ReachableSpot[];
  t: (key: StringKey) => string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet onClose={onClose} title={t("swap_title")} subtitle={t("swap_sub")}>
      <FlexBox flexDirection="column" gap="10px" sx={{ padding: "6px 22px 26px" }}>
        {candidates.map((spot) => (
          <SwapCandidateCard key={spot.id} spot={spot} t={t} onPick={onPick} />
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
  const toast = useToast();
  const cruiseId = useCruiseId();
  const pkgSpotIds = usePkgSpotIds();
  // 디자인 routeLocked — 택시 호출 후엔 경로 편집 잠금
  const taxiCalled = useTaxiCalled();

  // 진입 출처(디자인 pkgBack) — 홈 재방문·수동 선택 진입은 AI 로딩 생략, 홈 재방문은 헤드도 숨김
  const { from } = routeApi.useSearch();
  const skipAi = from === "home" || from === "picker";
  const showHead = from !== "home";

  const [aiStep, setAiStep] = useState(skipAi ? AI_STEP_KEYS.length : 0);
  const ready = aiStep >= AI_STEP_KEYS.length;
  // 디자인 "AI 경로 인터랙션" — 로딩 완료 후 완성 화면을 거쳐 [경로 보기]로 리스트 진입
  const [routeViewed, setRouteViewed] = useState(skipAi);
  const [editMode, setEditMode] = useState(false);
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null);

  // AI 생성 진입만 로딩 1회 재생 — 데모 연출 (디자인 startAi :1140-1141)
  useEffect(() => {
    if (skipAi) return;
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
  }, [skipAi]);

  const { data: cruise } = useQuery({
    queryKey: ["cruise", cruiseId, locale],
    queryFn: () => getCruise(cruiseId ?? "", locale),
    enabled: !!cruiseId,
  });
  // 실 DB 스팟 — 컨셉/테마 픽커와 동일 소스·캐시 키
  const { data: allSpots = [] } = useQuery({
    queryKey: ["reachable-spots", cruiseId, locale, 30],
    queryFn: () => listReachableSpots(cruiseId ?? "", locale, 30),
    enabled: !!cruiseId,
  });

  // 실 목록에 없는 잔여 id(과거 mock 등) 정리
  useEffect(() => {
    if (allSpots.length > 0) sessionActions.prunePkgSpots(allSpots.map((s) => s.id));
  }, [allSpots]);

  const spots = pkgSpotIds
    .map((id) => allSpots.find((s) => s.id === id))
    .filter((s): s is ReachableSpot => s != null);

  const course = cruise ? buildCourse(spots, cruise) : null;
  // 실거리 slack 모델(진입leg+체류+스팟간 이동+복귀leg 누적 vs 탑승마감) — 디자인 renderVals :1537-1562와 동일.
  const slack = cruise ? courseSlack(spots, cruise) : null;
  const fits = slack ? slack.fits : true;
  const fitsBg = fits ? "#EAF7EE" : "#FFF4E5";
  const FitsIcon = fits ? IconCircleCheckFill : IconTriangleExclamationFill;
  const courseTime = course ? hm(course.totalMin, locale) : "";
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

      {ready && !routeViewed && (
        <AiDoneView
          t={t}
          onRemake={() => navigate({ to: "/app/concept" })}
          onView={() => setRouteViewed(true)}
        />
      )}

      {ready && routeViewed && cruise && course && (
        <>
          <Box sx={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
            {/* 타이틀 — 디자인 :442-443, 홈 재방문(pkgShowHead=false)이면 숨김 */}
            {showHead && (
              <>
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
              </>
            )}

            {/* 적합 배너 — 디자인 :447-450 (mb 18, 아래 보조 문단 없음) */}
            <FlexBox
              alignItems="center"
              gap="10px"
              sx={{
                background: fitsBg,
                borderRadius: "14px",
                padding: "13px 16px",
                marginBottom: "18px",
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
              {taxiCalled ? (
                <FlexBox
                  as="span"
                  alignItems="center"
                  gap="5px"
                  sx={(theme) => ({
                    fontSize: "12px",
                    fontWeight: 700,
                    color: theme.semantic.status.positive,
                  })}
                >
                  <IconCircleCheckFill sx={{ fontSize: "14px" }} />
                  {t("status_called")}
                </FlexBox>
              ) : (
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
              )}
            </FlexBox>

            {course.stops.length > 0 ? (
              <FlexBox flexDirection="column">
                {course.stops.map((stop, i) => (
                  <CourseStopRow
                    key={stop.spotId}
                    stop={stop}
                    spot={spots[i]}
                    t={t}
                    editMode={editMode && !taxiCalled}
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

            {/* 잠금 배너 — 디자인 :509-513 (택시 호출 후) */}
            {taxiCalled && (
              <FlexBox
                alignItems="flex-start"
                gap="9px"
                sx={(theme) => ({
                  width: "100%",
                  marginTop: "8px",
                  borderRadius: "12px",
                  background: addOpacity(theme.semantic.primary.normal, theme.opacity[8]),
                  padding: "12px 14px",
                })}
              >
                <Box
                  as="span"
                  sx={(theme) => ({
                    display: "inline-flex",
                    color: theme.semantic.primary.normal,
                    flexShrink: 0,
                    marginTop: "1px",
                  })}
                >
                  <IconCircleCheckFill sx={{ fontSize: "18px" }} />
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
                    {t("status_called")}
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
                    {t("route_locked")}
                  </Box>
                </Box>
              </FlexBox>
            )}

            {/* 장소 추가 — 디자인 :496-507. 잠금 전엔 편집모드와 무관하게 여유(slackMin>=50)면 추가, 아니면 경고 */}
            {!taxiCalled &&
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
                  {t("home_add")}
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
            {taxiCalled ? (
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
                {t("final_cta")}
              </Box>
            ) : (
              <>
                <Button
                  variant="solid"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={course.stops.length === 0}
                  onClick={() => {
                    sessionActions.setRouteConfirmed(true);
                    navigate({ to: "/app/transport" });
                  }}
                >
                  {t("confirm_now")}
                </Button>
                <Box
                  as="button"
                  type="button"
                  onClick={() => {
                    // 디자인 confirmRoute(false) :1309 — 확정 후 토스트, 홈 복귀
                    sessionActions.setRouteConfirmed(true);
                    toast({
                      content: t("route_confirmed_toast"),
                      variant: "positive",
                      duration: "short",
                    });
                    navigate({ to: "/app" });
                  }}
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
              </>
            )}
          </Box>
        </>
      )}

      {swapTargetId && (
        <SwapSpotSheet
          candidates={swapCandidates}
          t={t}
          onPick={handleSwapPick}
          onClose={() => setSwapTargetId(null)}
        />
      )}
    </FlexBox>
  );
}
