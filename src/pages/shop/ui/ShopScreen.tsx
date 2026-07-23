import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, FlexBox } from "@wanteddev/wds";
import {
  IconCircle,
  IconCircleCheckFill,
  IconCircleClose,
  IconCircleCloseFill,
  IconCircleInfoFill,
  IconCoffee,
  IconCoins,
  IconHeart,
  IconSparkleFill,
  IconSun,
  IconTemplate,
  IconTriangleExclamationFill,
  IconVerifiedCheckFill,
} from "@wanteddev/wds-icon";
import { type ReactNode, useState } from "react";

import { IMPORT_STATUS_META, listGoods, type Product } from "@/entities/product";
import { useI18n } from "@/shared/i18n";

// 디자인 :664 상품 아이콘(mock 데이터 icon 필드) — wds-icon 이름 매핑. 없으면 IconCircle 코드 fallback.
const PRODUCT_ICONS: Record<string, ReactNode> = {
  heart: <IconHeart sx={{ fontSize: "30px" }} />,
  sun: <IconSun sx={{ fontSize: "30px" }} />,
  coffee: <IconCoffee sx={{ fontSize: "30px" }} />,
  sparkleFill: <IconSparkleFill sx={{ fontSize: "30px" }} />,
  coins: <IconCoins sx={{ fontSize: "30px" }} />,
  circleClose: <IconCircleClose sx={{ fontSize: "30px" }} />,
  template: <IconTemplate sx={{ fontSize: "30px" }} />,
};
const FALLBACK_PRODUCT_ICON = <IconCircle sx={{ fontSize: "30px" }} />;

// 디자인 :665 반입상태 뱃지 아이콘(IMPORT_STATUS_META.iconName) — wds-icon 이름 매핑. 없으면 IconCircle 코드 fallback.
const STATUS_ICONS: Record<string, ReactNode> = {
  circleCheckFill: <IconCircleCheckFill sx={{ fontSize: "12px" }} />,
  circleInfoFill: <IconCircleInfoFill sx={{ fontSize: "12px" }} />,
  triangleExclamationFill: <IconTriangleExclamationFill sx={{ fontSize: "12px" }} />,
  circleCloseFill: <IconCircleCloseFill sx={{ fontSize: "12px" }} />,
};
const FALLBACK_STATUS_ICON = <IconCircle sx={{ fontSize: "12px" }} />;

type CatKey = "all" | Product["cat"];

/** 쇼핑 — 프로토타입 "Shop"(:639-677) 이식. */
export function ShopScreen() {
  const { t, locale, money } = useI18n();
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState<CatKey>("all");

  const { data: products = [] } = useQuery({
    queryKey: ["products", activeCat],
    queryFn: () => listGoods({ category: activeCat }),
  });

  const catTabs: { key: CatKey; label: string }[] = [
    { key: "all", label: t("cat_all") },
    { key: "food", label: t("cat_food") },
    { key: "cosmetics", label: t("cat_cosmetics") },
    { key: "alcohol", label: t("cat_alcohol") },
    { key: "souvenir", label: t("cat_souvenir") },
  ];

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100%",
        background: theme.semantic.background.normal.alternative,
      })}
    >
      {/* 헤더(타이틀+카테고리 필터) — 디자인 :642-654, 스티키 */}
      <Box
        sx={(theme) => ({
          padding: "14px 20px 10px",
          background: theme.semantic.background.normal.normal,
          position: "sticky",
          top: 0,
          zIndex: 3,
        })}
      >
        <Box
          sx={(theme) => ({
            fontWeight: 700,
            fontSize: "20px",
            color: theme.semantic.label.normal,
          })}
        >
          {t("shop_title")}
        </Box>
        <FlexBox gap="8px" sx={{ overflowX: "auto", marginTop: "12px" }}>
          {catTabs.map((tab) => {
            const active = activeCat === tab.key;
            return (
              <Box
                key={tab.key}
                as="button"
                type="button"
                onClick={() => setActiveCat(tab.key)}
                sx={(theme) => ({
                  flex: "0 0 auto",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "999px",
                  padding: "7px 14px",
                  fontWeight: 600,
                  fontSize: "13px",
                  background: active ? theme.semantic.primary.normal : theme.semantic.fill.normal,
                  color: active ? theme.semantic.static.white : theme.semantic.label.neutral,
                })}
              >
                {tab.label}
              </Box>
            );
          })}
        </FlexBox>
      </Box>

      {/* 신뢰 배너 — 디자인 :656-659 */}
      <FlexBox
        alignItems="center"
        gap="8px"
        sx={{
          margin: "14px 20px 6px",
          background: "#EAF7EE",
          borderRadius: "12px",
          padding: "10px 12px",
        }}
      >
        <Box
          as="span"
          sx={(theme) => ({ display: "inline-flex", color: theme.semantic.status.positive })}
        >
          <IconVerifiedCheckFill sx={{ fontSize: "16px" }} />
        </Box>
        <Box
          as="span"
          sx={(theme) => ({
            fontSize: "12px",
            color: theme.semantic.label.neutral,
            lineHeight: 1.4,
            fontWeight: 500,
          })}
        >
          {t("shop_trust")}
        </Box>
      </FlexBox>

      {/* 상품 그리드 — 디자인 :660-674 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          padding: "8px 20px 20px",
        }}
      >
        {products.map((p) => {
          const meta = IMPORT_STATUS_META[p.status];
          return (
            <Box
              key={p.id}
              as="button"
              type="button"
              onClick={() =>
                navigate({ to: "/app/product/$productId", params: { productId: p.id } })
              }
              sx={(theme) => ({
                cursor: "pointer",
                textAlign: "left",
                border: "none",
                padding: 0,
                background: theme.semantic.background.normal.normal,
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
                display: "flex",
                flexDirection: "column",
              })}
            >
              <Box
                sx={{
                  position: "relative",
                  height: "96px",
                  background: p.color,
                  color: p.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {PRODUCT_ICONS[p.icon] ?? FALLBACK_PRODUCT_ICON}
                <FlexBox
                  as="span"
                  alignItems="center"
                  gap="3px"
                  sx={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    background: meta.bg,
                    color: meta.color,
                    borderRadius: "999px",
                    padding: "3px 8px",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {STATUS_ICONS[meta.iconName] ?? FALLBACK_STATUS_ICON}
                  {t(meta.labelKey)}
                </FlexBox>
              </Box>
              <Box
                sx={{
                  padding: "11px 12px 13px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={(theme) => ({
                    fontWeight: 600,
                    fontSize: "14px",
                    lineHeight: 1.35,
                    color: theme.semantic.label.normal,
                  })}
                >
                  {p.name[locale]}
                </Box>
                <Box
                  sx={(theme) => ({
                    fontSize: "12px",
                    lineHeight: 1.4,
                    color: theme.semantic.label.alternative,
                    marginTop: "4px",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  })}
                >
                  {p.desc[locale]}
                </Box>
                <Box
                  sx={(theme) => ({
                    fontWeight: 700,
                    fontSize: "15px",
                    color: theme.semantic.label.normal,
                    marginTop: "8px",
                  })}
                >
                  {money(p.price)}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
