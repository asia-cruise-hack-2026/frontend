import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import { AppProviders } from "@/app/providers";

import "@wanteddev/wds/global.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
      },
      { title: "OMONG" },
    ],
    links: [
      { rel: "preconnect", href: "https://cdn.jsdelivr.net" },
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-jp-dynamic-subset.min.css",
      },
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="ko">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppProviders>
          {/* 앱처럼 — 모바일 폭으로 센터링(넓은 뷰포트에서 가로 스트레치 방지) */}
          <div style={{ maxWidth: 430, margin: "0 auto", width: "100%", minHeight: "100dvh" }}>
            <Outlet />
          </div>
        </AppProviders>
        <Scripts />
      </body>
    </html>
  );
}
