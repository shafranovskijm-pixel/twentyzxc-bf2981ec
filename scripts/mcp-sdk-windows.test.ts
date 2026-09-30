import { describe, expect, it } from "vitest";
import { isAbsolute } from "node:path";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { PATCHED_SDK_VERSION, patchWindowsResolver, patchToolMetadata, patchRuntimeResolver } from "./mcp-sdk-windows.mjs";

describe("pinned Windows MCP SDK resolver correction", () => {
  it("returns native file parameter metadata through the real MCP tools/list transport", async () => {
    const sdkPath = pathToFileURL(resolve(`.codex-temp/mcp-sdk-${PATCHED_SDK_VERSION}/dist/stacks/supabase/index.js`)).href;
    const { createSupabaseHandler } = await import(/* @vite-ignore */ sdkPath);
    const handler = createSupabaseHandler({ name: "local-file-schema-test", version: "1", tools: [{
      name: "test_file", title: "test", description: "Local schema acceptance only",
      inputSchema: { file: z.object({ download_url: z.string(), file_id: z.string(), mime_type: z.string().optional(), file_name: z.string().optional() }) },
      _meta: { "openai/fileParams": ["file"] },
      handler: () => { throw new Error("Tool execution is not part of this listing test"); },
    }] }, { functionName: "mcp" });
    const response = await handler(new Request("https://test.invalid/functions/v1/mcp", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    }));
    expect(response.status).toBe(200);
    const body = await response.text();
    const json = JSON.parse(body.startsWith("event:") ? body.split("\n").find(line => line.startsWith("data: "))!.slice(6) : body);
    expect(json.result.tools[0]._meta["openai/fileParams"]).toEqual(["file"]);
    expect(json.result.tools[0].inputSchema.properties.file.required).toEqual(["download_url", "file_id"]);
  }, 15000);
  it.each(["list-tools-ChLj1G6z.js", "list-tools-DChR_9Q2.cjs", "mcp-BiyuOOzg.js", "mcp-C_SCcw5F.cjs"])("preserves native file metadata in %s", file => {
    const source = readFileSync(resolve("node_modules/@lovable.dev/mcp-js/dist", file), "utf8");
    const patched = patchToolMetadata(source);
    expect(patched).toContain("_meta: tool._meta");
    expect(patchToolMetadata(patched)).toBe(patched);
    expect(() => patchToolMetadata("changed SDK")).toThrow("unexpected");
  });
  it.each([["vite.js", "esm"], ["vite.cjs", "cjs"]])("bundles corrected runtime in %s", (file, format) => {
    const source = readFileSync(resolve("node_modules/@lovable.dev/mcp-js/dist/stacks/supabase", file), "utf8");
    const patched = patchRuntimeResolver(patchWindowsResolver(source, format), format);
    expect(patched).toContain('p === "@lovable.dev/mcp-js/stacks/supabase"');
    expect(patchRuntimeResolver(patched, format)).toBe(patched);
  });
  it.each([["vite.js", "esm"], ["vite.cjs", "cjs"]])("patches installed %s exactly and is idempotent", (file, format) => {
    const sdkDir = resolve("node_modules/@lovable.dev/mcp-js");
    const pkg = JSON.parse(readFileSync(resolve(sdkDir, "package.json"), "utf8"));
    expect(pkg.version).toBe(PATCHED_SDK_VERSION);
    const original = readFileSync(resolve(sdkDir, "dist/stacks/supabase", file), "utf8");
    const patched = patchWindowsResolver(original, format);
    expect(patched).not.toEqual(original);
    expect(patchWindowsResolver(patched, format)).toBe(patched);
    expect(readFileSync(resolve(sdkDir, "dist/stacks/supabase", file), "utf8")).toBe(original);
    const guard = patched.split("\n").find(line => line.includes('p.startsWith(".")') && line.includes("return null;"));
    expect(guard).toBeDefined();
    const localPath = new Function("p", "isAbsolute", "node_path", `${guard} return false;`);
    for (const path of ["D:\\repo\\src\\lib\\mcp\\index.ts", "D:/repo/src/lib/mcp/index.ts", "./tools/read.ts", "/repo/entry.ts"]) {
      expect(localPath(path, isAbsolute, { isAbsolute })).toBeNull();
    }
    for (const path of ["@supabase/supabase-js", "zod", "npm:zod@3"]) {
      expect(localPath(path, isAbsolute, { isAbsolute })).toBe(false);
    }
  });
  it("fails closed when the expected SDK implementation changes", () => {
    expect(() => patchWindowsResolver("unrelated code", "esm")).toThrow("unexpected");
    expect(() => patchWindowsResolver("unrelated code", "other")).toThrow("Unknown SDK");
  });
  it("keeps the generated bundle self-contained and consistent with the manifest", () => {
    const manifest = JSON.parse(readFileSync(resolve(".lovable/mcp/manifest.json"), "utf8"));
    const compiled = readFileSync(resolve("supabase/functions/mcp/index.ts"), "utf8");
    expect(manifest.mcp.tools.length).toBeGreaterThan(0);
    expect(manifest.auth.issuer).not.toContain("project-ref-unset");
    expect(compiled).not.toMatch(/npm:[A-Za-z]:[\\/]/);
    expect(compiled).not.toContain("project-ref-unset");
    expect(compiled).toContain("Deno.serve(createSupabaseHandler(");
    expect(compiled).toContain("_meta: tool._meta");
    for (const name of ["crm_import_client_pdf", "crm_import_client_file"]) {
      const fileTool = manifest.mcp.tools.find(tool => tool.name === name);
      expect(fileTool._meta["openai/fileParams"]).toEqual(["file"]);
      expect(fileTool.inputSchema.properties.file.required).toEqual(["download_url", "file_id"]);
    }
    for (const tool of manifest.mcp.tools) expect(compiled).toContain(`name: ${JSON.stringify(tool.name)}`);
  });
});
