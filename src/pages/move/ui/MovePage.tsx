import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  addOpacity,
  Box,
  Button,
  FlexBox,
  SearchField,
  SegmentedControl,
  SegmentedControlItem,
  useToast,
} from "@wanteddev/wds";
import {
  IconArrowLeft,
  IconCircleCheckFill,
  IconGlobe,
  IconLocationFill,
  IconPhone,
  IconPinFill,
  IconStarFill,
  IconVerifiedCheckFill,
} from "@wanteddev/wds-icon";
import { type ReactNode, useEffect, useState } from "react";

import { getCruise } from "@/entities/cruise";
import { listReachableSpots, type ReachableSpot, searchReachableSpots } from "@/entities/spot";
import {
  GLOBAL_CARS,
  TAXI_DRIVER,
  VEHICLES,
  taxiFare,
  taxiMinutes,
  vanFare,
  type GlobalCar,
  type GlobalCarKey,
  type VehicleType,
} from "@/entities/transport";
import { type Locale, useI18n } from "@/shared/i18n";
import { useCruiseId } from "@/shared/store";
import { SheetHandle } from "@/shared/ui";

import { MoveMap } from "./MoveMap";

const CALL_SIM_MS = 2400; // 디자인 callTaxi 타이밍(:1169) 이식.

type Step = "dest" | "pickup" | "car" | "confirm";
type CallStatus = "idle" | "finding" | "assigned";
type Service = "normal" | "global";
// 디자인 최종: 배정 이후 라이드 시뮬레이션 단계(탑승→이동→관광→복귀→완료)
type RideStage = "coming" | "onboard" | "touring" | "returning" | "done";

// 디자인 taxiStepBack 매핑(:1110) 이식.
const PREV_STEP: Record<Step, Step> = {
  dest: "dest",
  pickup: "dest",
  car: "pickup",
  confirm: "car",
};

function seatsUnitFor(locale: Locale): string {
  if (locale === "ko") return "인";
  if (locale === "ja" || locale === "zh") return "人";
  return " seats";
}

function stepTitleKey(step: Step): "pickup_title" | "select_vehicle" | "confirm_title" {
  if (step === "pickup") return "pickup_title";
  if (step === "car") return "select_vehicle";
  return "confirm_title";
}

/**
 * 이동/택시 호출 — 디자인 "MOVE / TAXI"(:783-937) 이식.
 * 로컬 state로 4단계(목적지→출발지→차량→호출확인)를 관리하고, 호출확인 후 기사배정을 setTimeout으로 시뮬레이션.
 * 글로벌택시(일반/글로벌 세그 + GLOBAL_CARS)는 원래 별도 "TRANSPORT SELECT" 화면(:504-592)의 개념을 이 탭에 통합했다.
 */
export function MovePage() {
  const { t, locale, money } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const cruiseId = useCruiseId();

  const { data: cruise } = useQuery({
    queryKey: ["cruise", cruiseId, locale],
    queryFn: () => getCruise(cruiseId ?? "", locale),
    enabled: !!cruiseId,
  });
  const { data: spots = [] } = useQuery({
    queryKey: ["reachable-spots", cruiseId, locale],
    queryFn: () => listReachableSpots(cruiseId ?? "", locale),
    enabled: !!cruiseId,
  });

  // 내 위치 — 보편적 택시앱처럼 현재 위치 기반(거부/실패 시 마커 생략, 항구 중심 유지)
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const [step, setStep] = useState<Step>("dest");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  // 검색 결과에서 고른 스팟은 추천 목록에 없을 수 있어 id가 아니라 스팟 객체를 보관한다.
  const [destSpot, setDestSpot] = useState<ReachableSpot | null>(null);
  const [destQuery, setDestQuery] = useState("");

  // "어디로 갈까요?" — 2자 이상이면 전체 도달 가능 스팟 서버 검색(300ms 디바운스)
  const [debouncedDestQ, setDebouncedDestQ] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedDestQ(destQuery.trim()), 300);
    return () => clearTimeout(id);
  }, [destQuery]);
  const searchingDest = debouncedDestQ.length >= 2;
  const { data: destSearchResults = [] } = useQuery({
    queryKey: ["spot-search", cruiseId, debouncedDestQ, locale],
    queryFn: () => searchReachableSpots(cruiseId ?? "", debouncedDestQ, locale),
    enabled: !!cruiseId && searchingDest,
  });
  const [pickupName, setPickupName] = useState<string | null>(null);
  const [pickupQuery, setPickupQuery] = useState("");
  const [service, setService] = useState<Service>("normal");
  const [vehicleType, setVehicleType] = useState<VehicleType>("normal");
  const [globalCarKey, setGlobalCarKey] = useState<GlobalCarKey>("basic");
  const [rideStage, setRideStage] = useState<RideStage>("coming");

  // 기사 찾는 중 → 배정 시뮬레이션 (디자인 callTaxi :1169 이식).
  useEffect(() => {
    if (callStatus !== "finding") return;
    const id = setTimeout(() => setCallStatus("assigned"), CALL_SIM_MS);
    return () => clearTimeout(id);
  }, [callStatus]);

  const portLabel = cruise?.portName ?? "";
  const destLabel = destSpot?.name ?? "";
  const pickupLabel = pickupName ?? portLabel;

  const km = destSpot?.km ?? 0;
  const svcMul = service === "global" ? 1.25 : 1; // 디자인 renderVals :1587 이식.
  const fareNormal = taxiFare(km, svcMul);
  const fareVan = vanFare(fareNormal);
  const minutes = taxiMinutes(km);
  const globalCar = GLOBAL_CARS.find((c) => c.key === globalCarKey) ?? GLOBAL_CARS[0];

  const confirmLabel =
    service === "global"
      ? t(globalCar.nameKey)
      : t(vehicleType === "van" ? "car_van" : "car_normal");
  const confirmMeta =
    service === "global"
      ? `${globalCar.cap}${seatsUnitFor(locale)} · ${t("gt_dayfull")}`
      : `${VEHICLES[vehicleType].car[locale]} · ${minutes}${t("min")}`;
  const confirmFare =
    service === "global"
      ? money(globalCar.day)
      : money(vehicleType === "van" ? fareVan : fareNormal);
  const confirmIsVan = service === "global" ? globalCar.van : vehicleType === "van";

  const selectDest = (spot: ReachableSpot) => {
    setDestSpot(spot);
    setStep("pickup");
  };
  const selectPickup = (name: string) => {
    setPickupName(name);
    setStep("car");
  };
  const changeDest = () => setStep("dest");
  const goBack = () => setStep(PREV_STEP[step]);
  const goConfirm = () => setStep("confirm");
  const callTaxi = () => {
    setRideStage("coming");
    setCallStatus("finding");
  };
  const cancelTaxi = () => {
    setCallStatus("idle");
    setRideStage("coming");
  };
  // 라이드 단계 진행 (디자인 최종: 탑승→이동→관광→복귀→완료)
  const finishRide = () => {
    setCallStatus("idle");
    setRideStage("coming");
    setStep("dest");
    setDestSpot(null);
    navigate({ to: "/app" });
  };

  // 디자인 taxiMapShow/taxiMapH 이식 — dest(idle)에선 지도 없음, 이후엔 지도 + 바텀시트
  const mapVisible = !(callStatus === "idle" && step === "dest");
  const mapHeight = callStatus !== "idle" ? 220 : step === "pickup" ? 300 : 180;
  const showFloatingBack = callStatus === "idle" && step !== "dest";

  const stepContent = (
    <>
      {callStatus === "idle" && (
        <>
          {step === "dest" && (
            <DestStep
              spots={searchingDest ? destSearchResults : spots}
              query={destQuery}
              onQueryChange={setDestQuery}
              onSelect={selectDest}
            />
          )}
          {step === "pickup" && (
            <PickupStep
              portLabel={portLabel}
              query={pickupQuery}
              onQueryChange={setPickupQuery}
              onSelect={selectPickup}
            />
          )}
          {step === "car" && (
            <CarStep
              pickupLabel={pickupLabel}
              destLabel={destLabel}
              onChangeDest={changeDest}
              service={service}
              onServiceChange={setService}
              vehicleType={vehicleType}
              onSelectVehicle={setVehicleType}
              fareNormal={fareNormal}
              fareVan={fareVan}
              minutes={minutes}
              globalCarKey={globalCarKey}
              onSelectGlobalCar={setGlobalCarKey}
              onNext={goConfirm}
            />
          )}
          {step === "confirm" && (
            <ConfirmStep
              pickupLabel={pickupLabel}
              destLabel={destLabel}
              carIcon={confirmIsVan ? <VanGlyph size={22} /> : <CarGlyph size={22} />}
              carLabel={confirmLabel}
              carMeta={confirmMeta}
              carFare={confirmFare}
              onCall={callTaxi}
            />
          )}
        </>
      )}

      {callStatus === "finding" && (
        <FindingView destLabel={destLabel} fareLabel={confirmFare} onCancel={cancelTaxi} />
      )}

      {callStatus === "assigned" && (
        <RideView
          rideStage={rideStage}
          driverName={TAXI_DRIVER.name[locale]}
          driverCar={TAXI_DRIVER.car[locale]}
          plate={TAXI_DRIVER.plate}
          rating={TAXI_DRIVER.rating}
          etaLabel={`${TAXI_DRIVER.eta}${t("min")}`}
          vehicleType={vehicleType}
          destLabel={destLabel}
          portLabel={portLabel}
          onCancel={cancelTaxi}
          onBoard={() => setRideStage("onboard")}
          onArrive={() => setRideStage("touring")}
          onReturn={() => setRideStage("returning")}
          onExtend={() =>
            toast({ content: t("tour_extended"), variant: "positive", duration: "short" })
          }
          onArrivePort={() => setRideStage("done")}
          onFinish={finishRide}
        />
      )}
    </>
  );

  if (!mapVisible) {
    return (
      <FlexBox
        flexDirection="column"
        sx={(theme) => ({
          height: "100%",
          background: theme.semantic.background.normal.alternative,
        })}
      >
        <Header step={step} callStatus={callStatus} onBack={goBack} />
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{stepContent}</Box>
      </FlexBox>
    );
  }

  return (
    <FlexBox
      flexDirection="column"
      sx={(theme) => ({
        height: "100%",
        background: theme.semantic.background.normal.alternative,
      })}
    >
      {/* 상단 지도 — 디자인 taxiMapH(핀: 내 위치·목적지) */}
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <MoveMap
          dest={destSpot ? { lat: destSpot.lat, lng: destSpot.lng } : null}
          myPos={myPos}
          height={mapHeight}
        />
        {showFloatingBack && (
          <Box
            as="button"
            type="button"
            onClick={goBack}
            aria-label="back"
            sx={(theme) => ({
              position: "absolute",
              top: "14px",
              left: "16px",
              width: "38px",
              height: "38px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: "rgba(255,255,255,.95)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.semantic.label.normal,
              boxShadow: "0 2px 8px rgba(0,0,0,.15)",
              zIndex: 3,
            })}
          >
            <IconArrowLeft sx={{ fontSize: "22px" }} />
          </Box>
        )}
      </Box>

      {/* 바텀시트 — 디자인 taxiSheetRadius/-18px 오버랩/핸들/그림자 */}
      <Box
        sx={(theme) => ({
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          background: theme.semantic.background.normal.normal,
          borderRadius: "20px 20px 0 0",
          marginTop: "-18px",
          position: "relative",
          zIndex: 2,
          boxShadow: "0 -6px 20px rgba(0,0,0,.06)",
        })}
      >
        <SheetHandle margin="10px auto 2px" />
        {callStatus === "idle" && (
          <Box
            sx={(theme) => ({
              padding: "10px 20px 0",
              fontWeight: 700,
              fontSize: "19px",
              color: theme.semantic.label.normal,
            })}
          >
            {t(stepTitleKey(step))}
          </Box>
        )}
        {stepContent}
      </Box>
    </FlexBox>
  );
}

/* ─────────────── 헤더 (탭 루트=타이틀만, 하위 단계=뒤로+타이틀) ─────────────── */

function Header({
  step,
  callStatus,
  onBack,
}: {
  step: Step;
  callStatus: CallStatus;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const showBack = callStatus === "idle" && step !== "dest";
  const title = showBack ? t(stepTitleKey(step)) : t("nav_move");

  return (
    <Box
      sx={(theme) => ({
        padding: showBack ? "10px 20px 10px" : "18px 20px 14px",
        background: theme.semantic.background.normal.normal,
      })}
    >
      {showBack && (
        <Box
          as="button"
          type="button"
          onClick={onBack}
          aria-label="back"
          sx={(theme) => ({
            width: "36px",
            height: "36px",
            margin: "0 0 6px -8px",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            background: theme.semantic.fill.normal,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.semantic.label.normal,
          })}
        >
          <IconArrowLeft sx={{ fontSize: "20px" }} />
        </Box>
      )}
      <Box
        sx={(theme) => ({
          fontWeight: 700,
          fontSize: showBack ? "19px" : "20px",
          color: theme.semantic.label.normal,
        })}
      >
        {title}
      </Box>
    </Box>
  );
}

/* ─────────────── 1. 목적지 선택 ─────────────── */

function DestStep({
  spots,
  query,
  onQueryChange,
  onSelect,
}: {
  spots: ReachableSpot[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (spot: ReachableSpot) => void;
}) {
  const { t } = useI18n();
  // 2자 미만은 추천 목록 로컬 필터, 2자 이상은 서버 검색 결과가 spots로 내려온다(MovePage)
  const q = query.trim().toLowerCase();
  const results =
    q.length >= 2 ? spots : spots.filter((s) => !q || s.name.toLowerCase().includes(q));

  return (
    <Box sx={{ padding: "8px 20px 22px" }}>
      <SearchField
        width="100%"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t("where_to")}
      />
      <Box
        sx={(theme) => ({
          fontSize: "12px",
          fontWeight: 600,
          color: theme.semantic.label.assistive,
          margin: "8px 0 2px",
        })}
      >
        {t("search_results")}
      </Box>
      <FlexBox flexDirection="column">
        {results.map((spot) => (
          <PlaceRow
            key={spot.id}
            icon={<IconPinFill sx={{ fontSize: "18px" }} />}
            title={spot.name}
            sub={`${spot.categoryLabel} · ${spot.km}km`}
            onClick={() => onSelect(spot)}
          />
        ))}
        {results.length === 0 && (
          <Box
            sx={(theme) => ({
              textAlign: "center",
              fontSize: "13px",
              color: theme.semantic.label.alternative,
              padding: "24px 0",
            })}
          >
            {t("no_results")}
          </Box>
        )}
      </FlexBox>
    </Box>
  );
}

/* ─────────────── 2. 출발지 ─────────────── */

function PickupStep({
  portLabel,
  query,
  onQueryChange,
  onSelect,
}: {
  portLabel: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (name: string) => void;
}) {
  const { t } = useI18n();
  const q = query.trim().toLowerCase();
  const isIdle = q.length === 0;
  const quickOptions = [
    { key: "terminal", title: t("place_terminal"), sub: portLabel },
    { key: "hotel", title: t("place_hotel"), sub: "Jeju Shinhwa World" },
  ];
  const results = quickOptions.filter((option) => option.title.toLowerCase().includes(q));

  return (
    <Box sx={{ padding: "12px 20px 22px" }}>
      <SearchField
        width="100%"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t("pickup_search")}
      />

      {isIdle && (
        <Box
          as="button"
          type="button"
          onClick={() => onSelect(t("cur_loc_auto"))}
          sx={(theme) => ({
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textAlign: "left",
            border: "none",
            cursor: "pointer",
            background: addOpacity(theme.semantic.primary.normal, theme.opacity[8]),
            borderRadius: "14px",
            padding: "14px",
            margin: "16px 0 8px",
            boxShadow: `inset 0 0 0 1.5px ${theme.semantic.primary.normal}`,
          })}
        >
          <Box
            as="span"
            sx={(theme) => ({
              width: "38px",
              height: "38px",
              borderRadius: "999px",
              background: theme.semantic.primary.normal,
              color: theme.semantic.static.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            })}
          >
            <IconLocationFill sx={{ fontSize: "20px" }} />
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
              {t("cur_loc_auto")}
            </Box>
          </Box>
          <Box
            as="span"
            sx={(theme) => ({ display: "inline-flex", color: theme.semantic.primary.normal })}
          >
            <IconCircleCheckFill sx={{ fontSize: "22px" }} />
          </Box>
        </Box>
      )}

      <Box
        sx={(theme) => ({
          fontSize: "12px",
          fontWeight: 600,
          color: theme.semantic.label.assistive,
          margin: "16px 0 4px",
        })}
      >
        {t("recent_places")}
      </Box>
      <FlexBox flexDirection="column">
        {results.map((option) => (
          <PlaceRow
            key={option.key}
            icon={<IconPinFill sx={{ fontSize: "18px" }} />}
            title={option.title}
            sub={option.sub}
            onClick={() => onSelect(option.title)}
          />
        ))}
        {results.length === 0 && (
          <Box
            sx={(theme) => ({
              textAlign: "center",
              fontSize: "13px",
              color: theme.semantic.label.alternative,
              padding: "24px 0",
            })}
          >
            {t("no_results")}
          </Box>
        )}
      </FlexBox>
    </Box>
  );
}

/* ─────────────── 3. 차량 선택 (+ 글로벌택시 세그) ─────────────── */

interface CarStepProps {
  pickupLabel: string;
  destLabel: string;
  onChangeDest: () => void;
  service: Service;
  onServiceChange: (service: Service) => void;
  vehicleType: VehicleType;
  onSelectVehicle: (type: VehicleType) => void;
  fareNormal: number;
  fareVan: number;
  minutes: number;
  globalCarKey: GlobalCarKey;
  onSelectGlobalCar: (key: GlobalCarKey) => void;
  onNext: () => void;
}

function CarStep({
  pickupLabel,
  destLabel,
  onChangeDest,
  service,
  onServiceChange,
  vehicleType,
  onSelectVehicle,
  fareNormal,
  fareVan,
  minutes,
  globalCarKey,
  onSelectGlobalCar,
  onNext,
}: CarStepProps) {
  const { t, money } = useI18n();
  const handleServiceChange = (value: string) => {
    if (value === "normal" || value === "global") onServiceChange(value);
  };
  const etaLabel = `${minutes}${t("min")}`;

  return (
    <Box sx={{ padding: "12px 20px 22px" }}>
      <FlexBox
        alignItems="center"
        gap="10px"
        sx={(theme) => ({
          background: theme.semantic.background.normal.alternative,
          borderRadius: "14px",
          padding: "12px 14px",
          marginBottom: "16px",
        })}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <FlexBox alignItems="center" gap="8px">
            <Dot tone="neutral" />
            <Box
              as="span"
              sx={(theme) => ({
                fontSize: "13px",
                fontWeight: 600,
                color: theme.semantic.label.normal,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              })}
            >
              {pickupLabel}
            </Box>
          </FlexBox>
          <FlexBox alignItems="center" gap="8px" sx={{ marginTop: "6px" }}>
            <Dot tone="primary" />
            <Box
              as="span"
              sx={(theme) => ({
                fontSize: "13px",
                fontWeight: 600,
                color: theme.semantic.label.normal,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              })}
            >
              {destLabel}
            </Box>
          </FlexBox>
        </Box>
        <Button variant="outlined" color="assistive" size="small" onClick={onChangeDest}>
          {t("change")}
        </Button>
      </FlexBox>

      <FlexBox justifyContent="center" sx={{ marginBottom: "16px" }}>
        <SegmentedControl value={service} onValueChange={handleServiceChange}>
          <SegmentedControlItem value="normal">{t("svc_normal")}</SegmentedControlItem>
          <SegmentedControlItem value="global">{t("svc_global")}</SegmentedControlItem>
        </SegmentedControl>
      </FlexBox>

      {service === "global" && <GlobalBanner />}

      <Box
        sx={(theme) => ({
          fontWeight: 700,
          fontSize: "15px",
          color: theme.semantic.label.normal,
          marginBottom: "10px",
        })}
      >
        {t("select_vehicle")}
      </Box>

      {service === "normal" ? (
        <FlexBox gap="12px" sx={{ overflowX: "auto", paddingBottom: "6px" }}>
          <CarCard
            active={vehicleType === "normal"}
            icon={
              <img
                src={VEHICLES.normal.img}
                alt=""
                aria-hidden="true"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            }
            label={t("car_normal")}
            sub={`${t("car_normal_sub")} · ${etaLabel}`}
            price={money(fareNormal)}
            onClick={() => onSelectVehicle("normal")}
          />
          <CarCard
            active={vehicleType === "van"}
            icon={
              <img
                src={VEHICLES.van.img}
                alt=""
                aria-hidden="true"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            }
            label={t("car_van")}
            sub={`${t("car_van_sub")} · ${etaLabel}`}
            price={money(fareVan)}
            onClick={() => onSelectVehicle("van")}
          />
        </FlexBox>
      ) : (
        <FlexBox flexDirection="column" gap="10px">
          {GLOBAL_CARS.map((car) => (
            <GlobalCarRow
              key={car.key}
              car={car}
              active={globalCarKey === car.key}
              onClick={() => onSelectGlobalCar(car.key)}
            />
          ))}
        </FlexBox>
      )}

      <Box sx={{ marginTop: "16px" }}>
        <Button variant="solid" color="primary" size="large" fullWidth onClick={onNext}>
          {t("next_step")}
        </Button>
      </Box>
    </Box>
  );
}

/* ─────────────── 4. 호출 확인 ─────────────── */

function ConfirmStep({
  pickupLabel,
  destLabel,
  carIcon,
  carLabel,
  carMeta,
  carFare,
  onCall,
}: {
  pickupLabel: string;
  destLabel: string;
  carIcon: ReactNode;
  carLabel: string;
  carMeta: string;
  carFare: string;
  onCall: () => void;
}) {
  const { t } = useI18n();
  return (
    <Box sx={{ padding: "12px 20px 22px" }}>
      <Box
        sx={(theme) => ({
          fontWeight: 700,
          fontSize: "19px",
          color: theme.semantic.label.normal,
          marginBottom: "14px",
        })}
      >
        {t("confirm_title")}
      </Box>

      <Box
        sx={(theme) => ({
          background: theme.semantic.background.normal.normal,
          borderRadius: "16px",
          boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
          padding: "4px 16px",
          marginBottom: "12px",
        })}
      >
        <FlexBox
          alignItems="center"
          gap="12px"
          sx={(theme) => ({
            padding: "13px 0",
            borderBottom: `1px solid ${theme.semantic.line.normal.neutral}`,
          })}
        >
          <Dot tone="neutral" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              as="span"
              sx={(theme) => ({
                display: "block",
                fontSize: "11px",
                color: theme.semantic.label.assistive,
              })}
            >
              {t("trip_from")}
            </Box>
            <Box
              as="span"
              sx={(theme) => ({
                display: "block",
                fontWeight: 600,
                fontSize: "14px",
                color: theme.semantic.label.normal,
              })}
            >
              {pickupLabel}
            </Box>
          </Box>
        </FlexBox>
        <FlexBox alignItems="center" gap="12px" sx={{ padding: "13px 0" }}>
          <Dot tone="primary" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              as="span"
              sx={(theme) => ({
                display: "block",
                fontSize: "11px",
                color: theme.semantic.label.assistive,
              })}
            >
              {t("trip_to")}
            </Box>
            <Box
              as="span"
              sx={(theme) => ({
                display: "block",
                fontWeight: 600,
                fontSize: "14px",
                color: theme.semantic.label.normal,
              })}
            >
              {destLabel}
            </Box>
          </Box>
        </FlexBox>
      </Box>

      <FlexBox
        alignItems="center"
        gap="12px"
        sx={(theme) => ({
          background: theme.semantic.background.normal.normal,
          borderRadius: "16px",
          boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
          padding: "14px 16px",
          marginBottom: "12px",
        })}
      >
        <Box
          as="span"
          sx={(theme) => ({
            width: "40px",
            height: "40px",
            borderRadius: "11px",
            background: theme.semantic.fill.normal,
            color: theme.semantic.label.neutral,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          })}
        >
          {carIcon}
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
            {carLabel}
          </Box>
          <Box
            as="span"
            sx={(theme) => ({
              display: "block",
              fontSize: "12px",
              color: theme.semantic.label.alternative,
            })}
          >
            {carMeta}
          </Box>
        </Box>
        <Box
          as="span"
          sx={(theme) => ({
            fontWeight: 800,
            fontSize: "17px",
            color: theme.semantic.label.normal,
          })}
        >
          {carFare}
        </Box>
      </FlexBox>

      <FlexBox
        alignItems="center"
        sx={(theme) => ({
          background: theme.semantic.background.normal.normal,
          borderRadius: "16px",
          boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
          padding: "14px 16px",
          marginBottom: "18px",
        })}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            as="span"
            sx={(theme) => ({
              display: "block",
              fontSize: "11px",
              color: theme.semantic.label.assistive,
            })}
          >
            {t("pay_method")}
          </Box>
          <Box
            as="span"
            sx={(theme) => ({
              display: "block",
              fontWeight: 700,
              fontSize: "14px",
              color: theme.semantic.label.normal,
            })}
          >
            Toss Pay
          </Box>
        </Box>
      </FlexBox>

      <Button variant="solid" color="primary" size="large" fullWidth onClick={onCall}>
        {t("call_taxi")}
      </Button>
    </Box>
  );
}

/* ─────────────── 5. 기사 찾는 중 / 배정됨 ─────────────── */

function FindingView({
  destLabel,
  fareLabel,
  onCancel,
}: {
  destLabel: string;
  fareLabel: string;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  return (
    <Box sx={{ padding: "20px", textAlign: "center" }}>
      <style>{"@keyframes mp-spin{to{transform:rotate(360deg)}}"}</style>
      <Box
        sx={(theme) => ({
          width: "40px",
          height: "40px",
          margin: "0 auto 14px",
          borderRadius: "999px",
          border: `3px solid ${theme.semantic.line.normal.neutral}`,
          borderTopColor: theme.semantic.primary.normal,
          animation: "mp-spin 0.7s linear infinite",
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        })}
      />
      <Box
        as="p"
        sx={(theme) => ({
          margin: 0,
          fontWeight: 700,
          fontSize: "16px",
          color: theme.semantic.label.normal,
        })}
      >
        {t("finding_driver")}
      </Box>
      <Box
        as="p"
        sx={(theme) => ({
          margin: "4px 0 0",
          fontSize: "13px",
          color: theme.semantic.label.alternative,
        })}
      >
        {`${destLabel} · ${fareLabel}`}
      </Box>
      <Box sx={{ marginTop: "18px" }}>
        <Button variant="outlined" color="assistive" size="large" fullWidth onClick={onCancel}>
          {t("cancel")}
        </Button>
      </Box>
    </Box>
  );
}

function RideView({
  rideStage,
  driverName,
  driverCar,
  plate,
  rating,
  etaLabel,
  vehicleType,
  destLabel,
  portLabel,
  onCancel,
  onBoard,
  onArrive,
  onReturn,
  onExtend,
  onArrivePort,
  onFinish,
}: {
  rideStage: RideStage;
  driverName: string;
  driverCar: string;
  plate: string;
  rating: number;
  etaLabel: string;
  vehicleType: VehicleType;
  destLabel: string;
  portLabel: string;
  onCancel: () => void;
  onBoard: () => void;
  onArrive: () => void;
  onReturn: () => void;
  onExtend: () => void;
  onArrivePort: () => void;
  onFinish: () => void;
}) {
  const { t, locale } = useI18n();
  const L = (ko: string, en: string, zh: string, ja: string) =>
    locale === "ko" ? ko : locale === "zh" ? zh : locale === "ja" ? ja : en;

  const avatar = (
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
        src={VEHICLES[vehicleType].img}
        alt=""
        aria-hidden="true"
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
    </Box>
  );

  // 이동/관광/복귀 단계 공용 기사 카드(전화 버튼)
  const driverCardCompact = (
    <FlexBox
      alignItems="center"
      gap="12px"
      sx={(theme) => ({
        background: theme.semantic.background.normal.normal,
        borderRadius: "16px",
        boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
        padding: "14px 16px",
      })}
    >
      {avatar}
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
          {driverName}
        </Box>
        <Box
          as="span"
          sx={(theme) => ({
            display: "block",
            fontSize: "12px",
            color: theme.semantic.label.alternative,
          })}
        >
          {`${driverCar} · ${plate}`}
        </Box>
      </Box>
      <Box
        as="button"
        type="button"
        aria-label={t("call")}
        sx={(theme) => ({
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          background: addOpacity(theme.semantic.primary.normal, theme.opacity[8]),
          color: theme.semantic.primary.normal,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        })}
      >
        <IconPhone sx={{ fontSize: "18px" }} />
      </Box>
    </FlexBox>
  );

  const stageIconPrimary = (icon: ReactNode) => (
    <Box
      as="span"
      sx={(theme) => ({
        width: "32px",
        height: "32px",
        borderRadius: "9px",
        background: addOpacity(theme.semantic.primary.normal, theme.opacity[8]),
        color: theme.semantic.primary.normal,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      })}
    >
      {icon}
    </Box>
  );

  const stageTitle = (label: string) => (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box
        as="span"
        sx={(theme) => ({ fontWeight: 700, fontSize: "16px", color: theme.semantic.label.normal })}
      >
        {label}
      </Box>
    </Box>
  );

  const stageEta = (eta: string) => (
    <Box
      as="span"
      sx={(theme) => ({ fontWeight: 700, fontSize: "14px", color: theme.semantic.primary.normal })}
    >
      {eta}
    </Box>
  );

  if (rideStage === "done") {
    return (
      <Box sx={{ padding: "40px 24px 28px", textAlign: "center" }}>
        <Box
          as="span"
          sx={{
            width: "72px",
            height: "72px",
            borderRadius: "999px",
            background: "#EAF7EE",
            color: "#12A150",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <IconCircleCheckFill sx={{ fontSize: "40px" }} />
        </Box>
        <Box
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: "20px",
            color: theme.semantic.label.normal,
            letterSpacing: "-0.01em",
          })}
        >
          {L("오늘 여정을 마쳤어요", "Your day is complete", "今日行程已结束", "本日の旅程が終了")}
        </Box>
        <Box
          sx={(theme) => ({
            fontSize: "14px",
            color: theme.semantic.label.alternative,
            marginTop: "6px",
            lineHeight: 1.5,
          })}
        >
          {L(
            "안전하게 배로 복귀했어요",
            "You're safely back at the ship",
            "已安全返回邮轮",
            "無事に船へ戻りました",
          )}
        </Box>
        <Box sx={{ marginTop: "22px" }}>
          <Button variant="solid" color="primary" size="large" fullWidth onClick={onFinish}>
            {L("홈으로", "Back to home", "返回首页", "ホームへ")}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <FlexBox flexDirection="column" gap="12px" sx={{ padding: "14px 20px 20px" }}>
      {rideStage === "coming" && (
        <>
          <FlexBox alignItems="center" gap="8px">
            <Box
              as="span"
              sx={(theme) => ({ display: "inline-flex", color: theme.semantic.primary.normal })}
            >
              <IconCircleCheckFill sx={{ fontSize: "20px" }} />
            </Box>
            <Box
              as="span"
              sx={(theme) => ({
                fontWeight: 700,
                fontSize: "16px",
                color: theme.semantic.label.normal,
              })}
            >
              {t("driver_assigned")}
            </Box>
            <Box
              as="span"
              sx={(theme) => ({
                marginLeft: "auto",
                fontWeight: 700,
                fontSize: "15px",
                color: theme.semantic.primary.normal,
              })}
            >
              {etaLabel}
            </Box>
          </FlexBox>
          <Box
            sx={(theme) => ({
              background: theme.semantic.background.normal.normal,
              borderRadius: "16px",
              boxShadow: `inset 0 0 0 1px ${theme.semantic.primary.normal}`,
              padding: "16px",
            })}
          >
            <FlexBox alignItems="center" gap="12px">
              {avatar}
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
                  {driverName}
                </Box>
                <Box
                  as="span"
                  sx={(theme) => ({
                    display: "block",
                    fontSize: "12px",
                    color: theme.semantic.label.alternative,
                  })}
                >
                  {`${driverCar} · ${t("plate")} ${plate}`}
                </Box>
              </Box>
              <FlexBox
                alignItems="center"
                gap="3px"
                sx={(theme) => ({
                  fontWeight: 700,
                  fontSize: "14px",
                  color: theme.semantic.label.normal,
                })}
              >
                <Box as="span" sx={{ display: "inline-flex", color: "#FFB020" }}>
                  <IconStarFill sx={{ fontSize: "14px" }} />
                </Box>
                {rating}
              </FlexBox>
            </FlexBox>
            <FlexBox alignItems="center" gap="10px" sx={{ marginTop: "14px" }}>
              <Button
                variant="outlined"
                color="assistive"
                size="medium"
                fullWidth
                onClick={onCancel}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="solid"
                color="primary"
                size="medium"
                fullWidth
                leadingContent={<IconPhone sx={{ fontSize: "16px" }} />}
              >
                {t("call")}
              </Button>
            </FlexBox>
          </Box>
          <Button variant="solid" color="primary" size="large" fullWidth onClick={onBoard}>
            {L("탑승했어요", "I've boarded", "已上车", "乗車しました")}
          </Button>
        </>
      )}

      {rideStage === "onboard" && (
        <>
          <FlexBox alignItems="center" gap="10px">
            {stageIconPrimary(<CarGlyph size={19} />)}
            {stageTitle(
              L(
                `${destLabel}(으)로 이동 중`,
                `On the way to ${destLabel}`,
                `前往${destLabel}`,
                `${destLabel}へ移動中`,
              ),
            )}
            {stageEta(L("약 12분", "About 12 min", "约12分", "約12分"))}
          </FlexBox>
          {driverCardCompact}
          <Button variant="solid" color="primary" size="large" fullWidth onClick={onArrive}>
            {L("관광지에 도착했어요", "Arrived at the spot", "已到达景点", "観光地に到着")}
          </Button>
        </>
      )}

      {rideStage === "touring" && (
        <>
          <FlexBox alignItems="center" gap="10px">
            <Box
              as="span"
              sx={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                background: "#EAF7EE",
                color: "#12A150",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconLocationFill sx={{ fontSize: "19px" }} />
            </Box>
            {stageTitle(
              L(
                `${destLabel} 관광 중`,
                `Exploring ${destLabel}`,
                `正在游览${destLabel}`,
                `${destLabel}を観光中`,
              ),
            )}
          </FlexBox>
          <FlexBox
            alignItems="center"
            gap="8px"
            sx={{ background: "#EAF7EE", borderRadius: "12px", padding: "12px 14px" }}
          >
            <Box
              as="span"
              sx={{
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background: "#12A150",
                flexShrink: 0,
              }}
            />
            <Box as="span" sx={{ fontSize: "13px", fontWeight: 600, color: "#0E7C3F" }}>
              {L(
                "기사님이 대기하고 있어요",
                "Your driver is waiting",
                "司机正在等候",
                "ドライバーが待機中",
              )}
            </Box>
          </FlexBox>
          {driverCardCompact}
          <Button variant="solid" color="primary" size="large" fullWidth onClick={onReturn}>
            {L("항구로 복귀", "Return to port", "返回港口", "港へ戻る")}
          </Button>
          <Button variant="outlined" color="assistive" size="medium" fullWidth onClick={onExtend}>
            {L("관광 시간 연장", "Extend stay", "延长游览", "滞在を延長")}
          </Button>
        </>
      )}

      {rideStage === "returning" && (
        <>
          <FlexBox alignItems="center" gap="10px">
            {stageIconPrimary(<CarGlyph size={19} />)}
            {stageTitle(
              L(
                `${portLabel}(으)로 복귀 중`,
                `Returning to ${portLabel}`,
                `返回${portLabel}`,
                `${portLabel}へ戻り中`,
              ),
            )}
            {stageEta(L("약 20분", "About 20 min", "约20分", "約20分"))}
          </FlexBox>
          {driverCardCompact}
          <Button variant="solid" color="primary" size="large" fullWidth onClick={onArrivePort}>
            {L("복귀 완료", "Arrived at port", "已返回港口", "帰港完了")}
          </Button>
        </>
      )}
    </FlexBox>
  );
}

/* ─────────────── 공용 소품 ─────────────── */

function PlaceRow({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      type="button"
      onClick={onClick}
      sx={(theme) => ({
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        background: "none",
        padding: "11px 4px",
        borderBottom: `1px solid ${theme.semantic.line.normal.neutral}`,
      })}
    >
      <Box
        as="span"
        sx={(theme) => ({
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          flexShrink: 0,
          background: theme.semantic.fill.normal,
          color: theme.semantic.primary.normal,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        {icon}
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
          {title}
        </Box>
        {sub && (
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
        )}
      </Box>
    </Box>
  );
}

function CarCard({
  active,
  icon,
  label,
  sub,
  price,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  sub: string;
  price: string;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      type="button"
      onClick={onClick}
      sx={(theme) => ({
        flex: "0 0 156px",
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        borderRadius: "16px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "box-shadow 0.12s",
        background: active
          ? addOpacity(theme.semantic.primary.normal, theme.opacity[8])
          : theme.semantic.background.normal.normal,
        boxShadow: active
          ? `inset 0 0 0 2px ${theme.semantic.primary.normal}`
          : `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
      })}
    >
      <FlexBox alignItems="center" justifyContent="space-between">
        <Box
          as="span"
          sx={(theme) => ({
            width: "42px",
            height: "42px",
            borderRadius: "11px",
            background: theme.semantic.background.normal.normal,
            color: theme.semantic.label.neutral,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
          })}
        >
          {icon}
        </Box>
        {active && (
          <Box
            as="span"
            sx={(theme) => ({ display: "inline-flex", color: theme.semantic.primary.normal })}
          >
            <IconCircleCheckFill sx={{ fontSize: "20px" }} />
          </Box>
        )}
      </FlexBox>
      <Box>
        <Box
          as="span"
          sx={(theme) => ({
            display: "block",
            fontWeight: 700,
            fontSize: "15px",
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
            marginTop: "1px",
          })}
        >
          {sub}
        </Box>
      </Box>
      <Box
        as="span"
        sx={(theme) => ({ fontWeight: 800, fontSize: "17px", color: theme.semantic.label.normal })}
      >
        {price}
      </Box>
    </Box>
  );
}

function GlobalCarRow({
  car,
  active,
  onClick,
}: {
  car: GlobalCar;
  active: boolean;
  onClick: () => void;
}) {
  const { t, locale, money } = useI18n();
  const capLabel = `${car.cap}${seatsUnitFor(locale)}`;
  return (
    <Box
      as="button"
      type="button"
      onClick={onClick}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: "14px",
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
          flexShrink: 0,
          borderRadius: "13px",
          background: car.ibg,
          color: car.ifg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
          {`${capLabel} · ${t("gt_over")} ${money(car.over)}`}
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

function GlobalBanner() {
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
            {t("global_title")}
          </Box>
          <Box
            as="span"
            sx={(theme) => ({
              display: "block",
              fontSize: "11px",
              fontWeight: 600,
              color: theme.semantic.primary.normal,
              marginTop: "1px",
            })}
          >
            {t("global_partner")}
          </Box>
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
    </Box>
  );
}

function Dot({ tone }: { tone: "neutral" | "primary" }) {
  return (
    <Box
      as="span"
      sx={(theme) => ({
        width: "8px",
        height: "8px",
        borderRadius: "999px",
        flexShrink: 0,
        background:
          tone === "primary" ? theme.semantic.primary.normal : theme.semantic.label.neutral,
      })}
    />
  );
}

// 디자인 :871 원본 SVG(일반 택시 아이콘) — WDS 대응 아이콘 없어 코드로 직접(D2).
function CarGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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

// 디자인 :872 원본 SVG(대형 밴 아이콘) — WDS 대응 아이콘 없어 코드로 직접(D2).
function VanGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
