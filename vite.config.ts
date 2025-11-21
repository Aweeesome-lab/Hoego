import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "index.html"),
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          markdown: ["react-markdown", "remark-gfm", "rehype-raw", "rehype-katex"],
        },
      },
    },
  },
});
