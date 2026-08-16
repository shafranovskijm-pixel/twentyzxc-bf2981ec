import { describe, expect, it } from "vitest";
import { findDuplicateGroups, normalizeClientKey } from "@/lib/client-merge";

describe("normalizeClientKey", () => {
  it("matches organisation names with different quotes, case and punctuation", () => {
    expect(normalizeClientKey('АНООДПО "СТО "ПАТРИОТ"'))
      .toBe(normalizeClientKey("АНООДПО «СТО «Патриот»"));
    expect(normalizeClientKey("Ёлка — сервис"))
      .toBe(normalizeClientKey("елка сервис"));
  });
});

describe("findDuplicateGroups", () => {
  it("finds a name duplicate when only one card has an INN", () => {
    const clients = [
      { id: "with-inn", name: 'АНООДПО "СТО "ПАТРИОТ"', inn: "2536174080", created_at: "2026-01-01" },
      { id: "without-inn", name: "АНООДПО «СТО «Патриот»", inn: null, created_at: "2026-02-01" },
    ];

    expect(findDuplicateGroups(clients).map((group) => group.map((client) => client.id)))
      .toEqual([["with-inn", "without-inn"]]);
  });

  it("finds renamed organisations by matching INN", () => {
    const clients = [
      { id: "old", name: "ООО Старое название", inn: "7701234567" },
      { id: "new", name: "ООО Новое название", inn: "7701234567" },
    ];

    expect(findDuplicateGroups(clients)).toHaveLength(1);
  });

  it("does not auto-merge equal names with conflicting INNs", () => {
    const clients = [
      { id: "first", name: "ООО Вектор", inn: "7701234567" },
      { id: "second", name: "ООО Вектор", inn: "7801234567" },
    ];

    expect(findDuplicateGroups(clients)).toEqual([]);
  });
});
