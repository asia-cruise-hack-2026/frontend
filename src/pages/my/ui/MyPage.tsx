import { useQuery } from "@tanstack/react-query";
import { addOpacity, Box, FlexBox } from "@wanteddev/wds";
import { IconVerifiedCheckFill } from "@wanteddev/wds-icon";

import { getCruise } from "@/entities/cruise";
import { LOCALE_META, LOCALES, useI18n } from "@/shared/i18n";
import { useCruiseId } from "@/shared/store";

// 내 크루즈 카드 선박 아이콘 — 디자인 :946, HomePage/CruiseSelectPage의 ShipMini/ShipGlyph와 동일 산출물
// (entities/cruise엔 아이콘 export가 없어 로컬 복제, D2).
function ShipGlyph() {
  return (
    <svg
      width="24"
      height="24"
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

// 디자인 renderVals :1484 boardBy:fmt(cruiseObj.depM-30) — HomePage의 fmt와 동일 산출물.
const fmt = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** 마이 — 프로토타입 "MY"(:938-970) 이식 */
export function MyPage() {
  const { t, locale, setLocale } = useI18n();
  const cruiseId = useCruiseId();
  const { data: cruise } = useQuery({
    queryKey: ["cruise", cruiseId],
    queryFn: () => getCruise(cruiseId ?? ""),
    enabled: !!cruiseId,
  });

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100%",
        background: theme.semantic.background.normal.alternative,
      })}
    >
      <Box
        sx={(theme) => ({
          padding: "18px 20px 14px",
          background: theme.semantic.background.normal.normal,
        })}
      >
        <Box
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: "20px",
            color: theme.semantic.label.normal,
          })}
        >
          {t("nav_my")}
        </Box>
      </Box>

      {cruise && (
        <Box
          sx={(theme) => ({
            margin: "14px 20px 0",
            background: theme.semantic.background.normal.normal,
            borderRadius: "16px",
            boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
            overflow: "hidden",
          })}
        >
          <FlexBox
            alignItems="center"
            gap="12px"
            sx={(theme) => ({
              padding: "16px",
              background: theme.semantic.primary.normal,
              color: theme.semantic.static.white,
            })}
          >
            <Box as="span" sx={{ display: "inline-flex" }}>
              <ShipGlyph />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ fontSize: "12px", opacity: 0.85 }}>{t("my_cruise")}</Box>
              <Box sx={{ fontWeight: 700, fontSize: "16px" }}>{cruise.ship}</Box>
            </Box>
          </FlexBox>
          <Box sx={{ padding: "4px 16px" }}>
            <FlexBox
              alignItems="center"
              justifyContent="space-between"
              sx={(theme) => ({
                padding: "12px 0",
                borderBottom: `1px solid ${theme.semantic.line.normal.neutral}`,
                fontSize: "13px",
              })}
            >
              <Box as="span" sx={(theme) => ({ color: theme.semantic.label.alternative })}>
                {t("docking_port")}
              </Box>
              <Box
                as="span"
                sx={(theme) => ({ fontWeight: 600, color: theme.semantic.label.normal })}
              >
                {cruise.portName[locale]}
              </Box>
            </FlexBox>
            <FlexBox
              alignItems="center"
              justifyContent="space-between"
              sx={(theme) => ({
                padding: "12px 0",
                borderBottom: `1px solid ${theme.semantic.line.normal.neutral}`,
                fontSize: "13px",
              })}
            >
              <Box as="span" sx={(theme) => ({ color: theme.semantic.label.alternative })}>
                {t("board_by")}
              </Box>
              <Box
                as="span"
                sx={(theme) => ({ fontWeight: 700, color: theme.semantic.primary.normal })}
              >
                {fmt(cruise.depM - 30)}
              </Box>
            </FlexBox>
            <FlexBox
              alignItems="center"
              justifyContent="space-between"
              sx={{ padding: "12px 0", fontSize: "13px" }}
            >
              <Box as="span" sx={(theme) => ({ color: theme.semantic.label.alternative })}>
                {t("next_dest")}
              </Box>
              <Box
                as="span"
                sx={(theme) => ({ fontWeight: 600, color: theme.semantic.label.normal })}
              >
                {cruise.nextDest[locale]}
              </Box>
            </FlexBox>
          </Box>
        </Box>
      )}

      <Box sx={{ margin: "14px 20px 0" }}>
        <Box
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: "14px",
            color: theme.semantic.label.normal,
            marginBottom: "8px",
          })}
        >
          {t("language")}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {LOCALES.map((l) => {
            const meta = LOCALE_META[l];
            const active = l === locale;
            return (
              <Box
                key={l}
                as="button"
                type="button"
                onClick={() => setLocale(l)}
                sx={(theme) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "12px",
                  padding: "12px",
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
                  sx={(theme) => ({
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: theme.semantic.background.normal.normal,
                    boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "11px",
                    color: theme.semantic.label.neutral,
                    flexShrink: 0,
                  })}
                >
                  {meta.code}
                </Box>
                <Box
                  as="span"
                  sx={(theme) => ({
                    fontSize: "13px",
                    fontWeight: 600,
                    color: theme.semantic.label.normal,
                  })}
                >
                  {meta.label}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          margin: "16px 20px 0",
          background: "#EAF3FF",
          borderRadius: "16px",
          padding: "16px",
        }}
      >
        <FlexBox
          alignItems="center"
          gap="8px"
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: "15px",
            color: theme.semantic.primary.normal,
          })}
        >
          <Box as="span" sx={{ display: "inline-flex" }}>
            <IconVerifiedCheckFill sx={{ fontSize: "20px" }} />
          </Box>
          {t("about_trust")}
        </FlexBox>
        <Box
          as="p"
          sx={(theme) => ({
            margin: "10px 0 0",
            fontSize: "13px",
            lineHeight: 1.6,
            color: theme.semantic.label.neutral,
          })}
        >
          {t("trust_body")}
        </Box>
      </Box>

      <Box sx={{ height: "20px" }} />
    </Box>
  );
}
