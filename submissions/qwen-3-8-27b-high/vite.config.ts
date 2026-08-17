import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
   root: projectRoot,
   plugins: [react()],
   build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: true,
      cssCodeSplit: false,
   },
   server: {
      port: 5173,
      proxy: {
          "/api": "http://localhost:8787",
       },
    },
});
