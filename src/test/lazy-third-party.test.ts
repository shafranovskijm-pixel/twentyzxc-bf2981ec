import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SINTAGMA_METRIKA_ID,
  trackMetrikaGoal,
} from "@/lib/lazy-third-party";

describe("lazy Yandex Metrika", () => {
  afterEach(() => {
    const metrikaWindow = window as typeof window & {
      ym?: unknown;
      __metrikaLoaded?: boolean;
      __metrikaCountersInitialized?: boolean;
    };
    delete metrikaWindow.ym;
    delete metrikaWindow.__metrikaLoaded;
    delete metrikaWindow.__metrikaCountersInitialized;
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("queues counter init before a fast successful-lead goal", () => {
    window.history.replaceState(
      {},
      "",
      "/?utm_source=24sintagma&utm_landing=24sintagma_fis-frdo",
    );
    vi.spyOn(document.head, "appendChild").mockImplementation((node) => node);

    trackMetrikaGoal(SINTAGMA_METRIKA_ID, "demo_request_success", {
      service: "ФИС ФРДО",
    });

    const queuedCalls = ((window as any).ym.a as IArguments[]).map((args) =>
      Array.from(args),
    );

    expect(queuedCalls.map((call) => call.slice(0, 2))).toEqual([
      [101339397, "init"],
      [105216554, "init"],
      [105216554, "reachGoal"],
    ]);
  });
});
