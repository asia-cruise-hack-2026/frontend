import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, FlexBox } from "@wanteddev/wds";
import { IconArrowLeft, IconCheck, IconSparkle } from "@wanteddev/wds-icon";
import { useState } from "react";

import { conceptSpotIds, listReachableSpots } from "@/entities/spot";
import { useI18n } from "@/shared/i18n";
import { sessionActions, useCruiseId } from "@/shared/store";
import { AiButton } from "@/shared/ui";

type ConceptKey = "highlights" | "nature" | "food" | "photo";

// 디자인 "AI 테마 선택"(design_handoff_jeju_ai) — 풀페이지 사진 카드 2×2. 사진은 핸드오프 에셋(Unsplash).
const CONCEPT_DEF: { key: ConceptKey; img: string }[] = [
  { key: "highlights", img: "/images/concept-highlights.jpg" },
  { key: "nature", img: "/images/concept-nature.jpg" },
  { key: "food", img: "/images/concept-food.jpg" },
  { key: "photo", img: "/images/concept-photo.jpg" },
];

/**
 * AI 컨셉 픽커 — 디자인 "AI 테마 선택" 리디자인: 사진 카드 단일선택(토글) 후 CTA로 생성.
 * 링·체크 강조색은 핸드오프의 #0B5EFC 대신 우리 브랜드 토큰을 따른다.
 */
export function AiConceptPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const cruiseId = useCruiseId();
  const [picked, setPicked] = useState<ConceptKey | null>(null);

  // 실 DB 스팟(도달 가능 목록) — 컨셉 매칭 풀. 이동/패키지와 동일 소스
  const { data: spots = [] } = useQuery({
    queryKey: ["reachable-spots", cruiseId, locale, 30],
    queryFn: () => listReachableSpots(cruiseId ?? "", locale, 30),
    enabled: !!cruiseId,
  });

  const makeCourse = () => {
    if (!picked) return;
    sessionActions.setPkgSpots(conceptSpotIds(picked, spots));
    sessionActions.setRouteConfirmed(false); // 초안 — 패키지에서 확정해야 홈에 노출
    navigate({ to: "/app/package" });
  };

  return (
    <FlexBox
      flexDirection="column"
      sx={(theme) => ({ height: "100dvh", background: theme.semantic.background.normal.normal })}
    >
      {/* 헤더 — 디자인 상단(뒤로 + 타이틀) */}
      <Box sx={{ padding: "14px 20px 12px", flexShrink: 0 }}>
        <Box
          as="button"
          type="button"
          aria-label="back"
          onClick={() => navigate({ to: "/app" })}
          sx={(theme) => ({
            width: "40px",
            height: "40px",
            margin: "0 0 10px -8px",
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
        <Box
          as="h1"
          sx={(theme) => ({
            margin: "0 0 5px",
            fontWeight: 700,
            fontSize: "24px",
            lineHeight: 1.3,
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
            lineHeight: 1.5,
            color: theme.semantic.label.alternative,
          })}
        >
          {t("concept_sub")}
        </Box>
      </Box>

      {/* 사진 카드 2×2 — 화면을 가득 채움, 단일선택 토글 */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "12px",
          padding: "4px 20px 16px",
        }}
      >
        {CONCEPT_DEF.map((c) => {
          const sel = picked === c.key;
          return (
            <Box
              key={c.key}
              as="button"
              type="button"
              onClick={() => setPicked((prev) => (prev === c.key ? null : c.key))}
              sx={(theme) => ({
                position: "relative",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "20px",
                overflow: "hidden",
                background: theme.semantic.fill.normal,
                boxShadow: sel
                  ? `inset 0 0 0 3px ${theme.semantic.primary.normal}, 0 8px 22px rgba(37,99,235,0.28)`
                  : `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
                transition: "box-shadow .18s ease",
              })}
            >
              <img
                src={c.img}
                alt=""
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(26,26,26,0) 42%, rgba(26,26,26,0.62) 100%)",
                  pointerEvents: "none",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  left: "14px",
                  right: "14px",
                  bottom: "12px",
                  pointerEvents: "none",
                }}
              >
                <Box
                  as="span"
                  sx={{
                    display: "block",
                    fontWeight: 700,
                    fontSize: "16px",
                    letterSpacing: "-0.01em",
                    color: "#fff",
                  }}
                >
                  {t(`concept_${c.key}`)}
                </Box>
                <Box
                  as="span"
                  sx={{
                    display: "block",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.82)",
                    marginTop: "2px",
                  }}
                >
                  {t(`concept_${c.key}_sub`)}
                </Box>
              </Box>
              {/* 우상단 체크 — 선택 시 브랜드 채움 */}
              <Box
                as="span"
                sx={(theme) => ({
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: sel ? theme.semantic.primary.normal : "rgba(255,255,255,0.85)",
                  color: sel ? theme.semantic.static.white : "rgba(55,56,60,0.4)",
                  boxShadow: sel
                    ? "0 4px 12px rgba(37,99,235,0.4)"
                    : "0 2px 8px rgba(26,26,26,0.18)",
                  transition: "background .15s ease",
                })}
              >
                <IconCheck sx={{ fontSize: "18px" }} />
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* 푸터 — 힌트 + CTA(선택 전 비활성) */}
      <FlexBox
        flexDirection="column"
        gap="9px"
        sx={(theme) => ({
          padding: "12px 20px 20px",
          flexShrink: 0,
          borderTop: `1px solid ${theme.semantic.line.normal.neutral}`,
        })}
      >
        <FlexBox
          alignItems="center"
          justifyContent="center"
          gap="6px"
          sx={(theme) => ({ fontSize: "12px", color: theme.semantic.label.alternative })}
        >
          <Box
            as="span"
            sx={(theme) => ({ display: "inline-flex", color: theme.semantic.primary.normal })}
          >
            <IconSparkle sx={{ fontSize: "14px" }} />
          </Box>
          {t("concept_go")}
        </FlexBox>
        <AiButton fullWidth disabled={!picked} onClick={makeCourse}>
          {picked ? t("concept_cta") : t("concept_pick_first")}
        </AiButton>
      </FlexBox>
    </FlexBox>
  );
}
