import { describe, expect, it } from "vitest";
import { summarizeDashboardPayments, type DashboardContract } from "../lib/dashboard-payments";

const contract = (id: string, overrides: Partial<DashboardContract> = {}): DashboardContract => ({
  id, client_name: "Клиент", contract_date: "2026-10-01", payment_status: "оплачено",
  amount: 100, amount_extra: 20, ...overrides,
});

describe("dashboard saved payment balances", () => {
  it("uses saved discounted and partial receipts rather than gross paid contract amounts", () => {
    const summary = summarizeDashboardPayments([
      contract("discounted"), contract("partial", { payment_status: "частично оплачено" }), contract("legacy"),
    ], [
      { contract_id: "discounted", paid_amount: 90 },
      { contract_id: "partial", paid_amount: "25.50" },
    ])!;
    expect(summary.savedAmount).toBe(115.5);
    expect(summary.legacyAmount).toBe(120);
    expect(summary.total).toBe(235.5);
    expect(summary.entries.filter((entry) => entry.source === "legacy").map((entry) => entry.contract.id)).toEqual(["legacy"]);
  });

  it("retains unknown sibling balances while counting only their known subtotal", () => {
    const summary = summarizeDashboardPayments([contract("siblings"), contract("unknown")], [
      { contract_id: "siblings", paid_amount: 30 },
      { contract_id: "siblings", paid_amount: null },
      { contract_id: "siblings", paid_amount: 10 },
      { contract_id: "unknown", paid_amount: null },
      { contract_id: null, paid_amount: 999 },
    ])!;
    expect(summary.savedAmount).toBe(40);
    expect(summary.unknownContracts).toBe(2);
    expect(summary.knownStateCount).toBe(2);
    expect(summary.legacyEstimateCount).toBe(0);
    expect(summary.entries.every((entry) => entry.source === "saved" && entry.hasUnknown)).toBe(true);
  });

  it("distinguishes explicit zero from an unknown amount and does not infer transaction dates", () => {
    const summary = summarizeDashboardPayments([contract("zero"), contract("unknown")], [
      { contract_id: "zero", paid_amount: 0 },
      { contract_id: "unknown", paid_amount: null },
    ])!;
    expect(summary.entries.map((entry) => entry.hasUnknown)).toEqual([false, true]);
    expect(summary.knownStateCount).toBe(1);
    expect(summary.entries.filter((entry) => entry.source === "legacy")).toEqual([]);
  });

  it("does not fall back to gross legacy amounts when state loading fails", () => {
    expect(summarizeDashboardPayments([contract("paid")], null)).toBeNull();
  });

  it("adds separately managed contracts for one client and preserves cents", () => {
    const summary = summarizeDashboardPayments([contract("one"), contract("two")], [
      { contract_id: "one", paid_amount: 0.1 },
      { contract_id: "two", paid_amount: 0.2 },
    ])!;
    expect(summary.total).toBe(0.3);
    expect(summary.entries).toHaveLength(2);
  });
});
