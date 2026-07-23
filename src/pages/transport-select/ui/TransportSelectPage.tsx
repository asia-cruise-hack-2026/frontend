import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { addOpacity, Box, Button, FlexBox } from "@wanteddev/wds";
import { IconArrowLeft, IconCircleInfoFill } from "@wanteddev/wds-icon";
import { type ReactNode, useState } from "react";

import { getCruise } from "@/entities/cruise";
import { listSpots, type Spot } from "@/entities/spot";
import { taxiFare, taxiMinutes, vanFare } from "@/entities/transport";
import { useI18n } from "@/shared/i18n";
import { useCruiseId, usePkgSpotIds } from "@/shared/store";

type TransportMode = "taxi" | "van";

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
        background: theme.semantic.background.normal.normal,
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

/**
 * 이동수단 선택 — 프로토타입 "TRANSPORT SELECT"(:505-594) 이식.
 * taxi_only_note 정책상 택시 전용 — 일반 택시/대형 밴 두 카드만 제공한다.
 * 디자인의 세그먼트(일반/글로벌 택시) 전환·글로벌 파트너 차량 분기는 API 범위
 * (taxiFare/vanFare/taxiMinutes만 제공)를 벗어나 이식하지 않았다.
 */
export function TransportSelectPage() {
  const { t, money } = useI18n();
  const navigate = useNavigate();
  const cruiseId = useCruiseId();
  const pkgSpotIds = usePkgSpotIds();
  const [selected, setSelected] = useState<TransportMode | null>(null);

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

  return (
    <FlexBox flexDirection="column" sx={{ minHeight: "100dvh" }}>
      {/* 헤더 — 디자인 :507 */}
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
            onClick={() => setSelected("taxi")}
          />
          <TransportCard
            mode="van"
            icon={<VanGlyph />}
            label={t("car_van")}
            sub={t("car_van_sub")}
            cost={money(vanCost)}
            time={`${taxiTime}${t("min")}`}
            active={selected === "van"}
            onClick={() => setSelected("van")}
          />
        </FlexBox>
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
