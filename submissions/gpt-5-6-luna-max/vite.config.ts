import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/pokeapi": {
        target: "https://pokeapi.co",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pokeapi/, "/api/v2"),
      },
    },
  },
  preview: {
    proxy: {
      "/api/pokeapi": {
        target: "https://pokeapi.co",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pokeapi/, "/api/v2"),
      },
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
