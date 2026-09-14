import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ rows: [] as any[], error: null as any, update: vi.fn(), insert: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({
  select: () => ({ order: () => ({ range: async () => ({ data: db.rows, error: db.error }) }) }),
  update: (fields: any) => { db.update(fields); return { eq: () => ({ select: () => ({ single: async () => ({ data: { id: "1", name: "РОТОР" }, error: db.error }) }) }) }; },
  insert: (fields: any) => { db.insert(fields); return { select: () => ({ single: async () => ({ data: { id: "2", name: fields.name }, error: db.error }) }) }; },
}) } }));
import { ensureClient } from "@/lib/ensure-client";
import { getContractRenewalPeriod } from "@/lib/contract-renewal";
beforeEach(() => { db.rows = []; db.error = null; vi.clearAllMocks(); });
describe("required client persistence", () => {
  it("creates a new client", async () => { await ensureClient({ name: " РОТОР ", inn: "123" }); expect(db.insert).toHaveBeenCalledWith({ name: "РОТОР", inn: "123" }); });
  it("matches by INN and never clears existing fields", async () => { db.rows = [{ id: "1", name: "РОТОР", inn: "123" }]; await ensureClient({ name: "Другое название", inn: "123", kpp: "" }); expect(db.insert).not.toHaveBeenCalled(); expect(db.update).toHaveBeenCalledWith({ inn: "123" }); });
  it("matches normalized names", async () => { db.rows = [{ id: "1", name: 'ООО «РОТОР»', inn: null }]; await ensureClient({ name: 'ооо "Ротор"' }); expect(db.insert).not.toHaveBeenCalled(); });
  it("propagates failures", async () => { db.error = new Error("denied"); await expect(ensureClient({ name: "РОТОР" })).rejects.toThrow("denied"); expect(db.insert).not.toHaveBeenCalled(); });
  it("renews from service end rather than payment", () => { expect(getContractRenewalPeriod({ service_end: "2026-12-31", paid_until: "2026-01-01" })?.startDate).toBe("2027-01-01"); });
  it("does not invent an end for an unlimited service", () => { expect(getContractRenewalPeriod({ service_no_deadline: true, contract_date: "2026-01-01" })).toBeNull(); });
});