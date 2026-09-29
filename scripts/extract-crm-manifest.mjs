import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { loadMcpPlugin, PATCHED_SDK_VERSION } from "./mcp-sdk-windows.mjs";

// Use the same metadata-aware SDK copy as the Vite runtime generator.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await loadMcpPlugin(root);
await import(pathToFileURL(resolve(root, `.codex-temp/mcp-sdk-${PATCHED_SDK_VERSION}/dist/cli/extract-manifest.cjs`)).href);
