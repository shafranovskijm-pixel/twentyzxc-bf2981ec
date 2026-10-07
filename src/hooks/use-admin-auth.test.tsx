import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn(), rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: mock, rpc: mock.rpc } }));
import { useAdminAuth } from "./use-admin-auth";

let listener: (event: string, session: unknown) => unknown;
const session = { user: { id: "test-admin" } };
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  mock.getSession.mockReset().mockReturnValue(new Promise(() => {}));
  mock.rpc.mockReset().mockResolvedValue({ data: true, error: null });
  mock.onAuthStateChange.mockImplementation((fn) => { listener = fn; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("admin authentication recovery", () => {
  it("ends loading after a stalled refresh without granting cached privileges", async () => {
    localStorage.setItem("admin_session_cache", JSON.stringify({ userId: "test-admin", isAdmin: true, timestamp: Date.now() }));
    const { result } = renderHook(useAdminAuth);
    await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });
  it("does not call Supabase RPC inside the auth callback", async () => {
    const { result } = renderHook(useAdminAuth);
    act(() => { expect(listener("SIGNED_IN", session)).toBeUndefined(); });
    expect(mock.rpc).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(mock.rpc).toHaveBeenCalledTimes(1);
    expect(result.current.isAdmin).toBe(true);
  });
  it("does not restore a logged-out user from a late role check", async () => {
    let resolve: (result: unknown) => void = () => {};
    mock.rpc.mockReturnValue(new Promise(r => { resolve = r; }));
    const { result } = renderHook(useAdminAuth);
    act(() => { listener("SIGNED_IN", session); });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    act(() => { listener("SIGNED_OUT", null); });
    await act(async () => { resolve({ data: true, error: null }); });
    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });
});
