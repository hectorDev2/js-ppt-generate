import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ["monaco-editor"],
          pptxgen: ["pptxgenjs"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["monaco-editor"],
  },
});
