import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: mode === "production" && process.env.GITHUB_PAGES ? "/SoccerScoreboardAPPv2/" : "/",

  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "soccer-ball-icon.png", "app-icon.png"],
      // Use firebase-messaging-sw.js as the service worker to handle both PWA + push
      srcDir: "public",
      filename: "firebase-messaging-sw.js",
      strategies: "injectManifest",
      injectManifest: {
        injectionPoint: undefined, // Don't inject workbox precache manifest
      },
      manifest: {
        name: "Soccer Scoreboard APP",
        short_name: "Scoreboard",
        description: "Track soccer game scores with timer and period tracking",
        theme_color: "#1a332a",
        background_color: "#1a332a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "app-icon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "app-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
