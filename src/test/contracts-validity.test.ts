import { describe, expect, it } from "vitest";
import {
  compareContractsByPaidUntilAscending,
  compareContractsByPaidUntilDescending,
  getPaidUntilDaysLeft,
  matchesContractValidity,
  type ContractValidityFilter,
} from "@/lib/contracts-validity";

const NOW = new Date(2026, 7, 16, 18, 30);

const matches = (
  paidUntil: string | null,
  filter: ContractValidityFilter,
  isOneTime = false,
) => matchesContractValidity(
  { paid_until: paidUntil, is_one_time: isOneTime },
  filter,
  NOW,
);

describe("getPaidUntilDaysLeft", () => {
  it("compares calendar days instead of the current time of day", () => {
    expect(getPaidUntilDaysLeft("2026-08-16", NOW)).toBe(0);
    expect(getPaidUntilDaysLeft("2026-08-15", NOW)).toBe(-1);
  });

  it("returns null for missing or invalid dates", () => {
    expect(getPaidUntilDaysLeft(null, NOW)).toBeNull();
    expect(getPaidUntilDaysLeft("2026-02-30", NOW)).toBeNull();
  });
});

describe("matchesContractValidity", () => {
  it("separates expired, 30-day, 31–90-day and long-term contracts", () => {
    expect(matches("2026-08-15", "expired")).toBe(true);
    expect(matches("2026-09-15", "within-30")).toBe(true);
    expect(matches("2026-09-16", "within-90")).toBe(true);
    expect(matches("2026-11-15", "over-90")).toBe(true);
  });

  it("keeps no-term and one-time contracts separate", () => {
    expect(matches(null, "no-term")).toBe(true);
    expect(matches(null, "one-time", true)).toBe(true);
    expect(matches(null, "no-term", true)).toBe(false);
    expect(matches(null, "within-30", true)).toBe(false);
  });

});

describe("compareContractsByPaidUntilAscending", () => {
  it("places earlier dates first and contracts without a term last", () => {
    const contracts = [
      { id: "no-term", paid_until: null },
      { id: "later", paid_until: "2027-09-01" },
      { id: "earlier", paid_until: "2026-08-01" },
      { id: "one-time", paid_until: "2025-01-01", is_one_time: true },
    ];

    const sorted = [...contracts].sort(compareContractsByPaidUntilAscending);

    expect(sorted.map((contract) => contract.id)).toEqual([
      "earlier",
      "later",
      "no-term",
      "one-time",
    ]);
  });

  it("places later dates first in reverse order and still keeps missing terms last", () => {
    const contracts = [
      { id: "no-term", paid_until: null },
      { id: "september", paid_until: "2026-09-01" },
      { id: "october", paid_until: "2026-10-01" },
    ];

    const sorted = [...contracts].sort(compareContractsByPaidUntilDescending);

    expect(sorted.map((contract) => contract.id)).toEqual([
      "october",
      "september",
      "no-term",
    ]);
  });
});
