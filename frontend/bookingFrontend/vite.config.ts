import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@route": path.resolve(__dirname, "../routeManagementFrontend/src"),
    },
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
    hmr: {
      overlay: false,
    },
  },
}));
