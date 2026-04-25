import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration file - React project setup karanna
export default defineConfig({
  plugins: [react()], // React plugin enable karanna
  server: {
    port: 3000, // Route management frontend port eka (main entry)
    strictPort: true, // Don't fallback to another port - fail if 3000 is in use
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // Backend API proxy karanna
        changeOrigin: true, // Origin header change karanna
        secure: false, // HTTPS SSL ignore karanna
      },
    },
    hmr: {
      overlay: false, // Disable HMR overlay to prevent crashes
    },
  },
  build: {
    outDir: 'dist', // Build output directory
    sourcemap: true, // Source maps generate karanna
  },
})
