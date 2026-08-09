import { describe, it, expect } from "vitest";
import {
  normalizeOrgName,
  matchClientProposals,
  resolveProposalsEntry,
  buildProposalPrefill,
} from "@/lib/client-workspace-utils";

const proposals = [
  { id: "1", client_org: "ООО «СТАТУС»", client_name: "Иванов И.И." },
  { id: "2", client_org: "ООО ТЕХНОСЕРВИС", client_name: null },
  { id: "3", client_org: null, client_name: "ООО Статус" },
  { id: "4", client_org: null, client_name: "Петров П.П." },
  { id: "5", client_org: null, client_name: null },
];

describe("normalizeOrgName", () => {
  it("strips quotes, case and extra spaces", () => {
    expect(normalizeOrgName('  ООО  "Статус" ')).toBe("ооо статус");
    expect(normalizeOrgName(null)).toBe("");
  });
});

describe("matchClientProposals", () => {
  it("matches by organisation, including quote/case differences", () => {
    const res = matchClientProposals(proposals, { name: "ООО Статус" });
    expect(res.map((p) => p.id)).toEqual(["1", "3"]);
  });
  it("falls back to contact person only when org is empty", () => {
    const res = matchClientProposals(proposals, { name: "ООО Статус", contactPerson: "Петров П.П." });
    expect(res.map((p) => p.id)).toEqual(["1", "3", "4"]);
  });
  it("never returns foreign proposals", () => {
    const res = matchClientProposals(proposals, { name: "ООО ТЕХНОСЕРВИС" });
    expect(res.map((p) => p.id)).toEqual(["2"]);
  });
  it("returns nothing without a client name", () => {
    expect(matchClientProposals(proposals, { name: "   " })).toEqual([]);
  });
});

describe("resolveProposalsEntry", () => {
  it("opens an existing proposal", () => {
    expect(resolveProposalsEntry({ initialProposalId: "abc" })).toEqual({ view: "editor", editingId: "abc" });
  });
  it("opens a new editor", () => {
    expect(resolveProposalsEntry({ autoOpenNew: true })).toEqual({ view: "editor", editingId: null });
  });
  it("defaults to the list", () => {
    expect(resolveProposalsEntry({})).toEqual({ view: "list", editingId: null });
  });
});

describe("buildProposalPrefill", () => {
  it("uses contact person, then director", () => {
    expect(buildProposalPrefill({ name: "ООО А", director_name: "Сидоров", email: "a@b.c", phone: "+7" }))
      .toEqual({ clientOrg: "ООО А", clientName: "Сидоров", clientEmail: "a@b.c", clientPhone: "+7" });
    expect(buildProposalPrefill(null)).toBeNull();
  });
});
