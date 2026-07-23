import { api } from "@/shared/api";
import type { Locale } from "@/shared/i18n";

import type { Product } from "../model/types";

// GET /goods 응답 항목 (backend/docs/API-SPEC.md §7)
interface ApiGood {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  price: number;
  thumbnail: string;
  importStatus: string;
  importLabel: string;
  customsNote: string | null;
  cruiseLineNote: string | null;
  detailUrl: string;
}

const STATUSES = ["allowed", "conditional", "restricted", "prohibited"] as const;

const toProduct = (g: ApiGood): Product => ({
  id: g.id,
  category: g.category,
  categoryLabel: g.categoryLabel,
  name: g.name,
  description: g.description,
  price: g.price,
  thumbnail: g.thumbnail,
  importStatus: STATUSES.includes(g.importStatus as (typeof STATUSES)[number])
    ? (g.importStatus as Product["importStatus"])
    : "allowed",
  importLabel: g.importLabel,
  customsNote: g.customsNote ?? "",
  cruiseLineNote: g.cruiseLineNote ?? "",
  detailUrl: g.detailUrl,
});

export interface GoodsPage {
  items: Product[];
  page: number;
  totalCount: number;
}

export const listGoods = async (p: {
  lang: Locale;
  category?: string;
  q?: string;
  page?: number;
  size?: number;
}): Promise<GoodsPage> => {
  const qs = new URLSearchParams({ lang: p.lang });
  if (p.category && p.category !== "all") qs.set("category", p.category);
  if (p.q) qs.set("q", p.q);
  qs.set("page", String(p.page ?? 1));
  qs.set("size", String(p.size ?? 20));
  const res = await api<{ items: ApiGood[]; page: number; totalCount: number }>(`/goods?${qs}`);
  return { items: res.items.map(toProduct), page: res.page, totalCount: res.totalCount };
};

export const listGoodCategories = async (
  lang: Locale,
): Promise<{ key: string; label: string; count: number }[]> =>
  (
    await api<{ items: { key: string; label: string; count: number }[] }>(
      `/goods/categories?lang=${lang}`,
    )
  ).items;

export const getGood = async (id: string, lang: Locale): Promise<Product> =>
  toProduct(await api<ApiGood>(`/goods/${encodeURIComponent(id)}?lang=${lang}`));
