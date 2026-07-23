import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { addOpacity, Box, Button, FlexBox, Option, Select } from "@wanteddev/wds";
import { IconClockFill, IconLocationFill } from "@wanteddev/wds-icon";
import { useEffect, useState } from "react";

import {
  BOARD_CLOSE_MIN,
  cruiseStatus,
  fmtHM,
  listCruisesForSelect,
  localDateStr,
  minutesToDeparture,
} from "@/entities/cruise";
import { useI18n } from "@/shared/i18n";
import { sessionActions } from "@/shared/store";

// 디자인 :95 원본 선박 SVG — WDS 대응 아이콘 없어 코드로 직접(D2).
function ShipGlyph() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
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

/** 크루즈 선택 — 오늘 크루즈(없으면 다음 기항일 폴백) + 출항/마감/임박 시간 규칙 */
export function CruiseSelectPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const today = localDateStr(new Date());
  const { data, refetch } = useQuery({
    queryKey: ["cruises", "select", today, locale],
    queryFn: () => listCruisesForSelect(today, locale),
  });
  const [cruiseId, setCruiseId] = useState("");
  const [startError, setStartError] = useState(false);

  // 시간 규칙 실시간 재평가(30초) — 목록 필터·배너·버튼 상태가 시각에 따라 변함
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const nowMs = now.getTime();
  // 출항 지난 크루즈는 노출 제외 (마감된 크루즈는 노출하되 시작 차단)
  const visible = (data?.items ?? []).filter((c) => minutesToDeparture(c, nowMs) > 0);
  const selected = visible.find((c) => c.id === cruiseId);
  const status = selected ? cruiseStatus(selected, nowMs) : null;
  const isEmpty = !!data && visible.length === 0;

  // 오늘 목록이 화면에 떠 있는 동안 모두 출항해 버리면 폴백 재조회
  useEffect(() => {
    if (data && !data.isFallback && data.items.length > 0 && visible.length === 0) void refetch();
  }, [data, visible.length, refetch]);

  const stayLabel = (arrM: number, depM: number) => {
    const h = Math.floor((depM - arrM) / 60);
    if (locale === "ko") return `${h}시간`;
    if (locale === "zh") return `${h}小时`;
    if (locale === "ja") return `${h}時間`;
    return `${h} hours`;
  };

  const dateLabel = (iso: string) => {
    const [, m, d] = iso.split("-").map(Number);
    if (locale === "en") {
      const mon = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][m - 1];
      return `${mon} ${d}`;
    }
    if (locale === "ko") return `${m}월 ${d}일`;
    return `${m}月${d}日`;
  };

  const start = () => {
    if (!selected) return;
    // 클릭 시점 재검증 — 화면이 오래 떠 있던(stale) 경우 방어
    const s = cruiseStatus(selected, Date.now());
    if (s === "departed") {
      setStartError(true);
      setCruiseId("");
      void refetch();
      return;
    }
    if (s === "closed") return;
    sessionActions.setCruiseId(selected.id);
    navigate({ to: "/app" });
  };

  return (
    <FlexBox
      flexDirection="column"
      sx={{ minHeight: "100dvh", padding: "20px 24px 24px", overflowY: "auto" }}
    >
      <Box
        as="h1"
        sx={(theme) => ({
          margin: "0 0 8px",
          fontWeight: 700,
          fontSize: "24px",
          lineHeight: 1.36,
          letterSpacing: "-0.02em",
          color: theme.semantic.label.normal,
        })}
      >
        {t("cruise_q")}
      </Box>
      <Box
        as="p"
        sx={(theme) => ({
          margin: "0 0 22px",
          fontSize: "15px",
          lineHeight: 1.55,
          color: theme.semantic.label.alternative,
        })}
      >
        {t("cruise_q_sub")}
      </Box>

      {/* 다음 기항일 폴백 안내 */}
      {data?.isFallback && visible.length > 0 && (
        <Box
          sx={(theme) => ({
            marginBottom: "14px",
            padding: "12px 14px",
            borderRadius: "12px",
            background: theme.semantic.fill.normal,
            fontSize: "13px",
            lineHeight: 1.5,
            color: theme.semantic.label.neutral,
          })}
        >
          {t("cruise_fallback_notice").replace("{date}", dateLabel(data.date))}
        </Box>
      )}

      {isEmpty ? (
        <Box
          sx={(theme) => ({
            padding: "48px 0",
            textAlign: "center",
            fontSize: "15px",
            color: theme.semantic.label.alternative,
          })}
        >
          {t("cruise_empty")}
        </Box>
      ) : (
        <Select
          value={cruiseId}
          onChange={(v) => {
            setCruiseId(v);
            setStartError(false);
          }}
          placeholder={t("select_cruise")}
          width="100%"
        >
          {visible.map((c) => {
            const closed = cruiseStatus(c, nowMs) === "closed";
            return (
              <Option key={c.id} value={c.id}>
                {`${c.ship} · ${c.arr}–${c.dep}${closed ? ` · ${t("cruise_closed_badge")}` : ""}`}
              </Option>
            );
          })}
        </Select>
      )}

      {/* 디자인 :93 카드 등장 페이드 */}
      <style>
        {
          "@keyframes cs-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}"
        }
      </style>
      {selected && (
        <Box
          sx={(theme) => ({
            marginTop: "20px",
            borderRadius: "18px",
            background: theme.semantic.background.normal.normal,
            boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
            overflow: "hidden",
            animation: "cs-fade 0.3s ease both",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          })}
        >
          <FlexBox
            alignItems="center"
            gap="12px"
            sx={(theme) => ({
              padding: "16px 18px",
              background: theme.semantic.primary.normal,
              color: theme.semantic.static.white,
            })}
          >
            <Box as="span" sx={{ display: "inline-flex" }}>
              <ShipGlyph />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ fontWeight: 700, fontSize: "17px" }}>{selected.ship}</Box>
              <Box sx={{ fontSize: "13px", opacity: 0.85 }}>
                {`${dateLabel(selected.date)} · ${selected.berth}`}
              </Box>
            </Box>
          </FlexBox>
          <Box sx={{ padding: "6px 18px" }}>
            <FlexBox
              alignItems="center"
              gap="12px"
              sx={(theme) => ({
                padding: "13px 0",
                borderBottom: `1px solid ${theme.semantic.line.normal.neutral}`,
              })}
            >
              <Box
                as="span"
                sx={(theme) => ({ display: "inline-flex", color: theme.semantic.primary.normal })}
              >
                <IconLocationFill sx={{ fontSize: "20px" }} />
              </Box>
              <Box
                sx={(theme) => ({
                  flex: 1,
                  fontSize: "13px",
                  color: theme.semantic.label.alternative,
                })}
              >
                {t("docking_port")}
              </Box>
              <Box
                sx={(theme) => ({
                  fontWeight: 600,
                  fontSize: "15px",
                  color: theme.semantic.label.normal,
                })}
              >
                {selected.portName}
              </Box>
            </FlexBox>
            <FlexBox alignItems="center" gap="12px" sx={{ padding: "13px 0" }}>
              <Box
                as="span"
                sx={(theme) => ({ display: "inline-flex", color: theme.semantic.primary.normal })}
              >
                <IconClockFill sx={{ fontSize: "20px" }} />
              </Box>
              <Box
                sx={(theme) => ({
                  flex: 1,
                  fontSize: "13px",
                  color: theme.semantic.label.alternative,
                })}
              >
                {t("time_in_jeju")}
              </Box>
              <Box
                sx={(theme) => ({
                  fontWeight: 700,
                  fontSize: "15px",
                  color: theme.semantic.primary.normal,
                })}
              >
                {`${stayLabel(selected.arrM, selected.depM)} · ${selected.arr}–${selected.dep}`}
              </Box>
            </FlexBox>

            {/* 임박 경고 — 탑승 마감(출항 1시간 전)까지 여유가 90분 미만 */}
            {status === "imminent" && (
              <Box
                sx={{
                  margin: "2px 0 14px",
                  padding: "11px 13px",
                  borderRadius: "11px",
                  background: "rgba(181,98,10,.08)",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  fontWeight: 600,
                  color: "#B5620A",
                }}
              >
                {t("cruise_imminent_warn")
                  .replace("{time}", fmtHM(selected.depM - BOARD_CLOSE_MIN))
                  .replace("{min}", String(minutesToDeparture(selected, nowMs) - BOARD_CLOSE_MIN))}
              </Box>
            )}

            {/* 탑승 마감 — 시작 불가 안내 */}
            {status === "closed" && (
              <Box
                sx={(theme) => ({
                  margin: "2px 0 14px",
                  padding: "11px 13px",
                  borderRadius: "11px",
                  background: addOpacity(theme.semantic.status.negative, theme.opacity[8]),
                  fontSize: "13px",
                  lineHeight: 1.5,
                  fontWeight: 600,
                  color: theme.semantic.status.negative,
                })}
              >
                {t("cruise_closed_desc")}
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ flex: 1 }} />

      {/* 출항 지난 크루즈를 시작하려던 경우 피드백 */}
      {startError && (
        <Box
          sx={(theme) => ({
            marginTop: "14px",
            padding: "11px 13px",
            borderRadius: "11px",
            background: addOpacity(theme.semantic.status.negative, theme.opacity[8]),
            fontSize: "13px",
            lineHeight: 1.5,
            fontWeight: 600,
            color: theme.semantic.status.negative,
          })}
        >
          {t("cruise_departed_feedback")}
        </Box>
      )}

      <Box sx={{ marginTop: "22px" }}>
        <Button
          variant="solid"
          color="primary"
          size="large"
          fullWidth
          disabled={!selected || status === "closed"}
          onClick={start}
        >
          {t("get_started")}
        </Button>
      </Box>
    </FlexBox>
  );
}
