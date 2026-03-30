import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

const apiPort = process.env.VITE_API_PORT ?? "3001";

/** Injects canonical, og:url, and social images when deploying (set at build time). */
function injectSiteSeoMeta(): Plugin {
  return {
    name: "inject-site-seo-meta",
    transformIndexHtml(html) {
      const base = process.env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
      const ogImage = process.env.VITE_OG_IMAGE_URL?.trim() ?? "";
      const tags: string[] = [];
      if (base) {
        tags.push(`<link rel="canonical" href="${base}/" />`);
        tags.push(`<meta property="og:url" content="${base}/" />`);
      }
      if (ogImage) {
        tags.push(`<meta property="og:image" content="${ogImage}" />`);
        tags.push(`<meta name="twitter:image" content="${ogImage}" />`);
      }
      if (tags.length === 0) return html;
      return html.replace("</head>", `    ${tags.join("\n    ")}\n  </head>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), injectSiteSeoMeta()],
  resolve: {
    alias: {
      "@screenshoter/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
