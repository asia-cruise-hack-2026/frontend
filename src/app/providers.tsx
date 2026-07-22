import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@wanteddev/wds";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

/** 앱 전역 프로바이더: TanStack Query · i18n · Montage(WDS) 테마 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
