import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, FlexBox } from "@wanteddev/wds";
import { IconArrowLeft, IconCameraFill, IconSparkleFill, IconStarFill } from "@wanteddev/wds-icon";
import type { ReactNode } from "react";

import { getCruise } from "@/entities/cruise";
import { conceptSpotIds, listSpots } from "@/entities/spot";
import { useI18n } from "@/shared/i18n";
import { sessionActions, useCruiseId } from "@/shared/store";

// 디자인 :336 원본 잎사귀 SVG(nature 컨셉) — WDS 대응 아이콘 없어 코드로 직접(D2).
function LeafGlyph() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 21c.5 -4.5 2.5 -8 7 -10" />
      <path d="M9 18c6.218 0 10.5 -3.288 11 -12v-2h-4.014c-9 0 -11.986 4 -12 9c0 1 0 3 2 5h3l.014 0" />
    </svg>
  );
}

// 디자인 :337 원본 셰프모자 SVG(food 컨셉, ExploreScreen FoodGlyph와 동일 경로)
// — WDS 대응 아이콘 없어 코드로 직접(D2).
function ChefHatGlyph() {
  return (
    <svg
      width="26"
      height="26"
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

type ConceptKey = "highlights" | "nature" | "food" | "photo";

// 컨셉 카드 정의(아이콘 박스 bg/fg) — 디자인 renderVals :1580.
// highlights 아이콘 = starFill (디자인 원본 :335).
// photo는 WDS IconCameraFill로 대체, nature·food는 WDS에 대응 아이콘이 없어
// 디자인 원본 SVG를 그대로 코드로 직접(D2).
const CONCEPT_DEF: { key: ConceptKey; bg: string; fg: string; icon: ReactNode }[] = [
  {
    key: "highlights",
    bg: "var(--primary-normal-8)",
    fg: "var(--primary-normal-4)",
    icon: <IconStarFill sx={{ fontSize: "24px" }} />,
  },
  { key: "nature", bg: "#EAF7EE", fg: "#12A150", icon: <LeafGlyph /> },
  { key: "food", bg: "#FFF1E6", fg: "#E8820E", icon: <ChefHatGlyph /> },
  {
    key: "photo",
    bg: "#F3ECFF",
    fg: "#8B3FF0",
    icon: <IconCameraFill sx={{ fontSize: "26px" }} />,
  },
];

/** AI 컨셉 픽커 — 프로토타입 "AI CONCEPT"(:319-354) 이식. 컨셉을 고르면 매칭 스팟을 자동 선정해 패키지 화면으로 이동. */
export function AiConceptPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
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

  const pickConcept = (key: ConceptKey) => {
    sessionActions.setPkgSpots(conceptSpotIds(key, spots));
    navigate({ to: "/app/package" });
  };

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100%",
        background: theme.semantic.background.normal.normal,
      })}
    >
      {/* 헤더 — 디자인 :322-324 */}
      <FlexBox alignItems="center" sx={{ height: "52px", padding: "0 8px" }}>
        <Box
          as="button"
          type="button"
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

      {/* 타이틀 — 디자인 :325-329 */}
      <Box sx={{ padding: "0 24px 8px" }}>
        <FlexBox
          alignItems="center"
          gap="6px"
          sx={{
            display: "inline-flex",
            background: "#F3ECFF",
            color: "#8B3FF0",
            borderRadius: "999px",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 700,
            marginBottom: "14px",
          }}
        >
          <Box as="span" sx={{ display: "inline-flex" }}>
            <IconSparkleFill sx={{ fontSize: "14px" }} />
          </Box>
          AI
        </FlexBox>
        <Box
          as="h1"
          sx={(theme) => ({
            margin: "0 0 6px",
            fontWeight: 700,
            fontSize: "24px",
            lineHeight: 1.34,
            letterSpacing: "-0.02em",
            color: theme.semantic.label.normal,
          })}
        >
          {t("concept_title")}
        </Box>
        <Box
          as="p"
          sx={(theme) => ({
            margin: 0,
            fontSize: "14px",
            lineHeight: 1.55,
            color: theme.semantic.label.alternative,
          })}
        >
          {t("concept_sub")}
        </Box>
      </Box>

      {/* 컨셉 카드 4개 + 하단 안내 — 디자인 :330-351 */}
      <Box sx={{ padding: "14px 24px 24px" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {CONCEPT_DEF.map((c) => (
            <Box
              key={c.key}
              as="button"
              type="button"
              onClick={() => pickConcept(c.key)}
              sx={(theme) => ({
                textAlign: "left",
                border: "none",
                cursor: "pointer",
                background: theme.semantic.background.normal.normal,
                borderRadius: "18px",
                padding: "18px 16px",
                boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
                display: "flex",
                flexDirection: "column",
                gap: "38px",
                minHeight: "150px",
              })}
            >
              <Box
                as="span"
                sx={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "13px",
                  background: c.bg,
                  color: c.fg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {c.icon}
              </Box>
              <Box as="span">
                <Box
                  as="span"
                  sx={(theme) => ({
                    display: "block",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: theme.semantic.label.normal,
                  })}
                >
                  {t(`concept_${c.key}`)}
                </Box>
                <Box
                  as="span"
                  sx={(theme) => ({
                    display: "block",
                    fontSize: "12px",
                    color: theme.semantic.label.alternative,
                    marginTop: "3px",
                    lineHeight: 1.4,
                  })}
                >
                  {t(`concept_${c.key}_sub`)}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
