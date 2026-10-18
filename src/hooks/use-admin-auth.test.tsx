import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn(), rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: mock, rpc: mock.rpc } }));
import { useAdminAuth } from "./use-admin-auth";

let listener: (event: string, session: unknown) => unknown;
const session = { user: { id: "test-admin" } };
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  mock.getSession.mockReset().mockReturnValue(new Promise(() => {}));
  mock.rpc.mockReset().mockResolvedValue({ data: true, error: null });
  mock.signInWithPassword.mockReset().mockResolvedValue({ data: { user: session.user, session }, error: null });
  mock.signOut.mockReset().mockResolvedValue({ error: null });
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

  it("never grants access from a local admin cache before a successful role RPC", async () => {
    localStorage.setItem("admin_session_cache", JSON.stringify({ userId: "test-admin", isAdmin: true, timestamp: Date.now() }));
    mock.getSession.mockResolvedValue({ data: { session }, error: null });
    mock.rpc.mockResolvedValue({ data: false, error: null });
    const { result } = renderHook(useAdminAuth);
    expect(result.current.isAdmin).toBe(false);
    await act(async () => {});
    expect(mock.rpc).toHaveBeenCalledWith("has_role", { _user_id: "test-admin", _role: "admin" });
    expect(result.current.isAdmin).toBe(false);
  });

  it("returns a useful result after a stalled password request within 15 seconds", async () => {
    mock.signInWithPassword.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(useAdminAuth);
    let pending: ReturnType<typeof result.current.signIn>;
    await act(async () => { pending = result.current.signIn("  Admin@Example.Test  ", "test-password"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    expect((await pending!).reason).toBe("request_timeout");
    expect(result.current.isAdmin).toBe(false);
    expect(mock.rpc).not.toHaveBeenCalled();
    expect(mock.signInWithPassword).toHaveBeenCalledWith({ email: "admin@example.test", password: "test-password" });
  });

  it("bounds a stalled role check at 12 seconds without granting access or retrying indefinitely", async () => {
    mock.rpc.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(useAdminAuth);
    let pending: ReturnType<typeof result.current.signIn>;
    await act(async () => { pending = result.current.signIn("admin@example.test", "test-password"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(12000); });
    expect((await pending!).reason).toBe("role_check_failed");
    expect(result.current.isAdmin).toBe(false);
    expect(mock.rpc).toHaveBeenCalledTimes(1);
  });

  it("shares one in-flight role check between the password request and SIGNED_IN listener", async () => {
    let resolve: (value: unknown) => void = () => {};
    mock.rpc.mockReturnValue(new Promise(r => { resolve = r; }));
    mock.signInWithPassword.mockImplementation(async () => {
      listener("SIGNED_IN", session);
      return { data: { user: session.user, session }, error: null };
    });
    const { result } = renderHook(useAdminAuth);
    let pending: ReturnType<typeof result.current.signIn>;
    await act(async () => { pending = result.current.signIn("admin@example.test", "test-password"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(mock.rpc).toHaveBeenCalledTimes(1);
    await act(async () => { resolve({ data: true, error: null }); await pending!; });
    expect((await pending!).error).toBeNull();
    expect(result.current.isAdmin).toBe(true);
  });

  it("reports invalid credentials separately and does not check a nonexistent session", async () => {
    mock.signInWithPassword.mockResolvedValue({ data: {}, error: { code: "invalid_credentials", message: "Invalid login credentials" } });
    const { result } = renderHook(useAdminAuth);
    let outcome: Awaited<ReturnType<typeof result.current.signIn>> | undefined;
    await act(async () => { outcome = await result.current.signIn("admin@example.test", "test-password"); });
    expect(outcome?.reason).toBe("invalid_credentials");
    expect(result.current.isAdmin).toBe(false);
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it("reports a server outage separately from a wrong password", async () => {
    mock.signInWithPassword.mockResolvedValue({ data: {}, error: { status: 503, code: "unexpected_failure", message: "Service unavailable" } });
    const { result } = renderHook(useAdminAuth);
    let outcome: Awaited<ReturnType<typeof result.current.signIn>> | undefined;
    await act(async () => { outcome = await result.current.signIn("admin@example.test", "test-password"); });
    expect(outcome?.reason).toBe("service_unavailable");
    expect(result.current.isAdmin).toBe(false);
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it("denies an authenticated user when the role RPC fails or returns a non-boolean value", async () => {
    for (const response of [{ data: null, error: { message: "unavailable" } }, { data: "true", error: null }]) {
      mock.rpc.mockResolvedValue(response);
      const { result, unmount } = renderHook(useAdminAuth);
      let outcome: Awaited<ReturnType<typeof result.current.signIn>> | undefined;
      await act(async () => { outcome = await result.current.signIn("admin@example.test", "test-password"); });
      expect(outcome?.error).not.toBeNull();
      expect(result.current.isAdmin).toBe(false);
      unmount();
    }
  });

  it("does not let optional UI cache storage errors break a remotely verified login", async () => {
    const denied = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    const { result } = renderHook(useAdminAuth);
    let outcome: Awaited<ReturnType<typeof result.current.signIn>> | undefined;
    await act(async () => { outcome = await result.current.signIn("admin@example.test", "test-password"); });
    expect(outcome?.error).toBeNull();
    expect(result.current.isAdmin).toBe(true);
    denied.mockRestore();
  });

  it("does not reopen access if sign-out happens while the explicit login role check is pending", async () => {
    let resolve: (value: unknown) => void = () => {};
    mock.rpc.mockReturnValue(new Promise(r => { resolve = r; }));
    const { result } = renderHook(useAdminAuth);
    let pending: ReturnType<typeof result.current.signIn>;
    await act(async () => { pending = result.current.signIn("admin@example.test", "test-password"); });
    act(() => { listener("SIGNED_OUT", null); });
    await act(async () => { resolve({ data: true, error: null }); await pending!; });
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.user).toBeNull();
    expect((await pending!).error).not.toBeNull();
  });

  it("closes local access even if the browser refuses to clear optional cache metadata", async () => {
    const denied = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    const { result } = renderHook(useAdminAuth);
    act(() => { expect(() => listener("SIGNED_OUT", null)).not.toThrow(); });
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    denied.mockRestore();
  });
});
