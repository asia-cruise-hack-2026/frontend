import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 8787,
    strictPort: true, // 맵 리퍼러 등록(localhost:8787)과 어긋나지 않게 포트 드리프트 차단
    // dev에서만: /api → Cloud Run 라이브(배포에선 같은 오리진 nginx가 /api/ 프록시)
    proxy: {
      "/api": {
        target: "https://tamrapass-34273089941.asia-northeast3.run.app",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      "#": new URL("./src", import.meta.url).pathname,
    },
  },
  plugins: [
    // 정적 SPA 배포: 서버 런타임 없이 nginx 정적 서빙 → dist/client (index.html 셸 prerender)
    tanstackStart({ spa: { enabled: true, prerender: { outputPath: "/index.html" } } }),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
});
