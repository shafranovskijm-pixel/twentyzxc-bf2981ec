import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AdminAuthTimeoutError, withAdminAuthTimeout } from "@/lib/admin-auth-timeout";

const CACHE_KEY = "admin_session_cache";

export type AdminSignInFailureReason =
  | "invalid_credentials"
  | "not_admin"
  | "role_check_failed"
  | "request_timeout"
  | "service_unavailable"
  | "unknown";

export interface AdminSignInResult {
  error: Error | null;
  reason?: AdminSignInFailureReason;
}

function writeCache(userId: string, isAdmin: boolean) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, isAdmin, timestamp: Date.now() }));
  } catch { /* Optional UI metadata must not prevent a verified login. */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* Browser persistence is optional. */ }
}

export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const roleChecks = useRef(new Map<string, Promise<boolean | null>>());
  const authRevision = useRef(0);

  const checkAdminRole = useCallback((userId: string): Promise<boolean | null> => {
    const existing = roleChecks.current.get(userId);
    if (existing) return existing;
    // SIGNED_IN and the login form share the same bounded verification.
    const check = (async (): Promise<boolean | null> => {
      try {
        const result = await withAdminAuthTimeout(supabase.rpc("has_role", {
          _user_id: userId,
          _role: "admin" as const,
        }).then(res => res), 12000);
        if (result.error) return null;
        return result.data === true;
      } catch {
        return null;
      }
    })().finally(() => {
      if (roleChecks.current.get(userId) === check) roleChecks.current.delete(userId);
    });
    roleChecks.current.set(userId, check);
    return check;
  }, []);

  useEffect(() => {
    let mounted = true;
    const deferred = new Set<ReturnType<typeof setTimeout>>();
    const initialRevision = authRevision.current;
    // A failed refresh must not leave the whole admin page behind an endless spinner.
    const initializationTimeout = setTimeout(() => {
      if (mounted && initialRevision === authRevision.current) {
        setIsAdmin(false);
        setIsLoading(false);
      }
    }, 15000);

    // 1. Get current session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted || initialRevision !== authRevision.current) return;
      if (error) throw error;
      const revision = authRevision.current;

      if (!session) {
        // Definitively no session — clear everything
        setUser(null);
        setIsAdmin(false);
        clearCache();
        setIsLoading(false);
        return;
      }

      setUser(session.user);

      // A local cache is UI metadata, never evidence of administrator access.
      const admin = await checkAdminRole(session.user.id);
      if (!mounted || revision !== authRevision.current) return;
      setIsAdmin(admin === true);
      if (admin === true) writeCache(session.user.id, true);
      setIsLoading(false);
    }).catch((error) => {
      console.error("Admin session initialization failed", error);
      if (mounted && initialRevision === authRevision.current) {
        setIsAdmin(false);
        setIsLoading(false);
      }
    }).finally(() => clearTimeout(initializationTimeout));

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          authRevision.current++;
          roleChecks.current.clear();
          clearTimeout(initializationTimeout);
          setUser(null);
          setIsAdmin(false);
          clearCache();
          setIsLoading(false);
          return;
        }

        // TOKEN_REFRESHED — keep existing state, don't re-check
        if (event === "TOKEN_REFRESHED") {
          if (session?.user) setUser(session.user);
          return;
        }

        if (event === "SIGNED_IN" && session?.user) {
          const revision = ++authRevision.current;
          clearTimeout(initializationTimeout);
          setUser(session.user);
          setIsAdmin(false);
          // Supabase holds its auth lock while notifying listeners. Do not await
          // another Supabase request inside that listener (it can deadlock).
          const timer = setTimeout(async () => {
            deferred.delete(timer);
            const admin = await checkAdminRole(session.user.id);
            if (!mounted || revision !== authRevision.current) return;
            setIsAdmin(admin === true);
            if (admin === true) writeCache(session.user.id, true);
            setIsLoading(false);
          }, 0);
          deferred.add(timer);
        }
      }
    );

    return () => {
      mounted = false;
      authRevision.current++;
      roleChecks.current.clear();
      clearTimeout(initializationTimeout);
      for (const timer of deferred) clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string): Promise<AdminSignInResult> => {
    authRevision.current++;
    setIsAdmin(false);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await withAdminAuthTimeout(supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      }), 15000);

      if (error) {
        const isInvalidCredentials =
          error.code === "invalid_credentials" ||
          /invalid login credentials/i.test(error.message);
        const isServiceUnavailable = typeof error.status === "number" && error.status >= 500;
        return {
          error,
          reason: isInvalidCredentials ? "invalid_credentials" : isServiceUnavailable ? "service_unavailable" : "unknown",
        };
      }

      if (!data.user || !data.session) {
        return { error: new Error("Сессия не получена"), reason: "unknown" };
      }

      const revision = authRevision.current;
      setUser(data.user);
      const admin = await checkAdminRole(data.user.id);
      if (revision !== authRevision.current || admin === null) {
        if (revision === authRevision.current) setIsAdmin(false);
        return {
          error: new Error("Не удалось проверить права администратора"),
          reason: "role_check_failed",
        };
      }

      if (!admin) {
        setUser(null);
        setIsAdmin(false);
        clearCache();
        try { await withAdminAuthTimeout(supabase.auth.signOut(), 5000); } catch { /* Access remains denied. */ }
        return {
          error: new Error("У пользователя нет прав администратора"),
          reason: "not_admin",
        };
      }

      setIsAdmin(true);
      writeCache(data.user.id, true);
      return { error: null };
    } catch (error) {
      setIsAdmin(false);
      return {
        error: error instanceof Error ? error : new Error("Не удалось выполнить вход"),
        reason: error instanceof AdminAuthTimeoutError ? "request_timeout" : "unknown",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { error: new Error("Укажите email") };
    }

    const redirectTo = `${window.location.origin}/admin?reset-password=1`;
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const signOut = async () => {
    authRevision.current++;
    roleChecks.current.clear();
    setUser(null);
    setIsAdmin(false);
    clearCache();
    try { await withAdminAuthTimeout(supabase.auth.signOut(), 5000); } catch { /* Local access is already closed. */ }
  };

  return {
    user,
    isAdmin,
    isLoading,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
  };
};
