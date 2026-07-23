import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Box, FlexBox } from "@wanteddev/wds";

import { BottomTabBar } from "@/widgets/bottom-tab-bar";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

// 하단 탭바는 탭 루트에서만 — 그 외(explore·spot 등 pushed 화면)는 풀스크린
const TAB_ROOTS = ["/app", "/app/", "/app/shop", "/app/move", "/app/my"];

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showTabs = TAB_ROOTS.includes(pathname);
  return (
    <FlexBox flexDirection="column" sx={{ height: "100dvh" }}>
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <Outlet />
      </Box>
      {showTabs && <BottomTabBar />}
    </FlexBox>
  );
}
