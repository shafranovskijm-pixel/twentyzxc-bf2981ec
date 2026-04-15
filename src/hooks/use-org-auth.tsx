import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const CACHE_KEY = "org_session_cache";

interface OrgCache {
  userId: string;
  isOrg: boolean;
  timestamp: number;
}

function readCache(): OrgCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OrgCache;
  } catch {
    return null;
  }
}

function writeCache(userId: string, isOrg: boolean) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, isOrg, timestamp: Date.now() }));
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

export const useOrgAuth = () => {
  const cached = readCache();
  const [user, setUser] = useState<User | null>(null);
  const [isOrg, setIsOrg] = useState(cached?.isOrg ?? false);
  const [isLoading, setIsLoading] = useState(true);

  const checkOrgRole = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const timeout = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 5000)
      );
      const query = supabase.rpc("has_role", {
        _user_id: userId,
        _role: "organization" as any,
      }).then((res) => res);

      const result = await Promise.race([query, timeout]);
      if (result.error) return false;
      return !!result.data;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (!session) {
        setUser(null);
        setIsOrg(false);
        clearCache();
        setIsLoading(false);
        return;
      }

      setUser(session.user);
      const c = readCache();
      if (c && c.userId === session.user.id && c.isOrg) {
        setIsOrg(true);
        setIsLoading(false);
        checkOrgRole(session.user.id);
        return;
      }

      const org = await checkOrgRole(session.user.id);
      if (!mounted) return;
      setIsOrg(org);
      if (org) writeCache(session.user.id, true);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === "SIGNED_OUT") {
          setUser(null);
          setIsOrg(false);
          clearCache();
          setIsLoading(false);
          return;
        }
        if (event === "TOKEN_REFRESHED") {
          if (session?.user) setUser(session.user);
          return;
        }
        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          const c = readCache();
          if (c && c.userId === session.user.id && c.isOrg) {
            setIsOrg(true);
            setIsLoading(false);
            return;
          }
          const org = await checkOrgRole(session.user.id);
          if (!mounted) return;
          setIsOrg(org);
          if (org) writeCache(session.user.id, true);
          setIsLoading(false);
        }
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [checkOrgRole]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      setUser(data.user);
      const org = await checkOrgRole(data.user.id);
      setIsOrg(org);
      if (org) writeCache(data.user.id, true);
      setIsLoading(false);
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsOrg(false);
    clearCache();
  };

  return { user, isOrg, isLoading, signIn, signOut };
};
