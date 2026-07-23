import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Box, FlexBox } from "@wanteddev/wds";
import { IconNavigationMypage } from "@wanteddev/wds-icon";
import type { ReactNode } from "react";

import { type StringKey, useI18n } from "@/shared/i18n";

// 디자인 :992/:995/:998 원본 SVG — WDS에 대응 아이콘이 없어 코드로 직접(D2). my만 WDS 아이콘.
function HomeGlyph() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
      <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
    </svg>
  );
}

function ShopGlyph() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.331 8h11.339a2 2 0 0 1 1.977 2.304l-1.255 8.152a3 3 0 0 1 -2.966 2.544h-6.852a3 3 0 0 1 -2.965 -2.544l-1.255 -8.152a2 2 0 0 1 1.977 -2.304" />
      <path d="M9 11v-5a3 3 0 0 1 6 0v5" />
    </svg>
  );
}

function MoveGlyph() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5" />
    </svg>
  );
}

const TABS = [
  { to: "/app", key: "nav_home", glyph: <HomeGlyph /> },
  { to: "/app/shop", key: "nav_shop", glyph: <ShopGlyph /> },
  { to: "/app/move", key: "nav_move", glyph: <MoveGlyph /> },
  { to: "/app/my", key: "nav_my", glyph: <IconNavigationMypage sx={{ fontSize: "24px" }} /> },
] satisfies ReadonlyArray<{ to: string; key: StringKey; glyph: ReactNode }>;

export function BottomTabBar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) =>
    to === "/app" ? pathname === "/app" || pathname === "/app/" : pathname.startsWith(to);

  return (
    <FlexBox
      as="nav"
      flexDirection="row"
      sx={(theme) => ({
        borderTop: `1px solid ${theme.semantic.line.normal.neutral}`,
        background: theme.semantic.background.normal.normal,
        padding: "8px 4px calc(22px + env(safe-area-inset-bottom, 0px))",
        flexShrink: 0,
      })}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.to);
        return (
          <Box
            as="button"
            key={tab.to}
            type="button"
            onClick={() => navigate({ to: tab.to })}
            sx={(theme) => ({
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 600,
              lineHeight: 1,
              color: active ? theme.semantic.primary.normal : theme.semantic.label.alternative,
            })}
          >
            <Box as="span" sx={{ display: "inline-flex" }}>
              {tab.glyph}
            </Box>
            {t(tab.key)}
          </Box>
        );
      })}
    </FlexBox>
  );
}
