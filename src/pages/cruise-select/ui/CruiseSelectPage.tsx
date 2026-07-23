import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, Button, FlexBox, Option, Select } from "@wanteddev/wds";
import { IconClockFill, IconLocationFill } from "@wanteddev/wds-icon";
import { useState } from "react";

import { listCruises, localDateStr } from "@/entities/cruise";
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

/** 크루즈 선택 — 프로토타입 "Cruise select"(:82-122) 이식 */
export function CruiseSelectPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const today = localDateStr(new Date());
  const { data: cruises = [] } = useQuery({
    queryKey: ["cruises", today, locale],
    queryFn: () => listCruises({ date: today, lang: locale }),
  });
  const [cruiseId, setCruiseId] = useState("");
  const selected = cruises.find((c) => c.id === cruiseId);

  const stayLabel = (arrM: number, depM: number) => {
    const h = Math.floor((depM - arrM) / 60);
    if (locale === "ko") return `${h}시간`;
    if (locale === "zh") return `${h}小时`;
    if (locale === "ja") return `${h}時間`;
    return `${h} hours`;
  };

  const start = () => {
    if (!cruiseId) return;
    sessionActions.setCruiseId(cruiseId);
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

      <Select
        value={cruiseId}
        onChange={(v) => setCruiseId(v)}
        placeholder={t("select_cruise")}
        width="100%"
      >
        {cruises.map((c) => (
          <Option key={c.id} value={c.id}>
            {`${c.ship} · ${c.arr}–${c.dep}`}
          </Option>
        ))}
      </Select>

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
              <Box sx={{ fontSize: "13px", opacity: 0.85 }}>{selected.berth}</Box>
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
          </Box>
        </Box>
      )}

      <Box sx={{ flex: 1 }} />

      <Box sx={{ marginTop: "22px" }}>
        <Button
          variant="solid"
          color="primary"
          size="large"
          fullWidth
          disabled={!cruiseId}
          onClick={start}
        >
          {t("get_started")}
        </Button>
      </Box>
    </FlexBox>
  );
}
