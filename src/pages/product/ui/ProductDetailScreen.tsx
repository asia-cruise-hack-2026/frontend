import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, Button, ContentBadge, FlexBox, addOpacity, useToast } from "@wanteddev/wds";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconCircleCheckFill,
  IconCircleClose,
  IconCircleCloseFill,
  IconCircleInfoFill,
  IconCoffee,
  IconCoins,
  IconHeart,
  IconLocation,
  IconPassportFill,
  IconSparkleFill,
  IconSun,
  IconTag,
  IconTemplate,
  IconTriangleExclamationFill,
} from "@wanteddev/wds-icon";
import { type ReactNode, useState } from "react";

import { getGood, type Product, IMPORT_STATUS_META } from "@/entities/product";
import { type StringKey, useI18n } from "@/shared/i18n";
import { sessionActions } from "@/shared/store";

// product.icon(문자열) → WDS 아이콘. mock 데이터(entities/product/api/mock.ts)에 나오는 값 전부 커버,
// 타입이 plain string이라 신규 값 대비 fallback 유지.
const PRODUCT_ICONS: Record<string, ReactNode> = {
  heart: <IconHeart sx={{ fontSize: "60px" }} />,
  sun: <IconSun sx={{ fontSize: "60px" }} />,
  coffee: <IconCoffee sx={{ fontSize: "60px" }} />,
  sparkleFill: <IconSparkleFill sx={{ fontSize: "60px" }} />,
  coins: <IconCoins sx={{ fontSize: "60px" }} />,
  circleClose: <IconCircleClose sx={{ fontSize: "60px" }} />,
  template: <IconTemplate sx={{ fontSize: "60px" }} />,
};

function HeroIcon({ product }: { product: Product }) {
  return PRODUCT_ICONS[product.icon] ?? <IconTemplate sx={{ fontSize: "60px" }} />;
}

// IMPORT_STATUS_META.iconName(문자열) → WDS 아이콘. 4개 status 전부 커버(entities/product/lib/importStatus.ts).
const STATUS_ICONS: Record<string, ReactNode> = {
  circleCheckFill: <IconCircleCheckFill sx={{ fontSize: "20px" }} />,
  circleInfoFill: <IconCircleInfoFill sx={{ fontSize: "20px" }} />,
  triangleExclamationFill: <IconTriangleExclamationFill sx={{ fontSize: "20px" }} />,
  circleCloseFill: <IconCircleCloseFill sx={{ fontSize: "20px" }} />,
};

// 디자인 :700 원본 SVG(선사 규정=배) — WDS에 ship/boat/cruise/anchor 대응 아이콘 없어 코드로 직접(D2).
function LineNoteIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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

type DeliveryOption = "ship" | "pickup" | "stay";
// 디자인 최종: 배송 옵션 2개(현위치 배송 제거)
const DELIVERY_OPTIONS: { key: DeliveryOption; labelKey: StringKey }[] = [
  { key: "ship", labelKey: "d_ship" },
  { key: "pickup", labelKey: "d_pickup" },
];

/** 상품 상세 — 프로토타입 "PRODUCT DETAIL"(:678-722) 이식. */
export function ProductDetailScreen({ productId }: { productId: string }) {
  const { t, locale, money } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const [delivery, setDelivery] = useState<DeliveryOption>("ship");

  const { data: product } = useQuery({
    queryKey: ["good", productId],
    queryFn: () => getGood(productId),
  });

  if (!product) return null;

  // labelKey는 entities/product/lib/importStatus.ts 주석대로 "useI18n t()로 라벨 해석용"이나
  // 엔티티 쪽 타입은 plain string(화면 책임) — StringKey로 좁혀 t()에 연결.
  const statusMeta = IMPORT_STATUS_META[product.status];

  const handleAddCart = () => {
    sessionActions.addToCart(product.id);
    toast({ content: t("added_cart"), variant: "positive", duration: "short" });
  };

  return (
    <FlexBox flexDirection="column" sx={{ minHeight: "100dvh" }}>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <Box
          sx={{
            position: "relative",
            height: "190px",
            background: product.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: product.iconColor,
          }}
        >
          <HeroIcon product={product} />
          <Box
            as="button"
            type="button"
            onClick={() => navigate({ to: "/app/shop" })}
            sx={(theme) => ({
              position: "absolute",
              top: "14px",
              left: "16px",
              width: "36px",
              height: "36px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: addOpacity(theme.semantic.static.white, theme.opacity[88]),
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.semantic.label.normal,
            })}
          >
            <IconArrowLeft sx={{ fontSize: "22px" }} />
          </Box>
        </Box>

        <Box sx={{ padding: "18px 20px 4px" }}>
          <Box sx={{ display: "inline-flex" }}>
            <ContentBadge
              size="small"
              variant="solid"
              color="accent"
              accentColor="semantic.primary.normal"
            >
              {t(`cat_${product.cat}`)}
            </ContentBadge>
          </Box>
          <Box
            as="h1"
            sx={(theme) => ({
              margin: "10px 0 4px",
              fontWeight: 700,
              fontSize: "22px",
              letterSpacing: "-0.02em",
              color: theme.semantic.label.normal,
            })}
          >
            {product.name[locale]}
          </Box>
          <Box
            sx={(theme) => ({
              fontWeight: 700,
              fontSize: "20px",
              color: theme.semantic.label.normal,
              marginTop: "6px",
            })}
          >
            {money(product.price)}
          </Box>
        </Box>

        {/* 탐나오 상세 링크 — 디자인 최종 추가 */}
        <Box
          as="a"
          href="https://www.tamnao.com/web/goods/jeju.do"
          target="_blank"
          rel="noopener"
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "14px 20px 0",
            padding: "14px 16px",
            borderRadius: "14px",
            background: addOpacity(theme.semantic.primary.normal, theme.opacity[8]),
            boxShadow: `inset 0 0 0 1px ${theme.semantic.primary.normal}`,
            textDecoration: "none",
          })}
        >
          <Box
            as="span"
            sx={(theme) => ({
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: theme.semantic.primary.normal,
              color: theme.semantic.static.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            })}
          >
            <IconTag sx={{ fontSize: "20px" }} />
          </Box>
          <Box as="span" sx={{ flex: 1, minWidth: 0 }}>
            <Box
              as="span"
              sx={(theme) => ({
                display: "block",
                fontWeight: 700,
                fontSize: "14px",
                color: theme.semantic.primary.normal,
              })}
            >
              {t("tamnao_view")}
            </Box>
            <Box
              as="span"
              sx={(theme) => ({
                display: "block",
                fontSize: "12px",
                color: theme.semantic.label.alternative,
                marginTop: "2px",
              })}
            >
              {t("tamnao_sub")}
            </Box>
          </Box>
          <Box
            as="span"
            sx={(theme) => ({
              display: "inline-flex",
              color: theme.semantic.primary.normal,
              flexShrink: 0,
            })}
          >
            <IconArrowUpRight sx={{ fontSize: "20px" }} />
          </Box>
        </Box>

        <Box
          sx={{
            margin: "14px 20px 0",
            borderRadius: "14px",
            background: statusMeta.bg,
            padding: "14px 16px",
          }}
        >
          <FlexBox
            alignItems="center"
            gap="8px"
            sx={{ fontWeight: 700, fontSize: "15px", color: statusMeta.color }}
          >
            {STATUS_ICONS[statusMeta.iconName] ?? <IconCircleInfoFill sx={{ fontSize: "20px" }} />}
            {t(statusMeta.labelKey as StringKey)}
          </FlexBox>
        </Box>

        <Box
          sx={(theme) => ({
            padding: "18px 20px 4px",
            fontWeight: 700,
            fontSize: "16px",
            color: theme.semantic.label.normal,
          })}
        >
          {t("customs_line_info")}
        </Box>
        <FlexBox flexDirection="column" gap="10px" sx={{ padding: "6px 20px 0" }}>
          <FlexBox
            gap="12px"
            sx={(theme) => ({
              background: theme.semantic.background.normal.alternative,
              borderRadius: "12px",
              padding: "13px 14px",
            })}
          >
            <Box
              sx={(theme) => ({
                flexShrink: 0,
                color: theme.semantic.label.neutral,
                display: "inline-flex",
              })}
            >
              <IconPassportFill sx={{ fontSize: "20px" }} />
            </Box>
            <Box>
              <Box
                sx={(theme) => ({
                  fontWeight: 600,
                  fontSize: "13px",
                  color: theme.semantic.label.normal,
                })}
              >
                {t("customs_note")}
              </Box>
              <Box
                sx={(theme) => ({
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: theme.semantic.label.neutral,
                  marginTop: "2px",
                })}
              >
                {product.customs[locale]}
              </Box>
            </Box>
          </FlexBox>
          <FlexBox
            gap="12px"
            sx={(theme) => ({
              background: theme.semantic.background.normal.alternative,
              borderRadius: "12px",
              padding: "13px 14px",
            })}
          >
            <Box
              sx={(theme) => ({
                flexShrink: 0,
                color: theme.semantic.label.neutral,
                display: "inline-flex",
              })}
            >
              <LineNoteIcon />
            </Box>
            <Box>
              <Box
                sx={(theme) => ({
                  fontWeight: 600,
                  fontSize: "13px",
                  color: theme.semantic.label.normal,
                })}
              >
                {t("line_note")}
              </Box>
              <Box
                sx={(theme) => ({
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: theme.semantic.label.neutral,
                  marginTop: "2px",
                })}
              >
                {product.line[locale]}
              </Box>
            </Box>
          </FlexBox>
        </FlexBox>

        <Box
          sx={(theme) => ({
            padding: "18px 20px 4px",
            fontWeight: 700,
            fontSize: "16px",
            color: theme.semantic.label.normal,
          })}
        >
          {t("receive_how")}
        </Box>
        <FlexBox flexDirection="column" gap="8px" sx={{ padding: "6px 20px 0" }}>
          {DELIVERY_OPTIONS.map((opt) => {
            const active = delivery === opt.key;
            return (
              <Box
                key={opt.key}
                as="button"
                type="button"
                onClick={() => setDelivery(opt.key)}
                sx={(theme) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  borderRadius: "12px",
                  padding: "13px 14px",
                  background: active
                    ? addOpacity(theme.semantic.primary.normal, theme.opacity[8])
                    : theme.semantic.background.normal.alternative,
                  boxShadow: active ? `inset 0 0 0 2px ${theme.semantic.primary.normal}` : "none",
                })}
              >
                <Box
                  sx={(theme) => ({
                    width: "20px",
                    height: "20px",
                    borderRadius: "999px",
                    flexShrink: 0,
                    boxShadow: `inset 0 0 0 2px ${
                      active ? theme.semantic.primary.normal : theme.semantic.line.normal.neutral
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  {active && (
                    <Box
                      sx={(theme) => ({
                        width: "10px",
                        height: "10px",
                        borderRadius: "999px",
                        background: theme.semantic.primary.normal,
                      })}
                    />
                  )}
                </Box>
                <Box
                  as="span"
                  sx={(theme) => ({
                    fontSize: "14px",
                    fontWeight: active ? 600 : 500,
                    color: theme.semantic.label.normal,
                  })}
                >
                  {t(opt.labelKey)}
                </Box>
              </Box>
            );
          })}
        </FlexBox>

        {/* 픽업 지점 안내 — 디자인 최종: 픽업 선택 시 노출 */}
        {delivery === "pickup" && (
          <Box
            sx={(theme) => ({
              margin: "12px 20px 0",
              borderRadius: "14px",
              background: addOpacity(theme.semantic.primary.normal, theme.opacity[8]),
              boxShadow: `inset 0 0 0 1px ${theme.semantic.primary.normal}`,
              padding: "16px",
            })}
          >
            <FlexBox
              alignItems="center"
              gap="8px"
              sx={(theme) => ({
                fontWeight: 700,
                fontSize: "14px",
                color: theme.semantic.primary.normal,
                marginBottom: "12px",
              })}
            >
              <Box as="span" sx={{ display: "inline-flex" }}>
                <IconLocation sx={{ fontSize: "18px" }} />
              </Box>
              {t("pickup_info_t")}
            </FlexBox>
            <FlexBox flexDirection="column" gap="11px">
              {(
                [
                  ["pickup_where", "pickup_desk", true],
                  ["pickup_hours", "pickup_hours_v", true],
                  ["pickup_how", "pickup_how_v", false],
                ] as const
              ).map(([labelKey, valueKey, bold]) => (
                <FlexBox key={labelKey} gap="12px">
                  <Box
                    as="span"
                    sx={(theme) => ({
                      flex: "0 0 74px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: theme.semantic.label.alternative,
                    })}
                  >
                    {t(labelKey)}
                  </Box>
                  <Box
                    as="span"
                    sx={(theme) => ({
                      flex: 1,
                      fontSize: "13px",
                      fontWeight: bold ? 600 : 400,
                      lineHeight: 1.5,
                      color: theme.semantic.label.normal,
                    })}
                  >
                    {t(valueKey)}
                  </Box>
                </FlexBox>
              ))}
            </FlexBox>
            <FlexBox
              alignItems="flex-start"
              gap="8px"
              sx={(theme) => ({
                marginTop: "13px",
                paddingTop: "13px",
                borderTop: `1px solid ${theme.semantic.primary.normal}`,
              })}
            >
              <Box
                as="span"
                sx={(theme) => ({
                  display: "inline-flex",
                  color: theme.semantic.primary.normal,
                  flexShrink: 0,
                  marginTop: "1px",
                })}
              >
                <IconPassportFill sx={{ fontSize: "16px" }} />
              </Box>
              <Box
                as="span"
                sx={(theme) => ({
                  fontSize: "12.5px",
                  lineHeight: 1.5,
                  fontWeight: 600,
                  color: theme.semantic.label.neutral,
                })}
              >
                {t("pickup_note")}
              </Box>
            </FlexBox>
          </Box>
        )}

        <Box sx={{ height: "120px" }} />
      </Box>

      <FlexBox
        gap="10px"
        sx={(theme) => ({
          padding: "12px 20px 18px",
          borderTop: `1px solid ${theme.semantic.line.normal.neutral}`,
          flexShrink: 0,
        })}
      >
        <Box
          as="button"
          type="button"
          onClick={handleAddCart}
          sx={(theme) => ({
            height: "48px",
            padding: "0 18px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "15px",
            background: theme.semantic.fill.normal,
            color: theme.semantic.label.neutral,
            whiteSpace: "nowrap",
          })}
        >
          {t("add_cart")}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Button
            variant="solid"
            color="primary"
            size="large"
            fullWidth
            onClick={() => {
              sessionActions.addToCart(product.id);
              navigate({ to: "/checkout" });
            }}
          >
            {t("buy_now")}
          </Button>
        </Box>
      </FlexBox>
    </FlexBox>
  );
}
