import { describe, expect, it } from "vitest";
import { describeRenewalTerm, selectRenewalReminders } from "../../supabase/functions/_shared/renewal-reminders";

function contract(id: string, changes: Record<string, unknown> = {}) {
  return {
    id, contract_date: "2026-09-30", service_start: "2025-10-01",
    service_end: "2026-09-30", paid_until: null as string | null,
    is_archived: false, is_one_time: false, service_no_deadline: false,
    ...changes,
  };
}

describe("Telegram renewal reminders from recorded terms", () => {
  it("does not flag newly issued 294–299 on their document date when their terms end next year", () => {
    const ends = ["2027-11-01", "2027-11-01", "2027-11-01", "2027-12-22", "2028-01-26", "2027-10-29"];
    expect(selectRenewalReminders(ends.map((service_end, i) => contract(String(294 + i), { service_end })), "2026-09-30")).toEqual([]);
  });

  it("includes today and day 14, excluding yesterday and day 15 without annual rollover", () => {
    const results = selectRenewalReminders([
      contract("last", { service_end: "2026-10-14" }),
      contract("today"),
      contract("expired", { service_end: "2026-09-29" }),
      contract("outside", { service_end: "2026-10-15" }),
    ], "2026-09-30");
    expect(results.map(r => [r.contract.id, r.daysRemaining])).toEqual([["today", 0], ["last", 14]]);
  });

  it("uses service_end before paid_until, retaining paid_until only as a distinct CRM source", () => {
    const results = selectRenewalReminders([
      contract("future-service", { service_end: "2027-09-30", paid_until: "2026-09-30" }),
      contract("paid-period", { service_end: null, paid_until: "2026-10-02" }),
      contract("service", { paid_until: "2026-10-10" }),
    ], "2026-09-30");
    expect(results.map(r => [r.contract.id, r.expirySource, r.daysRemaining])).toEqual([
      ["service", "service_end", 0], ["paid-period", "paid_until", 2],
    ]);
    expect(describeRenewalTerm(results[1])).toBe("период по CRM до 02.10.2026, через 2 дн.; факт оплаты не проверен");
    expect(describeRenewalTerm(results[0])).toBe("услуги до 30.09.2026, сегодня");
  });

  it("excludes archived, one-off and indefinite contracts even when a stale end date remains", () => {
    expect(selectRenewalReminders([
      contract("archive", { is_archived: true }),
      contract("one-off", { is_one_time: true }),
      contract("indefinite", { service_no_deadline: true }),
    ], "2026-09-30")).toEqual([]);
  });

  it("does not confuse a one-day recurring period with a one-off contract", () => {
    const results = selectRenewalReminders([
      contract("one-day", { service_start: "2026-09-30" }),
      contract("one-off-day", { service_start: "2026-09-30", is_one_time: true }),
    ], "2026-09-30");
    expect(results.map(r => r.contract.id)).toEqual(["one-day"]);
  });

  it("leaves missing or invalid service terms unknown, even with a document date or paid_until", () => {
    expect(selectRenewalReminders([
      contract("missing", { service_end: null, paid_until: null }),
      contract("invalid-end", { service_end: "2026-02-30", paid_until: "2026-09-30" }),
      contract("invalid-paid", { service_end: null, paid_until: "2026-13-01" }),
    ], "2026-09-30")).toEqual([]);
  });

  it.each([
    ["2026-12-31", "2027-01-01", 1],
    ["2028-02-28", "2028-02-29", 1],
    ["2028-02-28", "2028-03-01", 2],
    ["2026-03-07", "2026-03-09", 2],
  ])("counts calendar days from %s to %s independently of year/leap/DST boundaries", (asOf, end, days) => {
    expect(selectRenewalReminders([contract("boundary", { service_end: end })], asOf)[0].daysRemaining).toBe(days);
  });

  it("rejects invalid calendar windows rather than silently suppressing notifications", () => {
    expect(() => selectRenewalReminders([], "2026-02-30")).toThrow();
    expect(() => selectRenewalReminders([], "2026-09-30", -1)).toThrow();
    expect(() => selectRenewalReminders([], "2026-09-30", 1.5)).toThrow();
  });
});
