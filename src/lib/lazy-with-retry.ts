import { lazy, type ComponentType } from "react";

const RELOAD_FLAG = "lazy-chunk-reloaded-at";

/**
 * React.lazy with resilience against stale/failed chunk downloads.
 * Retries once after a short delay, then force-reloads the page (max once
 * per minute) so the browser fetches the freshly deployed asset manifest.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        return await factory();
      } catch (err2) {
        try {
          const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
          if (Date.now() - last > 60_000) {
            sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
            window.location.reload();
            return await new Promise<{ default: T }>(() => {});
          }
        } catch {
          /* ignore storage errors */
        }
        throw err2;
      }
    }
  });
}
