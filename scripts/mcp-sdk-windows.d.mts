import type { PluginOption } from "vite";

export const PATCHED_SDK_VERSION: string;
export function patchWindowsResolver(source: string, format: string): string;
export function loadMcpPlugin(projectRoot: string): Promise<PluginOption>;
