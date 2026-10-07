import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const PATCHED_SDK_VERSION = "0.23.0";
const LEGACY_GUARD = 'if (p.startsWith(".") || p.startsWith("/")) return null;';
const ESM_PATH_IMPORT = 'import { dirname, join, relative, resolve, sep } from "node:path";';
const PATCHED_ESM_PATH_IMPORT = 'import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";';

function exactlyOnce(text, oldText, newText, label) {
  const oldCount = text.split(oldText).length - 1;
  const newCount = text.split(newText).length - 1;
  if (oldCount === 1 && newCount === 0) return text.replace(oldText, newText);
  if (newCount === 1 && !text.replace(newText, "").includes(oldText)) return text;
  throw new Error(`MCP SDK ${PATCHED_SDK_VERSION}: unexpected ${label}; refusing a speculative patch`);
}

/** Pure, guarded and idempotent patch for the SDK 0.23.0 Windows resolver bug. */
export function patchWindowsResolver(source, format) {
  if (format !== "esm" && format !== "cjs") throw new Error("Unknown SDK module format");
  const absolute = format === "esm" ? "isAbsolute" : "node_path.isAbsolute";
  const guard = String.raw`if (p.startsWith(".") || p.startsWith("/") || ${absolute}(p) || /^[A-Za-z]:[\\/]/.test(p)) return null;`;
  let patched = exactlyOnce(source, LEGACY_GUARD, guard, `${format} absolute-path guard`);
  if (format === "esm") patched = exactlyOnce(patched, ESM_PATH_IMPORT, PATCHED_ESM_PATH_IMPORT, "node:path import");
  else if (!patched.includes('let node_path = require("node:path");')) throw new Error("MCP SDK: missing CJS node:path binding");
  return patched;
}

/** SDK 0.23.0 drops MCP extension metadata. Keep native ChatGPT file inputs. */
export function patchToolMetadata(source) {
  return exactlyOnce(source, "annotations: tool.annotations", "_meta: tool._meta,\n\t\t\tannotations: tool.annotations", "tool metadata forwarding");
}

/** Keep optional Workers metrics out of the Supabase static dependency graph. */
export function patchOptionalCloudflareImport(source) {
  const binding = 'let cloudflareEnvPromise;';
  let result = exactlyOnce(source, binding, `${binding}\nconst cloudflareWorkersModule = "cloudflare:workers";`, "optional Workers module binding");
  result = exactlyOnce(result,
    'import(\n\t\t\t/* @vite-ignore */\n\t\t\t"cloudflare:workers"\n)',
    'import(/* @vite-ignore */ cloudflareWorkersModule)',
    "optional Workers import");
  return result;
}

export function patchRuntimeResolver(source, format) {
  const target = format === "esm"
    ? 'new URL("./index.js", import.meta.url).pathname'
    : 'node_path.join(__dirname, "index.js")';
  // fileURLToPath is needed on Windows; avoid a platform-specific path in output.
  const resolved = format === "esm" ? 'fileURLToPath(new URL("./index.js", import.meta.url))' : target;
  let result = exactlyOnce(source, 'const p = args.path;', `const p = args.path;\n\t\t\t\tif (p === "@lovable.dev/mcp-js/stacks/supabase") return { path: ${resolved} };`, "private runtime resolver");
  if (format === "esm") result = exactlyOnce(result, 'import { build } from "esbuild";', 'import { build } from "esbuild";\nimport { fileURLToPath } from "node:url";', "runtime URL import");
  result = exactlyOnce(result, 'const versions = readProjectDependencyVersions(projectRoot);', 'const versions = { "@modelcontextprotocol/sdk": "1.28.0", "jose": "6.2.2", ...readProjectDependencyVersions(projectRoot) };', "pinned runtime dependencies");
  // esbuild erases types but the platform requires an index.ts entry point.
  // Keep SDK ownership detection intact and typecheck the authored source instead.
  result = exactlyOnce(result, '${GENERATED_BANNER}\\n// supabase function:', '${GENERATED_BANNER}\\n// @ts-nocheck -- Generated JavaScript; typecheck src/lib/mcp/index.ts instead.\\n// supabase function:', "generated JavaScript typecheck directive");
  return result;
}

function containedBy(parent, child) {
  const rel = relative(parent, child);
  return rel !== "" && !rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel);
}

/**
 * Copy the pinned SDK into this repository on all platforms. Native attachment
 * metadata needs the same guarded correction on Lovable Linux and Windows.
 * The original dependency directory is never written to.
 */
export async function loadMcpPlugin(projectRoot) {
  const root = realpathSync(projectRoot);
  const require = createRequire(resolve(root, "package.json"));
  const sdkRoot = dirname(dirname(require.resolve("@lovable.dev/mcp-js")));
  const pkg = JSON.parse(readFileSync(resolve(sdkRoot, "package.json"), "utf8"));
  if (pkg.name !== "@lovable.dev/mcp-js" || pkg.version !== PATCHED_SDK_VERSION) {
    throw new Error(`Windows MCP patch expects @lovable.dev/mcp-js ${PATCHED_SDK_VERSION}; found ${pkg.name}@${pkg.version}`);
  }

  // Validate both inputs before creating or writing the private package copy.
  const inputs = [
    ["dist/stacks/supabase/vite.js", "esm"],
    ["dist/stacks/supabase/vite.cjs", "cjs"],
  ];
  const patched = inputs.map(([file, format]) => [file, patchRuntimeResolver(patchWindowsResolver(readFileSync(resolve(sdkRoot, file), "utf8"), format), format)]);
  for (const file of ["dist/list-tools-ChLj1G6z.js", "dist/list-tools-DChR_9Q2.cjs", "dist/mcp-BiyuOOzg.js", "dist/mcp-C_SCcw5F.cjs"]) {
    patched.push([file, patchToolMetadata(readFileSync(resolve(sdkRoot, file), "utf8"))]);
  }
  for (const file of ["dist/cors-BXcpNLm9.js", "dist/cors-CDnoIzo6.cjs"]) {
    patched.push([file, patchOptionalCloudflareImport(readFileSync(resolve(sdkRoot, file), "utf8"))]);
  }
  const workDir = resolve(root, ".codex-temp");
  mkdirSync(workDir, { recursive: true });
  if (!containedBy(root, realpathSync(workDir))) throw new Error("MCP private SDK directory must stay inside this repository");
  const copyDir = resolve(workDir, `mcp-sdk-${PATCHED_SDK_VERSION}`);
  if (existsSync(copyDir) && (lstatSync(copyDir).isSymbolicLink() || !containedBy(root, realpathSync(copyDir)))) {
    throw new Error("Refusing to patch a shared or external SDK copy");
  }
  cpSync(sdkRoot, copyDir, { recursive: true, force: true, dereference: true });
  for (const [file, code] of patched) writeFileSync(resolve(copyDir, file), code);
  return (await import(pathToFileURL(resolve(copyDir, "dist/stacks/supabase/vite.js")).href)).mcpPlugin;
}
