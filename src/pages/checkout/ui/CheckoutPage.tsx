import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, Button, FlexBox } from "@wanteddev/wds";
import { useState } from "react";

import { getGood } from "@/entities/product";
import { useI18n } from "@/shared/i18n";
import { useCart } from "@/shared/store";

import { type CartItem, cartTotal, hasRestricted, productToCartItem } from "../model/cart";
import { ct } from "../model/strings";
import { OrderSuccess } from "./OrderSuccess";
import { PaymentSheet } from "./PaymentSheet";

export function CheckoutPage() {
  const { locale, t, money } = useI18n();
  const navigate = useNavigate();
  const cartIds = useCart();

  const { data: items = [] } = useQuery({
    queryKey: ["cart-goods", cartIds, locale],
    queryFn: async () => {
      // 삭제/유실된 상품은 조용히 제외 (allSettled)
      const results = await Promise.allSettled(cartIds.map((id) => getGood(id, locale)));
      return results
        .filter(
          (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof getGood>>> =>
            r.status === "fulfilled",
        )
        .map((r) => productToCartItem(r.value));
    },
  });
  const isEmpty = items.length === 0;

  const total = cartTotal(items);
  const needAgree = hasRestricted(items);

  const [agreed, setAgreed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paid, setPaid] = useState(false);

  if (paid) {
    return <OrderSuccess total={total} onDone={() => navigate({ to: "/pay-demo" })} />;
  }

  const payDisabled = isEmpty || (needAgree && !agreed);

  return (
    <FlexBox flexDirection="column" sx={{ minHeight: "100dvh" }}>
      {/* 헤더 */}
      <FlexBox
        alignItems="center"
        gap="6px"
        sx={(theme) => ({
          padding: "12px 12px 12px 8px",
          borderBottom: `1px solid ${theme.semantic.line.normal.neutral}`,
        })}
      >
        <Box
          as="button"
          type="button"
          onClick={() => navigate({ to: "/pay-demo" })}
          aria-label="back"
          sx={(theme) => ({
            width: "38px",
            height: "38px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: theme.semantic.label.normal,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Box>
        <Box
          as="h1"
          sx={(theme) => ({
            margin: 0,
            fontSize: "18px",
            fontWeight: 700,
            color: theme.semantic.label.normal,
          })}
        >
          {ct("checkout_title", locale)}
        </Box>
      </FlexBox>

      {/* 본문 */}
      <FlexBox
        flexDirection="column"
        gap="16px"
        sx={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}
      >
        {/* 주문 요약 */}
        <Box>
          <SectionLabel>{ct("order_summary", locale)}</SectionLabel>
          <FlexBox
            flexDirection="column"
            sx={(theme) => ({
              borderRadius: "16px",
              padding: isEmpty ? "28px 16px" : "4px 16px",
              background: theme.semantic.background.normal.normal,
              boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
            })}
          >
            {isEmpty ? (
              <Box
                as="span"
                sx={(theme) => ({
                  textAlign: "center",
                  fontSize: "14px",
                  color: theme.semantic.label.alternative,
                })}
              >
                {t("cart_empty")}
              </Box>
            ) : (
              items.map((item, idx) => (
                <CartRow key={item.id} item={item} last={idx === items.length - 1} />
              ))
            )}
          </FlexBox>
        </Box>

        {/* 반입규정 게이트 */}
        {needAgree && (
          <Box
            as="button"
            type="button"
            role="checkbox"
            aria-checked={agreed}
            onClick={() => setAgreed((v) => !v)}
            sx={(theme) => ({
              display: "flex",
              gap: "11px",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              border: "none",
              borderRadius: "14px",
              padding: "15px 16px",
              background: agreed
                ? theme.semantic.background.normal.normal
                : "rgba(180, 121, 30, 0.08)",
              boxShadow: agreed
                ? `inset 0 0 0 1.5px ${theme.semantic.status.positive}`
                : "inset 0 0 0 1px rgba(180, 121, 30, 0.35)",
            })}
          >
            <Box
              as="span"
              sx={(theme) => ({
                width: "22px",
                height: "22px",
                flexShrink: 0,
                marginTop: "1px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.semantic.static.white,
                background: agreed ? theme.semantic.status.positive : "transparent",
                boxShadow: agreed ? "none" : "inset 0 0 0 2px #B4791E",
              })}
            >
              {agreed && (
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l5 5L19 7" />
                </svg>
              )}
            </Box>
            <Box>
              <Box
                as="span"
                sx={(theme) => ({
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: theme.semantic.label.normal,
                  marginBottom: "3px",
                })}
              >
                {ct("import_gate_title", locale)}
              </Box>
              <Box
                as="span"
                sx={(theme) => ({
                  display: "block",
                  fontSize: "12.5px",
                  lineHeight: 1.5,
                  color: theme.semantic.label.neutral,
                })}
              >
                {ct("import_gate_desc", locale)}
              </Box>
            </Box>
          </Box>
        )}
      </FlexBox>

      {/* 하단 결제 바 */}
      <Box
        sx={(theme) => ({
          padding: "14px 20px calc(16px + env(safe-area-inset-bottom))",
          borderTop: `1px solid ${theme.semantic.line.normal.neutral}`,
          background: theme.semantic.background.normal.normal,
        })}
      >
        <FlexBox alignItems="center" justifyContent="space-between" sx={{ marginBottom: "12px" }}>
          <Box
            as="span"
            sx={(theme) => ({
              fontSize: "14px",
              fontWeight: 600,
              color: theme.semantic.label.alternative,
            })}
          >
            {ct("total_label", locale)}
          </Box>
          <Box
            as="span"
            sx={(theme) => ({
              fontSize: "22px",
              fontWeight: 800,
              color: theme.semantic.label.normal,
            })}
          >
            {money(total)}
          </Box>
        </FlexBox>
        <Button
          variant="solid"
          color="primary"
          size="large"
          fullWidth
          disabled={payDisabled}
          onClick={() => setSheetOpen(true)}
        >
          {ct("pay_cta", locale)}
        </Button>
      </Box>

      {sheetOpen && (
        <PaymentSheet
          total={total}
          onClose={() => setSheetOpen(false)}
          onPaid={() => {
            setSheetOpen(false);
            setPaid(true);
          }}
        />
      )}
    </FlexBox>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Box
      as="h2"
      sx={(theme) => ({
        margin: "0 0 10px 2px",
        fontSize: "13px",
        fontWeight: 700,
        color: theme.semantic.label.alternative,
      })}
    >
      {children}
    </Box>
  );
}

function CartRow({ item, last }: { item: CartItem; last: boolean }) {
  const { locale, money } = useI18n();
  const allowed = item.importStatus === "allowed";
  return (
    <FlexBox
      alignItems="center"
      gap="12px"
      sx={(theme) => ({
        padding: "13px 0",
        borderBottom: last ? "none" : `1px solid ${theme.semantic.line.normal.neutral}`,
      })}
    >
      <Box
        as="span"
        sx={(theme) => ({
          width: "44px",
          height: "44px",
          flexShrink: 0,
          borderRadius: "11px",
          background: theme.semantic.fill.normal,
          overflow: "hidden",
        })}
      >
        <img
          src={item.thumbnail}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          as="span"
          sx={(theme) => ({
            display: "block",
            fontSize: "15px",
            fontWeight: 600,
            color: theme.semantic.label.normal,
          })}
        >
          {item.name}
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
          {item.meta}
        </Box>
        <Box
          as="span"
          sx={(theme) => ({
            display: "inline-block",
            marginTop: "5px",
            fontSize: "11px",
            fontWeight: 700,
            borderRadius: "5px",
            padding: "2px 7px",
            color: allowed ? theme.semantic.status.positive : "#B4791E",
            background: allowed ? "rgba(44, 122, 86, 0.12)" : "rgba(180, 121, 30, 0.14)",
          })}
        >
          {allowed ? ct("allowed_badge", locale) : ct("restricted_badge", locale)}
        </Box>
      </Box>
      <Box
        as="span"
        sx={(theme) => ({
          fontSize: "14px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          color: theme.semantic.label.normal,
        })}
      >
        {money(item.price * item.qty)}
      </Box>
    </FlexBox>
  );
}
