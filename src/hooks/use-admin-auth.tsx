import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const CACHE_KEY = "admin_session_cache";

interface AdminCache {
  userId: string;
  isAdmin: boolean;
  timestamp: number;
}

export type AdminSignInFailureReason =
  | "invalid_credentials"
  | "not_admin"
  | "role_check_failed"
  | "unknown";

export interface AdminSignInResult {
  error: Error | null;
  reason?: AdminSignInFailureReason;
}

function readCache(): AdminCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminCache;
  } catch {
    return null;
  }
}

function writeCache(userId: string, isAdmin: boolean) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, isAdmin, timestamp: Date.now() }));
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

export const useAdminAuth = () => {
  const cached = readCache();

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(cached?.isAdmin ?? false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminRole = useCallback(async (userId: string): Promise<boolean | null> => {
    try {
      const timeout = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 5000)
      );
      const query = supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin" as const,
      }).then((res) => res);

      const result = await Promise.race([query, timeout]);
      if (result.error) {
        console.error("checkAdminRole error:", result.error);
        return null;
      }
      return !!result.data;
    } catch (e) {
      console.error("checkAdminRole exception:", e);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Get current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (!session) {
        // Definitively no session — clear everything
        setUser(null);
        setIsAdmin(false);
        clearCache();
        setIsLoading(false);
        return;
      }

      setUser(session.user);

      // If we have a valid cache for this user, use it immediately
      const c = readCache();
      if (c && c.userId === session.user.id && c.isAdmin) {
        setIsAdmin(true);
        setIsLoading(false);
        // Background re-verify (don't reset on failure)
        const fresh = await checkAdminRole(session.user.id);
        if (mounted) {
          if (fresh) {
            writeCache(session.user.id, true);
          }
          // Only revoke if RPC explicitly returned false (not timeout/error)
          // We already set isAdmin=true from cache, keep it unless fresh === false explicitly
        }
        return;
      }

      // No cache — must verify
      const admin = await checkAdminRole(session.user.id);
      if (!mounted) return;
      setIsAdmin(admin === true);
      if (admin === true) writeCache(session.user.id, true);
      setIsLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
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
          setUser(session.user);
          // Check cache first
          const c = readCache();
          if (c && c.userId === session.user.id && c.isAdmin) {
            setIsAdmin(true);
            setIsLoading(false);
            return;
          }
          const admin = await checkAdminRole(session.user.id);
          if (!mounted) return;
          setIsAdmin(admin === true);
          if (admin === true) writeCache(session.user.id, true);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string): Promise<AdminSignInResult> => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const isInvalidCredentials =
        error.code === "invalid_credentials" ||
        /invalid login credentials/i.test(error.message);
      return {
        error,
        reason: isInvalidCredentials ? "invalid_credentials" : "unknown",
      };
    }

    if (!data.user) {
      return { error: new Error("Пользователь не получен"), reason: "unknown" };
    }

    setUser(data.user);
    const admin = await checkAdminRole(data.user.id);

    if (admin === null) {
      setIsAdmin(false);
      setIsLoading(false);
      return {
        error: new Error("Не удалось проверить права администратора"),
        reason: "role_check_failed",
      };
    }

    if (!admin) {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      clearCache();
      setIsLoading(false);
      return {
        error: new Error("У пользователя нет прав администратора"),
        reason: "not_admin",
      };
    }

    setIsAdmin(true);
    writeCache(data.user.id, true);
    setIsLoading(false);
    return { error: null };
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
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    clearCache();
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
