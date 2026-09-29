import type { Plugin } from "vite";

export const PATCHED_SDK_VERSION: string;
export function patchWindowsResolver(source: string, format: string): string;
export function patchToolMetadata(source: string): string;
export function patchRuntimeResolver(source: string, format: string): string;
export function loadMcpPlugin(projectRoot: string): Promise<(options?: Record<string, unknown>) => Plugin>;
