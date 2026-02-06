import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: "/SoccerScoreboardAPPv2/", // 👈 REQUIRED for GitHub Pages

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
      includeAssets: ["favicon.ico", "soccer-ball-icon.png"],
      manifest: {
        name: "Soccer Scoreboard APP",
        short_name: "Scoreboard",
        description: "Track soccer game scores with timer and period tracking",
        theme_color: "#1a332a",
        background_color: "#1a332a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/SoccerScoreboardAPPv2/",
        scope: "/SoccerScoreboardAPPv2/",
        icons: [
          {
            src: "soccer-ball-icon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "soccer-ball-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
