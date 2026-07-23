import { useNavigate } from "@tanstack/react-router";
import { Box, Button, FlexBox, addOpacity } from "@wanteddev/wds";
import { IconCircleCheckFill } from "@wanteddev/wds-icon";
import { useState } from "react";

import { LOCALE_META, LOCALES, type Locale, useI18n } from "@/shared/i18n";

/** 언어 선택 (진입 화면) — 프로토타입 "Language select" 이식 */
export function LangSelectPage() {
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Locale>(locale);

  const confirm = () => {
    setLocale(selected);
    navigate({ to: "/cruise" });
  };

  return (
    <FlexBox
      flexDirection="column"
      sx={{ minHeight: "100dvh", padding: "16px 24px 28px", overflowY: "auto" }}
    >
      <FlexBox flexDirection="column" sx={{ flex: 1, justifyContent: "center" }}>
        {/* 브랜드 워드마크 — 디자인 최종: omong.svg (좌측 정렬) */}
        <img
          src="/brand/omong.svg"
          alt="OMONG"
          style={{
            height: "60px",
            width: "auto",
            alignSelf: "flex-start",
            display: "block",
            marginBottom: "20px",
            objectFit: "contain",
          }}
        />
        <Box
          as="h1"
          sx={(theme) => ({
            margin: "6px 0 8px",
            fontWeight: 700,
            fontSize: "27px",
            lineHeight: 1.32,
            letterSpacing: "-0.02em",
            color: theme.semantic.label.normal,
          })}
        >
          {t("choose_language")}
        </Box>
        <Box
          as="p"
          sx={(theme) => ({
            margin: "0 0 24px",
            fontSize: "15px",
            lineHeight: 1.55,
            color: theme.semantic.label.alternative,
          })}
        >
          {t("lang_sub")}
        </Box>

        {/* 언어 카드 */}
        <FlexBox flexDirection="column" gap="10px">
          {LOCALES.map((l) => {
            const meta = LOCALE_META[l];
            const active = l === selected;
            return (
              <Box
                as="button"
                key={l}
                type="button"
                onClick={() => setSelected(l)}
                sx={(theme) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "box-shadow 0.12s",
                  background: active
                    ? addOpacity(theme.semantic.primary.normal, theme.opacity[8])
                    : theme.semantic.background.normal.alternative,
                  boxShadow: active
                    ? `inset 0 0 0 1.5px ${theme.semantic.primary.normal}`
                    : `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
                })}
              >
                <Box
                  as="span"
                  sx={(theme) => ({
                    width: "38px",
                    height: "38px",
                    borderRadius: "11px",
                    background: theme.semantic.fill.normal,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: theme.semantic.label.neutral,
                    flexShrink: 0,
                    overflow: "hidden",
                  })}
                >
                  <img
                    src={`/flags/flag-${l}.svg`}
                    alt={meta.code}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </Box>
                <Box as="span" sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    as="span"
                    sx={(theme) => ({
                      display: "block",
                      fontWeight: 600,
                      fontSize: "16px",
                      color: theme.semantic.label.normal,
                    })}
                  >
                    {meta.label}
                  </Box>
                  <Box
                    as="span"
                    sx={(theme) => ({
                      display: "block",
                      fontSize: "13px",
                      color: theme.semantic.label.alternative,
                    })}
                  >
                    {meta.sub}
                  </Box>
                </Box>
                {active && (
                  <Box
                    as="span"
                    sx={(theme) => ({
                      display: "inline-flex",
                      color: theme.semantic.primary.normal,
                    })}
                  >
                    <IconCircleCheckFill sx={{ fontSize: "22px" }} />
                  </Box>
                )}
              </Box>
            );
          })}
        </FlexBox>
      </FlexBox>

      <Box sx={{ marginTop: "18px" }}>
        <Button variant="solid" color="primary" size="large" fullWidth onClick={confirm}>
          {t("continue")}
        </Button>
      </Box>
    </FlexBox>
  );
}
