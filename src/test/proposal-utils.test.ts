import { describe, it, expect } from "vitest";
import { formatMoneyRub, isValidIsoDate, formatDateRu } from "@/lib/proposal-utils";

describe("formatMoneyRub", () => {
  it("formats integers with thin spaces and a rouble sign", () => {
    expect(formatMoneyRub(50000).replace(/\u00a0|\u202f/g, " ")).toBe("50 000 ₽");
  });
  it("rounds and handles invalid input", () => {
    expect(formatMoneyRub(1499.6).replace(/\u00a0|\u202f/g, " ")).toBe("1 500 ₽");
    expect(formatMoneyRub(null)).toBe("0 ₽");
    expect(formatMoneyRub("abc")).toBe("0 ₽");
  });
});

describe("isValidIsoDate", () => {
  it("accepts ordinary dates", () => {
    expect(isValidIsoDate("2026-07-10")).toBe(true);
    expect(isValidIsoDate("2000-01-01")).toBe(true);
  });
  it("handles leap years", () => {
    expect(isValidIsoDate("2024-02-29")).toBe(true);
    expect(isValidIsoDate("2025-02-29")).toBe(false);
  });
  it("rejects five-digit years and malformed values", () => {
    expect(isValidIsoDate("20266-07-10")).toBe(false);
    expect(isValidIsoDate("1999-12-31")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2026-7-1")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
    expect(isValidIsoDate(null)).toBe(false);
  });
});

describe("formatDateRu", () => {
  it("formats ISO dates", () => {
    expect(formatDateRu("2026-07-10")).toBe("10.07.2026");
  });
  it("returns empty string for invalid values", () => {
    expect(formatDateRu("not-a-date")).toBe("");
    expect(formatDateRu(null)).toBe("");
  });
});
