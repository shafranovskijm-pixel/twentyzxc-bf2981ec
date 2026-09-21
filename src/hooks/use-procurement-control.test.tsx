import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { webcrypto } from "node:crypto";

const db = vi.hoisted(() => ({
  rows: [] as Array<{ id: string; title: string; description: string | null; updated_at: string }>,
  readError: null as unknown, writeError: null as unknown, emptyWrite: false, corruptWrite: false,
  enforceUnique: false, insertedIds: new Set<string>(),
  from: vi.fn(), like: vi.fn(), insert: vi.fn(), update: vi.fn(), eq: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: (name: string) => {
    db.from(name);
    const mutation = (kind: "insert" | "update", fields: Record<string, unknown>) => {
      db[kind](fields);
      const builder = {
        eq: (field: string, value: unknown) => { db.eq(field, value); return builder; },
        select: () => builder,
        single: async () => {
          if (kind === "insert" && db.enforceUnique) {
            if (db.insertedIds.has(String(fields.id))) return { error: { code: "23505" }, data: null };
            db.insertedIds.add(String(fields.id));
          }
          return { error: db.writeError, data: db.emptyWrite ? null : {
            id: kind === "update" ? db.rows[0]?.id : "new-crm-id", ...fields,
            ...(db.corruptWrite ? { description: "{}" } : {}),
          } };
        },
      };
      return builder;
    };
    return {
      select: () => ({ like: (column: string, pattern: string) => {
        db.like(column, pattern);
        return { limit: async () => ({ data: db.rows, error: db.readError }) };
      } }),
      insert: (fields: Record<string, unknown>) => mutation("insert", fields),
      update: (fields: Record<string, unknown>) => mutation("update", fields),
    };
  },
} }));
import { escapeLike, instructionPrefix, procurementTaskId, readProcurementControl, saveProcurementInstruction, useProcurementControl } from "./use-procurement-control";

const tender = { number: "RT_01%", title: "Учебные материалы", href: "https://rt.roseltorg.ru/procedure/1" };
const instruction = { decision: "work" as const, priority: "high" as const, note: "Подготовить расчёт" };
const row = (overrides = {}) => ({ id: "existing-crm-id", title: `${instructionPrefix(tender.number)}${tender.title}`, updated_at: "2026-09-22T01:00:00.000Z", description: JSON.stringify({ namespace: "24zxc.procurement-control", version: 1, number: tender.number, ...instruction, sourceHref: tender.href }), ...overrides });
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("crypto", webcrypto); db.rows = []; db.readError = null; db.writeError = null; db.emptyWrite = false; db.corruptWrite = false; db.enforceUnique = false; db.insertedIds.clear(); });

describe("CRM procurement instruction persistence", () => {
  it("escapes wildcard identifiers and creates a namespaced CRM task without a submitted status", async () => {
    const saved = await saveProcurementInstruction(tender, instruction);
    expect(db.like).toHaveBeenCalledWith("title", `${escapeLike(instructionPrefix(tender.number))}%`);
    expect(escapeLike("x_10%\\" )).toBe("x\\_10\\%\\\\");
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({ title: "[Тендер:RT_01%] Учебные материалы", status: "todo", client_id: null, contract_id: null }));
    const stored = JSON.parse(db.insert.mock.calls[0][0].description);
    expect(stored).toMatchObject({ namespace: "24zxc.procurement-control", number: tender.number, ...instruction });
    expect(stored).not.toHaveProperty("submitted");
    expect(saved.id).toBe(await procurementTaskId(tender.number));
  });

  it("reserves one database primary key for concurrent first saves without overwriting the winner", async () => {
    db.enforceUnique = true;
    const results = await Promise.allSettled([
      saveProcurementInstruction(tender, instruction),
      saveProcurementInstruction(tender, { ...instruction, note: "Другой черновик" }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(db.insert.mock.calls[0][0].id).toBe(db.insert.mock.calls[1][0].id);
    expect(db.update).not.toHaveBeenCalled();
    expect(await procurementTaskId("другой номер")).not.toBe(await procurementTaskId(tender.number));
  });

  it("updates the verified existing ID with optimistic checks and preserves planner status/date", async () => {
    db.rows = [row()];
    const existing = readProcurementControl(db.rows[0], tender.number)!;
    await saveProcurementInstruction(tender, { ...instruction, note: "Новая заметка" }, existing);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.eq).toHaveBeenCalledWith("id", "existing-crm-id");
    expect(db.eq).toHaveBeenCalledWith("updated_at", existing.updatedAt);
    expect(db.eq).toHaveBeenCalledWith("description", db.rows[0].description);
    expect(db.update.mock.calls[0][0]).not.toHaveProperty("status");
    expect(db.update.mock.calls[0][0]).not.toHaveProperty("task_date");
    expect(db.update.mock.calls[0][0].updated_at).toBeTruthy();
  });

  it("never overwrites tasks outside the namespace or the exact tender number", async () => {
    db.rows = [row({ description: "Задача другого процесса" }), row({ id: "different-number", title: "[Тендер:RT_01%0] Другая закупка" })];
    await saveProcurementInstruction(tender, instruction);
    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it("rejects duplicate tasks, stale revisions and newly created competing instructions", async () => {
    db.rows = [row(), row({ id: "duplicate" })];
    await expect(saveProcurementInstruction(tender, instruction)).rejects.toThrow("несколько поручений");
    db.rows = [row()];
    await expect(saveProcurementInstruction(tender, instruction)).rejects.toThrow("изменилось");
    const stale = { ...readProcurementControl(db.rows[0], tender.number)!, updatedAt: "2026-09-21T00:00:00Z" };
    await expect(saveProcurementInstruction(tender, instruction, stale)).rejects.toThrow("изменилось");
    expect(db.insert).not.toHaveBeenCalled(); expect(db.update).not.toHaveBeenCalled();
  });

  it("does not report success on database failures, missing rows or mismatched returned payload", async () => {
    db.writeError = { message: "RLS denied" };
    await expect(saveProcurementInstruction(tender, instruction)).rejects.toThrow("не подтвердила");
    db.writeError = null; db.emptyWrite = true;
    await expect(saveProcurementInstruction(tender, instruction)).rejects.toThrow("не подтвердила");
    db.emptyWrite = false; db.corruptWrite = true;
    await expect(saveProcurementInstruction(tender, instruction)).rejects.toThrow("не совпал");
    db.corruptWrite = false; db.readError = new Error("read denied");
    const writes = db.insert.mock.calls.length;
    await expect(saveProcurementInstruction(tender, instruction)).rejects.toThrow("прочитать");
    expect(db.insert).toHaveBeenCalledTimes(writes);
  });
});

describe("admin-only control query", () => {
  const setup = (enabled: boolean, userId?: string) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    return renderHook((props: { enabled: boolean; userId?: string }) => useProcurementControl({ ...props, numbers: [tender.number] }), { wrapper, initialProps: { enabled, userId } });
  };

  it("never queries tasks or mutates for an anonymous user, even with explicit refetch/save", async () => {
    const { result } = setup(false);
    await act(async () => { await result.current.refetch(); });
    await expect(result.current.save({ tender, input: instruction })).rejects.toThrow("администратора");
    expect(db.from).not.toHaveBeenCalled();
    expect(result.current.controls).toEqual({});
  });

  it("requires both admin-enabled and a user ID", async () => {
    const { result } = setup(true);
    await act(async () => { await result.current.refetch(); });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("loads for an admin and immediately hides private controls after sign-out", async () => {
    db.rows = [row()];
    const { result, rerender } = setup(true, "admin-user");
    await waitFor(() => expect(result.current.controls[tender.number]?.note).toBe(instruction.note));
    rerender({ enabled: false, userId: undefined });
    expect(result.current.controls).toEqual({});
    const calls = db.from.mock.calls.length;
    await act(async () => { await result.current.refetch(); });
    expect(db.from).toHaveBeenCalledTimes(calls);
  });
});
