import { createFileRoute } from "@tanstack/react-router";
import { Box, Button } from "@wanteddev/wds";

import { useI18n } from "@/shared/i18n";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t, locale } = useI18n();
  return (
    <Box sx={{ padding: "24px" }}>
      <Box sx={{ marginBottom: "12px", fontSize: "20px", fontWeight: 700 }}>
        TAMRA PASS — Montage OK ({locale})
      </Box>
      <Button>{t("continue")}</Button>
    </Box>
  );
}
