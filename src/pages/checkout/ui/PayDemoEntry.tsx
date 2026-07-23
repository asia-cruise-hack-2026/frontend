import { useNavigate } from "@tanstack/react-router";
import { Box, Button, FlexBox } from "@wanteddev/wds";

import { LOCALE_META, LOCALES, useI18n } from "@/shared/i18n";

import { methodsForSegment, segmentForLocale } from "../model/payment";

/**
 * 결제 플로우 mock 데모 진입 화면.
 * 실제 결제 연동 없이 "결제되는 것처럼" 보이는 UX를 체험하기 위한 테스트 버튼 겸,
 * 언어(=세그먼트)에 따라 결제수단이 어떻게 달라지는지 확인하는 하네스.
 */
export function PayDemoEntry() {
  const { locale, setLocale } = useI18n();
  const navigate = useNavigate();

  const methods = methodsForSegment(segmentForLocale(locale));

  return (
    <FlexBox flexDirection="column" sx={{ minHeight: "100dvh", padding: "24px 24px 28px" }}>
      <FlexBox flexDirection="column" sx={{ flex: 1, justifyContent: "center" }}>
        <Box
          as="span"
          sx={(theme) => ({
            alignSelf: "flex-start",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: theme.semantic.primary.normal,
            background: theme.semantic.fill.normal,
            borderRadius: "999px",
            padding: "4px 10px",
            marginBottom: "16px",
          })}
        >
          MOCK · 결제 데모
        </Box>
        <Box
          as="h1"
          sx={(theme) => ({
            margin: "0 0 8px",
            fontSize: "24px",
            fontWeight: 800,
            lineHeight: 1.3,
            color: theme.semantic.label.normal,
          })}
        >
          결제 플로우 체험
        </Box>
        <Box
          as="p"
          sx={(theme) => ({
            margin: "0 0 22px",
            fontSize: "14px",
            lineHeight: 1.55,
            color: theme.semantic.label.alternative,
          })}
        >
          실제 결제는 이뤄지지 않아요. 언어를 고르면 그 세그먼트에 맞는 결제수단으로 결제창이
          열립니다.
        </Box>

        {/* 언어(세그먼트) 선택 */}
        <FlexBox flexDirection="column" gap="10px">
          {LOCALES.map((l) => {
            const meta = LOCALE_META[l];
            const active = l === locale;
            const marks = methodsForSegment(segmentForLocale(l))
              .map((m) => m.wordmark)
              .join(" · ");
            return (
              <Box
                as="button"
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                sx={(theme) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  background: theme.semantic.background.normal.normal,
                  boxShadow: active
                    ? `inset 0 0 0 1.5px ${theme.semantic.primary.normal}`
                    : `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
                })}
              >
                <Box
                  as="span"
                  sx={(theme) => ({
                    width: "40px",
                    height: "40px",
                    flexShrink: 0,
                    borderRadius: "11px",
                    background: theme.semantic.fill.normal,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: theme.semantic.label.neutral,
                  })}
                >
                  {meta.code}
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
                    {meta.label}
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
                    {marks}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </FlexBox>
      </FlexBox>

      <Box sx={{ marginTop: "20px" }}>
        <Button
          variant="solid"
          color="primary"
          size="large"
          fullWidth
          onClick={() => navigate({ to: "/checkout" })}
        >
          결제 화면 열기 · {methods.map((m) => m.wordmark).join(" / ")}
        </Button>
      </Box>
    </FlexBox>
  );
}
