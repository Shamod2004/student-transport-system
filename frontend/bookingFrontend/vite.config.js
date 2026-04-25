import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@route": path.resolve(__dirname, "../routeManagementFrontend/src")
    }
  },
  server: {
    port: 3001,
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true
      }
    },
    fs: {
      allow: [path.resolve(__dirname, "..")]
    }
  }
});
