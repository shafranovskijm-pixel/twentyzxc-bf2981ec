import { describe, expect, it } from "vitest";

import {
  buildGoalParams,
  getLandingAttribution,
  getServicePresetFromSearch,
  isSintagmaAttribution,
} from "@/lib/landing-attribution";

describe("landing attribution", () => {
  it("selects FIS FRDO for the legacy 24sintagma service link", () => {
    expect(
      getServicePresetFromSearch(
        "?key=license&utm_source=24sintagma&utm_content=fis-frdo",
      ),
    ).toBe("ФИС ФРДО");
  });

  it("selects the combined site and Direct service", () => {
    expect(getServicePresetFromSearch("?key=site-direct")).toBe(
      "Сайт + Яндекс Директ",
    );
  });

  it("keeps only supported attribution fields", () => {
    const attribution = getLandingAttribution(
      "?yclid=y-1&utm_source=24sintagma&utm_campaign=frdo&unknown=x",
    );

    expect(attribution).toEqual({
      yclid: "y-1",
      utm_source: "24sintagma",
      utm_campaign: "frdo",
    });
    expect(isSintagmaAttribution(attribution)).toBe(true);
    expect(buildGoalParams("ФИС ФРДО", attribution)).toMatchObject({
      service: "ФИС ФРДО",
      utm_source: "24sintagma",
      utm_campaign: "frdo",
      has_yclid: true,
    });
  });
});
