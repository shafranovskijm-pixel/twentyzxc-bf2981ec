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

  it("does not infer an annual term from a document date", () => {
    expect(getContractRenewalPeriod({ contract_date: "2026-08-16" })).toBeNull();
  });

  it("does not create a period from invalid or missing dates", () => {
    expect(getContractRenewalPeriod({})).toBeNull();
    expect(getContractRenewalPeriod({ paid_until: "2027-02-30" })).toBeNull();
    expect(getContractRenewalPeriod({ service_end: "2026-02-30", paid_until: "2026-09-30" })).toBeNull();
    expect(getContractRenewalPeriod({ service_end: "2026-09-30T23:00:00Z" })).toBeNull();
  });

  it("prefers the service term over the recorded paid-through date", () => {
    expect(getContractRenewalPeriod({ service_end: "2027-11-01", paid_until: "2026-09-30" })).toEqual({
      startDate: "2027-11-02", endDate: "2028-11-01",
    });
  });

  it.each(["is_archived", "is_one_time", "service_no_deadline"] as const)("does not prefill a renewal for %s", flag => {
    expect(getContractRenewalPeriod({ service_end: "2026-09-30", [flag]: true })).toBeNull();
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
