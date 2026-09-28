import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["src/test/crm-documents-*.test.ts", "src/test/document-money.test.ts", "scripts/mcp-sdk-windows.test.ts"] },
});
