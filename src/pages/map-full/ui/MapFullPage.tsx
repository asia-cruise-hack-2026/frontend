import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box } from "@wanteddev/wds";
import { IconClose } from "@wanteddev/wds-icon";
import { getCruise } from "@/entities/cruise";
import { listReachableSpots } from "@/entities/spot";
import { useI18n } from "@/shared/i18n";
import { useCruiseId } from "@/shared/store";
import { PortMap } from "@/widgets/port-map";

/** 풀스크린 지도 — 홈 지도 탭 확대 전환 목적지(디자인 MAP FULL :1069-1073). 마커는 홈과 동일, 닫기=홈 복귀. */
export function MapFullPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
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

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        background: "#CFE4F2",
        viewTransitionName: "home-map",
      }}
    >
      <PortMap
        port={{ lat: cruise?.portLat ?? 33.523, lng: cruise?.portLng ?? 126.537 }}
        portName={cruise?.portName ?? ""}
        spots={spots}
        zoom={13}
        interactive
      />
      {/* 닫기 FAB — 디자인 :1072 */}
      <Box
        as="button"
        type="button"
        onClick={() => navigate({ to: "/app", viewTransition: true })}
        aria-label="close map"
        sx={(theme) => ({
          position: "absolute",
          top: "16px",
          left: "16px",
          width: "42px",
          height: "42px",
          borderRadius: "999px",
          border: "none",
          cursor: "pointer",
          background: "rgba(255,255,255,.96)",
          boxShadow: "0 2px 10px rgba(0,0,0,.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.semantic.label.normal,
          zIndex: 2,
        })}
      >
        <IconClose sx={{ fontSize: "24px" }} />
      </Box>
    </Box>
  );
}
