import { Box, Button, FlexBox } from "@wanteddev/wds";
import { IconCircleCheckFill } from "@wanteddev/wds-icon";

import { useI18n } from "@/shared/i18n";

import { ct } from "../model/strings";

/** 고정 주문번호 — SSR/CSR 하이드레이션 불일치를 피하려 랜덤 대신 상수. */
const ORDER_NO = "OMONG-260723-4827";

interface OrderSuccessProps {
  total: number;
  onDone: () => void;
}

export function OrderSuccess({ total, onDone }: OrderSuccessProps) {
  const { locale, money } = useI18n();

  return (
    <FlexBox
      flexDirection="column"
      sx={{ minHeight: "100dvh", padding: "16px 24px calc(24px + env(safe-area-inset-bottom))" }}
    >
      <FlexBox
        flexDirection="column"
        alignItems="center"
        sx={{ flex: 1, justifyContent: "center" }}
      >
        <Box
          sx={(theme) => ({
            display: "inline-flex",
            color: theme.semantic.status.positive,
            marginBottom: "18px",
          })}
        >
          <IconCircleCheckFill sx={{ fontSize: "72px" }} />
        </Box>
        <Box
          as="h1"
          sx={(theme) => ({
            margin: "0 0 6px",
            fontSize: "24px",
            fontWeight: 800,
            color: theme.semantic.label.normal,
          })}
        >
          {ct("paid_title", locale)}
        </Box>
        <Box
          as="p"
          sx={(theme) => ({
            margin: "0 0 24px",
            fontSize: "15px",
            color: theme.semantic.label.alternative,
          })}
        >
          {ct("paid_desc", locale)}
        </Box>

        <FlexBox
          flexDirection="column"
          gap="12px"
          sx={(theme) => ({
            width: "100%",
            borderRadius: "16px",
            padding: "18px",
            background: theme.semantic.background.normal.alternative,
            boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
          })}
        >
          <Row label={ct("order_no", locale)} value={ORDER_NO} />
          <Row label={ct("paid_amount_label", locale)} value={money(total)} strong />
        </FlexBox>

        <FlexBox
          alignItems="flex-start"
          gap="9px"
          sx={(theme) => ({
            width: "100%",
            marginTop: "12px",
            borderRadius: "12px",
            padding: "13px 15px",
            background: theme.semantic.fill.normal,
          })}
        >
          <Box as="span" sx={{ fontSize: "17px", lineHeight: 1.3 }}>
            🚢
          </Box>
          <Box
            as="p"
            sx={(theme) => ({
              margin: 0,
              fontSize: "13px",
              lineHeight: 1.55,
              color: theme.semantic.label.neutral,
            })}
          >
            {ct("delivery_note", locale)}
          </Box>
        </FlexBox>
      </FlexBox>

      <Box sx={{ marginTop: "18px" }}>
        <Button variant="solid" color="primary" size="large" fullWidth onClick={onDone}>
          {ct("done", locale)}
        </Button>
      </Box>
    </FlexBox>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <FlexBox alignItems="center" justifyContent="space-between">
      <Box
        as="span"
        sx={(theme) => ({ fontSize: "13px", color: theme.semantic.label.alternative })}
      >
        {label}
      </Box>
      <Box
        as="span"
        sx={(theme) => ({
          fontSize: strong ? "16px" : "14px",
          fontWeight: strong ? 800 : 600,
          color: theme.semantic.label.normal,
        })}
      >
        {value}
      </Box>
    </FlexBox>
  );
}
