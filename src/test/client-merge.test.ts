import { describe, expect, it } from "vitest";
import {
  findClientMergeCandidates,
  findDuplicateGroups,
  normalizeClientKey,
} from "@/lib/client-merge";

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

describe("findClientMergeCandidates", () => {
  const clients = [
    {
      id: "opened",
      name: "АНООДПО «СТО «Патриот»",
      inn: null,
      phone: "7 914 339-80-50",
      email: "patriot.patriot.13@inbox.ru",
    },
    {
      id: "existing",
      name: "АНОО ДПО СТО Патриот",
      inn: "2536174080",
      phone: "+7 914 339-80-50",
      email: null,
    },
    {
      id: "other",
      name: "ООО Техносервис",
      inn: "6382090879",
      phone: "+7 927 611-19-55",
      email: "office@tech.ru",
    },
  ];

  it("suggests a likely duplicate for the opened client", () => {
    expect(findClientMergeCandidates(clients, "opened", "").map((client) => client.id))
      .toEqual(["existing"]);
  });

  it("searches every other client by name, INN, phone and email", () => {
    expect(findClientMergeCandidates(clients, "opened", "техносервис").map((client) => client.id))
      .toEqual(["other"]);
    expect(findClientMergeCandidates(clients, "opened", "638209").map((client) => client.id))
      .toEqual(["other"]);
    expect(findClientMergeCandidates(clients, "opened", "611-19-55").map((client) => client.id))
      .toEqual(["other"]);
    expect(findClientMergeCandidates(clients, "opened", "office@tech.ru").map((client) => client.id))
      .toEqual(["other"]);
  });

  it("never offers the opened client as its own duplicate", () => {
    expect(findClientMergeCandidates(clients, "opened", "патриот").map((client) => client.id))
      .toEqual(["existing"]);
  });
});
