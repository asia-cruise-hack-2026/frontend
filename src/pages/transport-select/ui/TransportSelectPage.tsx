import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  addOpacity,
  Box,
  Button,
  FlexBox,
  SegmentedControl,
  SegmentedControlItem,
} from "@wanteddev/wds";
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronUp,
  IconCircleInfoFill,
  IconGlobe,
  IconVerifiedCheckFill,
} from "@wanteddev/wds-icon";
import { type ReactNode, useEffect, useState } from "react";

import { getCruise } from "@/entities/cruise";
import { listSpots, type Spot } from "@/entities/spot";
import {
  GLOBAL_CARS,
  taxiFare,
  taxiMinutes,
  vanFare,
  type GlobalCar,
  type GlobalCarKey,
} from "@/entities/transport";
import { useI18n } from "@/shared/i18n";
import { sessionActions, useCruiseId, usePkgSpotIds } from "@/shared/store";

type TransportMode = "taxi" | "van";
type Service = "normal" | "global";

// 택시 아이콘 — 디자인 :554 인라인 svg 이식. WDS 대응 아이콘 없어 코드로 직접(AiPackagePage.tsx SwapGlyph 등과 동일 패턴).
function TaxiGlyph() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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

// 대형밴 아이콘 — 디자인 :562 인라인 svg 이식.
function VanGlyph() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 16V8.5A1.5 1.5 0 0 1 4.5 7H14l5 5V16" />
      <path d="M3 16h16M4.6 16v1.6M17.4 16v1.6M9 7v5M3.5 12H19" />
      <circle cx="7" cy="16" r="1.6" />
      <circle cx="16" cy="16" r="1.6" />
    </svg>
  );
}

// 이동수단 카드 — 디자인 :535-568(taxiNotGlobal 분기) 공통 구조 이식.
function TransportCard({
  mode,
  icon,
  label,
  sub,
  cost,
  time,
  active,
  onClick,
}: {
  mode: TransportMode;
  icon: ReactNode;
  label: string;
  sub: string;
  cost: string;
  time: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      type="button"
      onClick={onClick}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: "14px",
        width: "100%",
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        borderRadius: "16px",
        padding: "16px",
        background: active
          ? addOpacity(theme.semantic.primary.normal, theme.opacity[8])
          : theme.semantic.background.normal.normal,
        boxShadow: active
          ? `inset 0 0 0 2px ${theme.semantic.primary.normal}`
          : `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
      })}
    >
      <Box
        as="span"
        sx={(theme) => ({
          width: "48px",
          height: "48px",
          borderRadius: "13px",
          background: mode === "taxi" ? "#EAF7EE" : "#E7F1FF",
          color: mode === "taxi" ? theme.semantic.status.positive : theme.semantic.primary.normal,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        })}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          as="span"
          sx={(theme) => ({
            display: "block",
            fontWeight: 700,
            fontSize: "16px",
            color: theme.semantic.label.normal,
          })}
        >
          {label}
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
          {sub}
        </Box>
      </Box>
      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Box
          as="span"
          sx={(theme) => ({
            display: "block",
            fontWeight: 700,
            fontSize: "15px",
            color: theme.semantic.label.normal,
          })}
        >
          {cost}
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
          {time}
        </Box>
      </Box>
    </Box>
  );
}

// 글로벌택시 안내 배너(+요금정책 아코디언) — 디자인 :519-541(taxiIsGlobal) 이식.
function GlobalBanner({
  policyOpen,
  onTogglePolicy,
}: {
  policyOpen: boolean;
  onTogglePolicy: () => void;
}) {
  const { t } = useI18n();
  return (
    <Box
      sx={(theme) => ({
        borderRadius: "14px",
        background: addOpacity(theme.semantic.primary.normal, theme.opacity[8]),
        padding: "14px",
        marginBottom: "16px",
      })}
    >
      <FlexBox alignItems="center" gap="10px">
        <Box
          as="span"
          sx={(theme) => ({
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: theme.semantic.primary.normal,
            color: theme.semantic.static.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          })}
        >
          <IconGlobe sx={{ fontSize: "20px" }} />
        </Box>
        <Box
          as="span"
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: "15px",
            color: theme.semantic.label.normal,
          })}
        >
          {t("global_title")}
        </Box>
      </FlexBox>
      <Box
        as="p"
        sx={(theme) => ({
          margin: "10px 0 0",
          fontSize: "13px",
          lineHeight: 1.5,
          color: theme.semantic.label.neutral,
        })}
      >
        {t("global_desc")}
      </Box>
      <FlexBox
        as="span"
        alignItems="center"
        gap="6px"
        sx={(theme) => ({
          display: "inline-flex",
          marginTop: "10px",
          background: theme.semantic.background.normal.normal,
          borderRadius: "999px",
          padding: "5px 11px",
          fontSize: "12px",
          fontWeight: 600,
          color: theme.semantic.label.neutral,
        })}
      >
        <Box
          as="span"
          sx={(theme) => ({ display: "inline-flex", color: theme.semantic.primary.normal })}
        >
          <IconVerifiedCheckFill sx={{ fontSize: "14px" }} />
        </Box>
        {t("global_langs")}
      </FlexBox>

      <Box
        as="button"
        type="button"
        onClick={onTogglePolicy}
        sx={(theme) => ({
          marginTop: "10px",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          border: "none",
          cursor: "pointer",
          background: "none",
          padding: "2px 0",
          fontSize: "12px",
          fontWeight: 600,
          color: theme.semantic.label.alternative,
        })}
      >
        {t("gt_policy_title")}
        {policyOpen ? (
          <IconChevronUp sx={{ fontSize: "14px" }} />
        ) : (
          <IconChevronDown sx={{ fontSize: "14px" }} />
        )}
      </Box>
      {policyOpen && (
        <Box
          sx={(theme) => ({
            marginTop: "8px",
            background: theme.semantic.background.normal.normal,
            borderRadius: "10px",
            padding: "13px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          })}
        >
          <Box
            as="p"
            sx={(theme) => ({
              margin: 0,
              fontSize: "12.5px",
              lineHeight: 1.55,
              color: theme.semantic.label.neutral,
            })}
          >
            {t("gt_policy1")}
          </Box>
          <Box
            as="p"
            sx={(theme) => ({
              margin: 0,
              fontSize: "12.5px",
              lineHeight: 1.55,
              color: theme.semantic.label.neutral,
            })}
          >
            {t("gt_policy2")}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// 글로벌택시 차종 카드 — 디자인 :569-585(sc-for globalCars) 이식.
function GlobalCarCard({
  car,
  active,
  onClick,
}: {
  car: GlobalCar;
  active: boolean;
  onClick: () => void;
}) {
  const { t, money } = useI18n();
  return (
    <Box
      as="button"
      type="button"
      onClick={onClick}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: "14px",
        width: "100%",
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        borderRadius: "16px",
        padding: "16px",
        background: active
          ? addOpacity(theme.semantic.primary.normal, theme.opacity[8])
          : theme.semantic.background.normal.normal,
        boxShadow: active
          ? `inset 0 0 0 2px ${theme.semantic.primary.normal}`
          : `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
      })}
    >
      <Box
        as="span"
        sx={{
          width: "48px",
          height: "48px",
          borderRadius: "13px",
          background: car.ibg,
          color: car.ifg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {car.van ? <VanGlyph /> : <TaxiGlyph />}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          as="span"
          sx={(theme) => ({
            display: "block",
            fontWeight: 700,
            fontSize: "16px",
            color: theme.semantic.label.normal,
          })}
        >
          {t(car.nameKey)}
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
          {`${car.cap}명 · ${t("gt_over")} ${money(car.over)}`}
        </Box>
      </Box>
      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Box
          as="span"
          sx={(theme) => ({
            display: "block",
            fontWeight: 700,
            fontSize: "15px",
            color: theme.semantic.label.normal,
          })}
        >
          {money(car.day)}
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
          {t("gt_day")}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * 이동수단 선택 — 프로토타입 "TRANSPORT SELECT"(:504-593) 이식.
 * 상단 세그먼트(일반/글로벌 택시)로 두 트랙을 전환한다.
 * - 일반: taxi_only_note 정책 배너 + 일반 택시/대형 밴 두 카드(진입 시 택시 프리셀렉트).
 * - 글로벌: 안내 배너(+요금정책 아코디언) + GLOBAL_CARS 4종 카드.
 * 선택 결과는 sessionActions.setTransportMode로 스토어에 반영한다(taxi/van/gtaxi).
 */
export function TransportSelectPage() {
  const { t, money } = useI18n();
  const navigate = useNavigate();
  const cruiseId = useCruiseId();
  const pkgSpotIds = usePkgSpotIds();
  const [service, setService] = useState<Service>("normal");
  const [selected, setSelected] = useState<TransportMode>("taxi");
  const [globalCarKey, setGlobalCarKey] = useState<GlobalCarKey>("basic");
  const [policyOpen, setPolicyOpen] = useState(false);

  // 진입 시 택시 프리셀렉트 — 스토어에도 즉시 반영해 CTA가 처음부터 활성 상태이게 한다.
  useEffect(() => {
    sessionActions.setTransportMode("taxi");
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

  // pkgSpotIds 순서 유지 매핑 — AiPackagePage.tsx와 동일 패턴.
  const spots = pkgSpotIds
    .map((id) => allSpots.find((s) => s.id === id))
    .filter((s): s is Spot => s != null);
  const totalKm = spots.reduce((a, s) => a + s.km, 0);

  const taxiCost = taxiFare(totalKm);
  const taxiTime = taxiMinutes(totalKm);
  const vanCost = vanFare(taxiCost);

  const selectNormalMode = (mode: TransportMode) => {
    setSelected(mode);
    sessionActions.setTransportMode(mode);
  };
  const handleServiceChange = (value: string) => {
    if (value === "normal" || value === "global") {
      setService(value);
      sessionActions.setTransportMode(value === "global" ? "gtaxi" : selected);
    }
  };

  return (
    <FlexBox flexDirection="column" sx={{ minHeight: "100dvh" }}>
      {/* 헤더 — 디자인 :507 */}
      <FlexBox alignItems="center" sx={{ height: "52px", padding: "0 8px", flexShrink: 0 }}>
        <Box
          as="button"
          type="button"
          aria-label="back"
          onClick={() => navigate({ to: "/app/package" })}
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

      <Box sx={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
        {/* 타이틀 — 디자인 :509-510 */}
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
          {t("transport_title")}
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
          {t("transport_sub")}
        </Box>

        {/* 일반/글로벌 세그먼트 — 디자인 :513-516 */}
        <FlexBox justifyContent="center" sx={{ marginBottom: "16px" }}>
          <SegmentedControl value={service} onValueChange={handleServiceChange}>
            <SegmentedControlItem value="normal">{t("svc_normal")}</SegmentedControlItem>
            <SegmentedControlItem value="global">{t("svc_global")}</SegmentedControlItem>
          </SegmentedControl>
        </FlexBox>

        {service === "normal" ? (
          <>
            {/* 안내 배너 — taxi_only_note. 디자인엔 렌더 안 된 문자열이라 MyPage.tsx trust_body 배너
                (아이콘+문단, 틴트 배경) 톤을 이식. */}
            <FlexBox
              alignItems="flex-start"
              gap="9px"
              sx={(theme) => ({
                background: addOpacity(theme.semantic.primary.normal, theme.opacity[8]),
                borderRadius: "14px",
                padding: "13px 14px",
                marginBottom: "16px",
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
                <IconCircleInfoFill sx={{ fontSize: "18px" }} />
              </Box>
              <Box
                as="p"
                sx={(theme) => ({
                  margin: 0,
                  fontSize: "12.5px",
                  lineHeight: 1.5,
                  color: theme.semantic.label.neutral,
                })}
              >
                {t("taxi_only_note")}
              </Box>
            </FlexBox>

            {/* 이동수단 카드 — 디자인 :535-568 */}
            <FlexBox flexDirection="column" gap="12px">
              <TransportCard
                mode="taxi"
                icon={<TaxiGlyph />}
                label={t("car_normal")}
                sub={t("car_normal_sub")}
                cost={money(taxiCost)}
                time={`${taxiTime}${t("min")}`}
                active={selected === "taxi"}
                onClick={() => selectNormalMode("taxi")}
              />
              <TransportCard
                mode="van"
                icon={<VanGlyph />}
                label={t("car_van")}
                sub={t("car_van_sub")}
                cost={money(vanCost)}
                time={`${taxiTime}${t("min")}`}
                active={selected === "van"}
                onClick={() => selectNormalMode("van")}
              />
            </FlexBox>
          </>
        ) : (
          <>
            {/* 글로벌택시 안내 배너(+요금정책 아코디언) — 디자인 :519-541 */}
            <GlobalBanner policyOpen={policyOpen} onTogglePolicy={() => setPolicyOpen((v) => !v)} />

            {/* 글로벌택시 차종 — 디자인 :569-585 */}
            <FlexBox flexDirection="column" gap="12px">
              {GLOBAL_CARS.map((car) => (
                <GlobalCarCard
                  key={car.key}
                  car={car}
                  active={globalCarKey === car.key}
                  onClick={() => setGlobalCarKey(car.key)}
                />
              ))}
            </FlexBox>
          </>
        )}
      </Box>

      {/* 하단 CTA — 디자인 :571 (noTransport → disabled 이식) */}
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
          disabled={!selected}
          onClick={() => navigate({ to: "/app/final" })}
        >
          {t("transport_cta")}
        </Button>
      </Box>
    </FlexBox>
  );
}
