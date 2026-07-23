import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  addOpacity,
  Box,
  Button,
  FlexBox,
  SegmentedControl,
  SegmentedControlItem,
  useToast,
} from "@wanteddev/wds";
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheckFill,
  IconGlobe,
  IconStarFill,
  IconVerifiedCheckFill,
} from "@wanteddev/wds-icon";
import { useEffect, useState } from "react";

import { listReachableSpots, type ReachableSpot } from "@/entities/spot";
import {
  GLOBAL_CARS,
  TAXI_DRIVER,
  VEHICLES,
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

// 이동수단 카드 — 디자인 :535-568(taxiNotGlobal 분기) 공통 구조 이식.
function TransportCard({
  mode,
  img,
  label,
  sub,
  cost,
  time,
  active,
  onClick,
}: {
  mode: TransportMode;
  img: string;
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
        transition: "box-shadow 0.12s",
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
          background:
            mode === "taxi"
              ? "#EAF7EE"
              : addOpacity(theme.semantic.primary.normal, theme.opacity[8]),
          color: mode === "taxi" ? theme.semantic.status.positive : theme.semantic.primary.normal,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        })}
      >
        <img
          src={img}
          alt=""
          aria-hidden="true"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
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
          <IconChevronUp sx={{ fontSize: "15px" }} />
        ) : (
          <IconChevronDown sx={{ fontSize: "15px" }} />
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
        transition: "box-shadow 0.12s",
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
          width: "56px",
          height: "56px",
          borderRadius: "13px",
          background: car.ibg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <img
          src={car.img}
          alt=""
          aria-hidden="true"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
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
 * 이동수단 선택 — 프로토타입 "TRANSPORT SELECT"(:520-610) 이식(헤더 고정: 타이틀+글로벌 팁 말풍선+세그먼트, 카드만 스크롤).
 * 상단 세그먼트(일반/글로벌 택시)로 두 트랙을 전환한다.
 * - 일반: 일반 택시/대형 밴 두 카드(진입 시 택시 프리셀렉트).
 * - 글로벌: 안내 배너(+요금정책 아코디언) + GLOBAL_CARS 4종 카드.
 * 선택 결과는 sessionActions.setTransportMode로 스토어에 반영한다(taxi/van/gtaxi).
 */
const FINDING_MS = 2600; // 기사 탐색 연출
const MATCHED_MS = 1600; // 매칭 완료 노출 후 이동

export function TransportSelectPage() {
  const { t, money, locale } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const cruiseId = useCruiseId();
  const pkgSpotIds = usePkgSpotIds();
  const [service, setService] = useState<Service>("normal");
  const [selected, setSelected] = useState<TransportMode>("taxi");
  const [globalCarKey, setGlobalCarKey] = useState<GlobalCarKey>("basic");
  const [policyOpen, setPolicyOpen] = useState(false);
  // 택시 호출 매칭 연출 — 탐색 → 매칭 완료 → 최종 경로로 이동
  const [matchPhase, setMatchPhase] = useState<"idle" | "finding" | "matched">("idle");

  useEffect(() => {
    if (matchPhase === "finding") {
      const id = setTimeout(() => setMatchPhase("matched"), FINDING_MS);
      return () => clearTimeout(id);
    }
    if (matchPhase === "matched") {
      const id = setTimeout(() => {
        sessionActions.setTaxiCalled(true);
        toast({ content: t("taxi_called_toast"), variant: "positive", duration: "short" });
        navigate({ to: "/app/final" });
      }, MATCHED_MS);
      return () => clearTimeout(id);
    }
  }, [matchPhase, navigate, t, toast]);

  // 진입 시 택시 프리셀렉트 — 스토어에도 즉시 반영해 CTA가 처음부터 활성 상태이게 한다.
  useEffect(() => {
    sessionActions.setTransportMode("taxi");
  }, []);

  // 실 DB 스팟 — 패키지/홈과 동일 소스·캐시 키
  const { data: allSpots = [] } = useQuery({
    queryKey: ["reachable-spots", cruiseId, locale, 30],
    queryFn: () => listReachableSpots(cruiseId ?? "", locale, 30),
    enabled: !!cruiseId,
  });

  // pkgSpotIds 순서 유지 매핑 — AiPackagePage.tsx와 동일 패턴.
  const spots = pkgSpotIds
    .map((id) => allSpots.find((s) => s.id === id))
    .filter((s): s is ReachableSpot => s != null);
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

      {/* 헤더 블록(타이틀·글로벌 팁·세그먼트) — 디자인 :526-533, 고정(flex-shrink 0) */}
      <Box sx={{ padding: "0 20px 10px", flexShrink: 0 }}>
        <Box
          as="h1"
          sx={(theme) => ({
            margin: "0 0 6px",
            fontWeight: 700,
            fontSize: "22px",
            letterSpacing: "-0.02em",
            color: theme.semantic.label.normal,
          })}
        >
          {t("transport_title")}
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
          {t("transport_sub")}
        </Box>

        {/* 글로벌 택시 팁 말풍선 — 디자인 :530 (꼬리가 세그먼트 '글로벌' 쪽을 가리킴) */}
        <FlexBox
          alignItems="center"
          justifyContent="center"
          gap="6px"
          sx={(theme) => ({
            position: "relative",
            marginTop: "18px",
            background: addOpacity(theme.semantic.primary.normal, theme.opacity[8]),
            color: theme.semantic.primary.normal,
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: 1.4,
            padding: "9px 13px",
            borderRadius: "10px",
            wordBreak: "keep-all",
          })}
        >
          <Box as="span" sx={{ display: "inline-flex", flexShrink: 0 }}>
            <IconGlobe sx={{ fontSize: "15px" }} />
          </Box>
          {t("global_tip")}
          <Box
            as="span"
            sx={(theme) => ({
              position: "absolute",
              top: "100%",
              left: "78%",
              transform: "translateX(-50%) rotate(45deg)",
              width: "10px",
              height: "10px",
              background: addOpacity(theme.semantic.primary.normal, theme.opacity[8]),
              marginTop: "-5px",
              borderRadius: "2px",
            })}
          />
        </FlexBox>

        {/* 일반/글로벌 세그먼트 — 디자인 :531-533 */}
        <FlexBox justifyContent="center" sx={{ marginTop: "12px" }}>
          <SegmentedControl value={service} onValueChange={handleServiceChange}>
            <SegmentedControlItem value="normal">{t("svc_normal")}</SegmentedControlItem>
            <SegmentedControlItem value="global">{t("svc_global")}</SegmentedControlItem>
          </SegmentedControl>
        </FlexBox>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", padding: "14px 20px 20px" }}>
        {service === "normal" ? (
          <>
            {/* 이동수단 카드 — 디자인 :562-583 (일반 트랙엔 별도 배너 없음) */}
            <FlexBox flexDirection="column" gap="12px">
              <TransportCard
                mode="taxi"
                img={VEHICLES.normal.img}
                label={t("car_normal")}
                sub={t("car_normal_sub")}
                cost={money(taxiCost)}
                time={`${taxiTime}${t("min")}`}
                active={selected === "taxi"}
                onClick={() => selectNormalMode("taxi")}
              />
              <TransportCard
                mode="van"
                img={VEHICLES.van.img}
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
          onClick={() => setMatchPhase("finding")}
        >
          {t("transport_cta")}
        </Button>
      </Box>

      {/* 기사 매칭 오버레이 — 탐색(스피너) → 매칭 완료(기사 카드) → /app/final */}
      {matchPhase !== "idle" && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(23,23,25,.52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 28px",
          }}
        >
          <Box
            sx={(theme) => ({
              width: "100%",
              maxWidth: "360px",
              background: theme.semantic.background.normal.normal,
              borderRadius: "20px",
              padding: "28px 22px 22px",
              textAlign: "center",
              boxShadow: "0 18px 50px rgba(0,0,0,.28)",
            })}
          >
            {matchPhase === "finding" && (
              <>
                <style>{"@keyframes ts-spin{to{transform:rotate(360deg)}}"}</style>
                <Box
                  sx={(theme) => ({
                    width: "44px",
                    height: "44px",
                    margin: "0 auto 16px",
                    borderRadius: "999px",
                    border: `3px solid ${theme.semantic.line.normal.neutral}`,
                    borderTopColor: theme.semantic.primary.normal,
                    animation: "ts-spin 0.7s linear infinite",
                    "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                  })}
                />
                <Box
                  as="p"
                  sx={(theme) => ({
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "17px",
                    color: theme.semantic.label.normal,
                  })}
                >
                  {t("finding_driver")}
                </Box>
                <Box
                  as="p"
                  sx={(theme) => ({
                    margin: "6px 0 0",
                    fontSize: "13px",
                    color: theme.semantic.label.alternative,
                  })}
                >
                  {`${t("approx")} ${taxiTime}${t("min")} · ${money(selected === "van" ? vanCost : taxiCost)}`}
                </Box>
                <Box sx={{ marginTop: "20px" }}>
                  <Button
                    variant="outlined"
                    color="assistive"
                    size="large"
                    fullWidth
                    onClick={() => setMatchPhase("idle")}
                  >
                    {t("cancel")}
                  </Button>
                </Box>
              </>
            )}
            {matchPhase === "matched" && (
              <>
                <Box
                  as="span"
                  sx={(theme) => ({
                    display: "inline-flex",
                    color: theme.semantic.primary.normal,
                    marginBottom: "10px",
                  })}
                >
                  <IconCircleCheckFill sx={{ fontSize: "44px" }} />
                </Box>
                <Box
                  as="p"
                  sx={(theme) => ({
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "17px",
                    color: theme.semantic.label.normal,
                  })}
                >
                  {t("driver_assigned")}
                </Box>
                <FlexBox
                  alignItems="center"
                  gap="12px"
                  sx={(theme) => ({
                    marginTop: "16px",
                    background: theme.semantic.background.normal.alternative,
                    borderRadius: "14px",
                    padding: "13px 14px",
                    textAlign: "left",
                  })}
                >
                  <Box
                    as="span"
                    sx={(theme) => ({
                      width: "44px",
                      height: "44px",
                      borderRadius: "999px",
                      background: theme.semantic.fill.normal,
                      flexShrink: 0,
                      overflow: "hidden",
                      display: "flex",
                    })}
                  >
                    <img
                      src={VEHICLES.normal.img}
                      alt=""
                      aria-hidden="true"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        display: "block",
                        fontWeight: 700,
                        fontSize: "15px",
                        color: theme.semantic.label.normal,
                      })}
                    >
                      {TAXI_DRIVER.name[locale]}
                    </Box>
                    <Box
                      as="span"
                      sx={(theme) => ({
                        display: "block",
                        fontSize: "12px",
                        color: theme.semantic.label.alternative,
                        marginTop: "1px",
                      })}
                    >
                      {`${TAXI_DRIVER.car[locale]} · ${TAXI_DRIVER.plate}`}
                    </Box>
                  </Box>
                  <FlexBox
                    alignItems="center"
                    gap="3px"
                    sx={(theme) => ({
                      fontWeight: 700,
                      fontSize: "13px",
                      color: theme.semantic.label.normal,
                      flexShrink: 0,
                    })}
                  >
                    <Box as="span" sx={{ display: "inline-flex", color: "#FFB020" }}>
                      <IconStarFill sx={{ fontSize: "13px" }} />
                    </Box>
                    {TAXI_DRIVER.rating}
                  </FlexBox>
                </FlexBox>
              </>
            )}
          </Box>
        </Box>
      )}
    </FlexBox>
  );
}
