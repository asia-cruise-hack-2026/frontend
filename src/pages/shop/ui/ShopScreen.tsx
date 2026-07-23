import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Box, FlexBox, SearchField } from "@wanteddev/wds";
import {
  IconBusinessBag,
  IconCircle,
  IconCircleCheckFill,
  IconCircleCloseFill,
  IconCircleInfoFill,
  IconTriangleExclamationFill,
  IconVerifiedCheckFill,
} from "@wanteddev/wds-icon";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { IMPORT_STATUS_META, listGoodCategories, listGoods } from "@/entities/product";
import { useI18n } from "@/shared/i18n";
import { useCart } from "@/shared/store";

// 디자인 :665 반입상태 뱃지 아이콘(IMPORT_STATUS_META.iconName) — wds-icon 이름 매핑. 없으면 IconCircle 코드 fallback.
const STATUS_ICONS: Record<string, ReactNode> = {
  circleCheckFill: <IconCircleCheckFill sx={{ fontSize: "12px" }} />,
  circleInfoFill: <IconCircleInfoFill sx={{ fontSize: "12px" }} />,
  triangleExclamationFill: <IconTriangleExclamationFill sx={{ fontSize: "12px" }} />,
  circleCloseFill: <IconCircleCloseFill sx={{ fontSize: "12px" }} />,
};
const FALLBACK_STATUS_ICON = <IconCircle sx={{ fontSize: "12px" }} />;

const PAGE_SIZE = 20;

/** 쇼핑 — 프로토타입 "Shop"(:639-677) 이식 + 실데이터(/goods): 카테고리·검색·무한스크롤. */
export function ShopScreen() {
  const { t, locale, money } = useI18n();
  const navigate = useNavigate();
  const cart = useCart();
  const [activeCat, setActiveCat] = useState("all");

  // 검색 — 300ms 디바운스
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const { data: categories = [] } = useQuery({
    queryKey: ["good-categories", locale],
    queryFn: () => listGoodCategories(locale),
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["goods", activeCat, debouncedQ, locale],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listGoods({
        lang: locale,
        category: activeCat === "all" ? undefined : activeCat,
        q: debouncedQ || undefined,
        page: pageParam,
        size: PAGE_SIZE,
      }),
    getNextPageParam: (last) =>
      last.page * PAGE_SIZE < last.totalCount ? last.page + 1 : undefined,
  });
  const products = data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // 무한스크롤 센티널
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) void fetchNextPage();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100%",
        background: theme.semantic.background.normal.alternative,
      })}
    >
      {/* 헤더(타이틀+검색+카테고리 필터) — 디자인 :642-654, 스티키 */}
      <Box
        sx={(theme) => ({
          padding: "14px 20px 10px",
          background: theme.semantic.background.normal.normal,
          position: "sticky",
          top: 0,
          zIndex: 3,
        })}
      >
        <FlexBox alignItems="center" justifyContent="space-between" gap="10px">
          <Box
            sx={(theme) => ({
              fontWeight: 700,
              fontSize: "20px",
              color: theme.semantic.label.normal,
            })}
          >
            {t("shop_title")}
          </Box>
          <Box
            as="button"
            type="button"
            onClick={() => navigate({ to: "/checkout" })}
            aria-label={t("go_cart")}
            sx={(theme) => ({
              position: "relative",
              width: "40px",
              height: "40px",
              border: "none",
              background: "none",
              cursor: "pointer",
              color: theme.semantic.label.normal,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <IconBusinessBag sx={{ fontSize: "24px" }} />
            {cart.length > 0 && (
              <Box
                as="span"
                sx={(theme) => ({
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  minWidth: "16px",
                  height: "16px",
                  padding: "0 4px",
                  boxSizing: "border-box",
                  background: theme.semantic.status.negative,
                  color: theme.semantic.static.white,
                  borderRadius: "999px",
                  fontSize: "10px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                {cart.length}
              </Box>
            )}
          </Box>
        </FlexBox>
        <Box sx={{ marginTop: "10px" }}>
          <SearchField
            width="100%"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("shop_search_ph")}
          />
        </Box>
        <FlexBox gap="8px" sx={{ overflowX: "auto", marginTop: "12px" }}>
          {(categories.length ? categories : [{ key: "all", label: t("cat_all"), count: 0 }]).map(
            (tab) => {
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
                    fontWeight: active ? 700 : 500,
                    fontSize: "13px",
                    background: active ? "transparent" : theme.semantic.fill.normal,
                    color: active ? theme.semantic.primary.normal : theme.semantic.label.neutral,
                    boxShadow: active
                      ? `inset 0 0 0 1.5px ${theme.semantic.primary.normal}`
                      : "none",
                  })}
                >
                  {tab.label}
                </Box>
              );
            },
          )}
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
          const meta = IMPORT_STATUS_META[p.importStatus];
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
                sx={(theme) => ({
                  position: "relative",
                  height: "96px",
                  background: theme.semantic.fill.normal,
                })}
              >
                <img
                  src={p.thumbnail}
                  alt=""
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
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
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  })}
                >
                  {p.name}
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
                  {p.description}
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

      {/* 빈 결과 */}
      {products.length === 0 && totalCount === 0 && data && (
        <Box
          sx={(theme) => ({
            padding: "36px 0 48px",
            textAlign: "center",
            fontSize: "14px",
            color: theme.semantic.label.alternative,
          })}
        >
          {t("no_results")}
        </Box>
      )}

      {/* 무한스크롤 센티널 */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {isFetchingNextPage && (
        <Box
          sx={(theme) => ({
            padding: "0 0 24px",
            textAlign: "center",
            fontSize: "12px",
            color: theme.semantic.label.assistive,
          })}
        >
          …
        </Box>
      )}
    </Box>
  );
}
