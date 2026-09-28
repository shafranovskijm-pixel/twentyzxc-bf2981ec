import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { loadMcpPlugin } from "./scripts/mcp-sdk-windows.mjs";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const mcpPlugin = await loadMcpPlugin(__dirname);
  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), mcpPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["@turbodocx/html-to-docx"],
  },
  define: {
    global: "globalThis",
  },
  };
});
