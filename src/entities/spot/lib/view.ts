// 디자인 renderVals(:1489, :1498) 이식 — 프레젠테이션 헬퍼(테마 색상, 아이콘 종류 판별).

export const THEME_TINT: Record<
  "attraction" | "food" | "cafe" | "package",
  { fg: string; bg: string }
> = {
  attraction: { fg: "#12A150", bg: "#EAF7EE" },
  food: { fg: "#E8820E", bg: "#FFF1E6" },
  cafe: { fg: "#8B3FF0", bg: "#F3ECFF" },
  package: { fg: "var(--primary-normal-4)", bg: "var(--primary-normal-8)" },
};

export type SpotIconKind = "food" | "attraction" | "other";

// 디자인 :1489 — food면 food, (attraction|package)이고 food아니면 attraction, 그 외 other
export function spotIconKind(themes: string[]): SpotIconKind {
  if (themes.includes("food")) return "food";
  if (themes.includes("attraction") || themes.includes("package")) return "attraction";
  return "other";
}
