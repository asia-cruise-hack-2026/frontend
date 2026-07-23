import { useQuery } from "@tanstack/react-query";
import {
  addOpacity,
  Box,
  Button,
  FlexBox,
  SearchField,
  SegmentedControl,
  SegmentedControlItem,
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
import { listSpots, type Spot } from "@/entities/spot";
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

const CALL_SIM_MS = 2400; // 디자인 callTaxi 타이밍(:1169) 이식.

type Step = "dest" | "pickup" | "car" | "confirm";
type CallStatus = "idle" | "finding" | "assigned";
type Service = "normal" | "global";

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
  const cruiseId = useCruiseId();

  const { data: cruise } = useQuery({
    queryKey: ["cruise", cruiseId],
    queryFn: () => getCruise(cruiseId ?? ""),
    enabled: !!cruiseId,
  });
  const portKey = cruise?.portKey ?? "jeju";
  const { data: spots = [] } = useQuery({
    queryKey: ["spots", portKey],
    queryFn: () => listSpots({ portKey }),
  });

  const [step, setStep] = useState<Step>("dest");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [destId, setDestId] = useState<string | null>(null);
  const [destQuery, setDestQuery] = useState("");
  const [pickupName, setPickupName] = useState<string | null>(null);
  const [pickupQuery, setPickupQuery] = useState("");
  const [service, setService] = useState<Service>("normal");
  const [vehicleType, setVehicleType] = useState<VehicleType>("normal");
  const [globalCarKey, setGlobalCarKey] = useState<GlobalCarKey>("basic");

  // 기사 찾는 중 → 배정 시뮬레이션 (디자인 callTaxi :1169 이식).
  useEffect(() => {
    if (callStatus !== "finding") return;
    const id = setTimeout(() => setCallStatus("assigned"), CALL_SIM_MS);
    return () => clearTimeout(id);
  }, [callStatus]);

  const portLabel = cruise?.portName[locale] ?? "";
  const destSpot = spots.find((s) => s.id === destId);
  const destLabel = destSpot?.name[locale] ?? "";
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

  const selectDest = (id: string) => {
    setDestId(id);
    setStep("pickup");
  };
  const selectPickup = (name: string) => {
    setPickupName(name);
    setStep("car");
  };
  const changeDest = () => setStep("dest");
  const goBack = () => setStep(PREV_STEP[step]);
  const goConfirm = () => setStep("confirm");
  const callTaxi = () => setCallStatus("finding");
  const cancelTaxi = () => setCallStatus("idle");

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100%",
        background: theme.semantic.background.normal.alternative,
      })}
    >
      <Header step={step} callStatus={callStatus} onBack={goBack} />

      {callStatus === "idle" && (
        <>
          {step === "dest" && (
            <DestStep
              spots={spots}
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
        <AssignedView
          driverName={TAXI_DRIVER.name[locale]}
          driverCar={TAXI_DRIVER.car[locale]}
          plate={TAXI_DRIVER.plate}
          rating={TAXI_DRIVER.rating}
          etaLabel={`${TAXI_DRIVER.eta}${t("min")}`}
          onCancel={cancelTaxi}
        />
      )}
    </Box>
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
  spots: Spot[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const q = query.trim().toLowerCase();
  const results = spots.filter((s) => !q || s.name[locale].toLowerCase().includes(q));

  return (
    <Box sx={{ padding: "14px 20px 28px" }}>
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
          margin: "16px 0 2px",
        })}
      >
        {t("search_results")}
      </Box>
      <FlexBox flexDirection="column">
        {results.map((spot) => (
          <PlaceRow
            key={spot.id}
            icon={<IconPinFill sx={{ fontSize: "18px" }} />}
            title={spot.name[locale]}
            sub={`${spot.cat[locale]} · ${spot.km}km`}
            onClick={() => onSelect(spot.id)}
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
    <Box sx={{ padding: "10px 20px 28px" }}>
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
            <IconLocationFill sx={{ fontSize: "18px" }} />
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
            <IconCircleCheckFill sx={{ fontSize: "20px" }} />
          </Box>
        </Box>
      )}

      <Box
        sx={(theme) => ({
          fontSize: "12px",
          fontWeight: 600,
          color: theme.semantic.label.assistive,
          margin: "16px 0 2px",
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
    <Box sx={{ padding: "12px 20px 28px" }}>
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
            icon={<CarGlyph />}
            label={t("car_normal")}
            sub={`${t("car_normal_sub")} · ${etaLabel}`}
            price={money(fareNormal)}
            onClick={() => onSelectVehicle("normal")}
          />
          <CarCard
            active={vehicleType === "van"}
            icon={<VanGlyph />}
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

      <Box sx={{ marginTop: "20px" }}>
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
    <Box sx={{ padding: "12px 20px 28px" }}>
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
    <Box sx={{ padding: "48px 24px 24px", textAlign: "center" }}>
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

function AssignedView({
  driverName,
  driverCar,
  plate,
  rating,
  etaLabel,
  onCancel,
}: {
  driverName: string;
  driverCar: string;
  plate: string;
  rating: number;
  etaLabel: string;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  return (
    <Box sx={{ padding: "14px 20px 28px" }}>
      <FlexBox alignItems="center" gap="8px" sx={{ marginBottom: "12px" }}>
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
          <Box
            as="span"
            sx={(theme) => ({
              width: "48px",
              height: "48px",
              borderRadius: "999px",
              background: theme.semantic.fill.normal,
              color: theme.semantic.label.neutral,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            })}
          >
            <CarGlyph size={26} />
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
          <Button variant="outlined" color="assistive" size="medium" fullWidth onClick={onCancel}>
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
    </Box>
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
        background: active
          ? addOpacity(theme.semantic.primary.normal, theme.opacity[8])
          : theme.semantic.background.normal.normal,
        boxShadow: active
          ? `inset 0 0 0 1.5px ${theme.semantic.primary.normal}`
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
            <IconCircleCheckFill sx={{ fontSize: "18px" }} />
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
        background: active
          ? addOpacity(theme.semantic.primary.normal, theme.opacity[8])
          : theme.semantic.background.normal.normal,
        boxShadow: active
          ? `inset 0 0 0 1.5px ${theme.semantic.primary.normal}`
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
        }}
      >
        {car.van ? <VanGlyph size={26} /> : <CarGlyph size={26} />}
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
