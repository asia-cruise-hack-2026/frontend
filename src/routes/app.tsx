import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Box, FlexBox } from "@wanteddev/wds";

import { BottomTabBar } from "@/widgets/bottom-tab-bar";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <FlexBox flexDirection="column" sx={{ minHeight: "100dvh" }}>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <Outlet />
      </Box>
      <BottomTabBar />
    </FlexBox>
  );
}
