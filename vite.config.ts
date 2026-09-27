import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  root: "client",
  publicDir: "public",
  build: {
    outDir: "../dist/client",
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  server: {
    proxy: {
      "/api": "http://localhost:5000"
    }
  }
});
