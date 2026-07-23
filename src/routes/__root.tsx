import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useState } from "react";

import { AppProviders } from "@/app/providers";
import { Splash } from "@/widgets/splash";

import "@wanteddev/wds/global.css";
// Montage 기본 테마 뒤에 브랜드 오버라이드(#2563EB · Wanted Sans) 적용 — import 순서 유지
import "@/app/brand.css";

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
        // 브랜드 폰트 — Wanted Sans (디자인 최종: 타이틀 --font-brand)
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css",
      },
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

// 콜드 로드당 1회만 — 클라이언트 내비게이션에는 다시 띄우지 않는다.
let splashShown = false;

function RootComponent() {
  const [showSplash, setShowSplash] = useState(() => !splashShown);
  return (
    <html lang="ko">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppProviders>
          {/* 앱처럼 — 모바일 폭으로 센터링(넓은 뷰포트에서 가로 스트레치 방지) */}
          <div style={{ maxWidth: 620, margin: "0 auto", width: "100%", minHeight: "100dvh" }}>
            <Outlet />
          </div>
          {showSplash && (
            <Splash
              onDone={() => {
                splashShown = true;
                setShowSplash(false);
              }}
            />
          )}
        </AppProviders>
        <Scripts />
      </body>
    </html>
  );
}
