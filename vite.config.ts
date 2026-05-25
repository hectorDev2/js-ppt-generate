import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    rollupOptions: {
      input: {
        main: "index.html",
        js: "js.html",
      },
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
