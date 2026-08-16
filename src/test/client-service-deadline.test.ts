import { describe, expect, it } from "vitest";
import {
  compareClientsByServiceDeadline,
  getClientServiceDeadlineDaysLeft,
  getNextClientServiceDeadlineSort,
  matchesClientServiceDeadline,
  type ClientServiceDeadlineFilter,
} from "@/lib/client-service-deadline";

const NOW = new Date(2026, 7, 16, 15, 30);

const client = (serviceDeadline: string | null, noDeadline = false) => ({
  service_deadline: serviceDeadline,
  no_deadline: noDeadline,
});

describe("client service deadline filters", () => {
  it("uses calendar days and keeps all ranges exclusive", () => {
    expect(getClientServiceDeadlineDaysLeft("2026-08-16", NOW)).toBe(0);

    const cases: Array<[ClientServiceDeadlineFilter, string]> = [
      ["expired", "2026-08-15"],
      ["within_30", "2026-09-15"],
      ["days_31_60", "2026-09-16"],
      ["days_61_90", "2026-10-16"],
      ["after_90", "2026-11-15"],
    ];

    for (const [filter, deadline] of cases) {
      expect(matchesClientServiceDeadline(client(deadline), filter, NOW)).toBe(true);
    }
  });

  it("separates unlimited service from a missing date", () => {
    expect(matchesClientServiceDeadline(client(null, true), "no_deadline", NOW)).toBe(true);
    expect(matchesClientServiceDeadline(client(null), "missing", NOW)).toBe(true);
    expect(matchesClientServiceDeadline(client(null, true), "missing", NOW)).toBe(false);
  });
});

describe("client service deadline sorting", () => {
  it("sorts dates in both directions and keeps empty values last", () => {
    const rows = [
      { id: "missing", ...client(null) },
      { id: "later", ...client("2026-10-01") },
      { id: "unlimited", ...client(null, true) },
      { id: "earlier", ...client("2026-09-01") },
    ];

    expect([...rows].sort((a, b) => compareClientsByServiceDeadline(a, b, "asc")).map((row) => row.id))
      .toEqual(["earlier", "later", "missing", "unlimited"]);
    expect([...rows].sort((a, b) => compareClientsByServiceDeadline(a, b, "desc")).map((row) => row.id))
      .toEqual(["later", "earlier", "missing", "unlimited"]);
  });

  it("cycles through early, late and original order", () => {
    expect(getNextClientServiceDeadlineSort("none")).toBe("asc");
    expect(getNextClientServiceDeadlineSort("asc")).toBe("desc");
    expect(getNextClientServiceDeadlineSort("desc")).toBe("none");
  });
});
