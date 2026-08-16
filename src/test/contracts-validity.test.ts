import { describe, expect, it } from "vitest";
import {
  compareContractsByPaidUntilAscending,
  compareContractsByPaidUntilDescending,
  compareContractsByPaidUntilUpcoming,
  compareContractsBySort,
  DEFAULT_CONTRACT_SORT,
  getPaidUntilDaysLeft,
  getNextContractSort,
  matchesContractValidity,
  type ContractSortFields,
  type ContractSortState,
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

const sortableContract = (
  id: string,
  overrides: Partial<ContractSortFields> = {},
) => ({
  id,
  client_name: id,
  contract_number: null,
  contract_date: null,
  payment_status: null,
  paid_until: null,
  amount: null,
  contract_type: null,
  responsible: null,
  is_one_time: false,
  ...overrides,
});

const sortedIds = (
  contracts: ReturnType<typeof sortableContract>[],
  sort: ContractSortState,
) => [...contracts]
  .sort((first, second) => compareContractsBySort(first, second, sort, NOW))
  .map((contract) => contract.id);

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

describe("compareContractsByPaidUntilUpcoming", () => {
  it("shows the nearest active terms first without hiding any contracts", () => {
    const contracts = [
      { id: "no-term", paid_until: null },
      { id: "expired-long-ago", paid_until: "2025-08-16" },
      { id: "october", paid_until: "2026-10-01" },
      { id: "expired-yesterday", paid_until: "2026-08-15" },
      { id: "september", paid_until: "2026-09-01" },
      { id: "one-time", paid_until: null, is_one_time: true },
    ];

    const sorted = [...contracts].sort((first, second) =>
      compareContractsByPaidUntilUpcoming(first, second, NOW),
    );

    expect(sorted.map((contract) => contract.id)).toEqual([
      "september",
      "october",
      "expired-yesterday",
      "expired-long-ago",
      "no-term",
      "one-time",
    ]);
  });
});

describe("getNextContractSort", () => {
  it("keeps the nearest-ending cycle for the paid-until column", () => {
    expect(DEFAULT_CONTRACT_SORT).toEqual({ field: "paid_until", direction: "upcoming" });
    expect(getNextContractSort(DEFAULT_CONTRACT_SORT, "paid_until"))
      .toEqual({ field: "paid_until", direction: "asc" });
    expect(getNextContractSort({ field: "paid_until", direction: "asc" }, "paid_until"))
      .toEqual({ field: "paid_until", direction: "desc" });
    expect(getNextContractSort({ field: "paid_until", direction: "desc" }, "paid_until"))
      .toEqual(DEFAULT_CONTRACT_SORT);
  });

  it("activates every other column in ascending order and toggles direction", () => {
    expect(getNextContractSort(DEFAULT_CONTRACT_SORT, "contract_date"))
      .toEqual({ field: "contract_date", direction: "asc" });
    expect(getNextContractSort({ field: "contract_date", direction: "asc" }, "contract_date"))
      .toEqual({ field: "contract_date", direction: "desc" });
    expect(getNextContractSort({ field: "contract_date", direction: "desc" }, "contract_date"))
      .toEqual({ field: "contract_date", direction: "asc" });
  });
});

describe("compareContractsBySort", () => {
  it("sorts organization names and contract numbers naturally", () => {
    const contracts = [
      sortableContract("beta", { client_name: "Бета", contract_number: "10-2026" }),
      sortableContract("missing", { client_name: "Янтарь" }),
      sortableContract("alpha", { client_name: "Альфа", contract_number: "2-2026" }),
    ];

    expect(sortedIds(contracts, { field: "client_name", direction: "asc" }))
      .toEqual(["alpha", "beta", "missing"]);
    expect(sortedIds(contracts, { field: "contract_number", direction: "asc" }))
      .toEqual(["alpha", "beta", "missing"]);
  });

  it("sorts dates and amounts while keeping missing values last", () => {
    const contracts = [
      sortableContract("missing"),
      sortableContract("later", { contract_date: "2026-10-01", amount: 24000 }),
      sortableContract("earlier", { contract_date: "2026-09-01", amount: 3500 }),
    ];

    expect(sortedIds(contracts, { field: "contract_date", direction: "asc" }))
      .toEqual(["earlier", "later", "missing"]);
    expect(sortedIds(contracts, { field: "amount", direction: "desc" }))
      .toEqual(["later", "earlier", "missing"]);
  });

  it("sorts payment statuses in their business order", () => {
    const contracts = [
      sortableContract("paid", { payment_status: "оплачено" }),
      sortableContract("missing"),
      sortableContract("partial", { payment_status: "частично" }),
      sortableContract("unpaid", { payment_status: "не оплачено" }),
    ];

    expect(sortedIds(contracts, { field: "payment_status", direction: "asc" }))
      .toEqual(["unpaid", "partial", "paid", "missing"]);
  });

  it("retains the nearest-ending mode in the shared sorter", () => {
    const contracts = [
      sortableContract("october", { paid_until: "2026-10-01" }),
      sortableContract("expired", { paid_until: "2026-08-15" }),
      sortableContract("september", { paid_until: "2026-09-01" }),
    ];

    expect(sortedIds(contracts, DEFAULT_CONTRACT_SORT))
      .toEqual(["september", "october", "expired"]);
  });
});
