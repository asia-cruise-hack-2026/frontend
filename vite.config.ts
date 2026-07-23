import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 3000 },
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
