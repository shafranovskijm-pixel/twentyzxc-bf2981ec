import { describe, expect, it } from "vitest";
import { getContractRenewalPeriod, isFrdoContractType } from "@/lib/contract-renewal";

describe("getContractRenewalPeriod", () => {
  it("starts on the next day and creates a continuous one-year period", () => {
    expect(getContractRenewalPeriod({
      contract_date: "2026-08-16",
      paid_until: "2027-08-16",
    })).toEqual({
      startDate: "2027-08-17",
      endDate: "2028-08-16",
    });
  });

  it("handles a renewal period that includes leap day", () => {
    expect(getContractRenewalPeriod({ paid_until: "2027-02-28" })).toEqual({
      startDate: "2027-03-01",
      endDate: "2028-02-29",
    });
  });

  it("derives the previous end date when only the contract date is available", () => {
    expect(getContractRenewalPeriod({ contract_date: "2026-08-16" })).toEqual({
      startDate: "2027-08-17",
      endDate: "2028-08-16",
    });
  });

  it("does not create a period from invalid or missing dates", () => {
    expect(getContractRenewalPeriod({})).toBeNull();
    expect(getContractRenewalPeriod({ paid_until: "2027-02-30" })).toBeNull();
  });
});

describe("isFrdoContractType", () => {
  it("recognizes all common FRDO labels", () => {
    expect(isFrdoContractType("ФРДО")).toBe(true);
    expect(isFrdoContractType("FRDO support")).toBe(true);
    expect(isFrdoContractType("Сопровождение ФИС ФРДО")).toBe(true);
    expect(isFrdoContractType("разработка")).toBe(false);
  });
});
