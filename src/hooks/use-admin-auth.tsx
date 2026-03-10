import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const checkedRef = useRef(false);
  const signInActiveRef = useRef(false);

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (error) {
        console.error("checkAdminRole error:", error);
        return false;
      }
      return !!data;
    } catch (e) {
      console.error("checkAdminRole exception:", e);
      return false;
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!checkedRef.current) {
        checkedRef.current = true;
        setIsLoading(false);
      }
    }, 1000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Skip duplicate check if signIn already handled it
        if (signInActiveRef.current) {
          signInActiveRef.current = false;
          return;
        }
        setUser(session?.user ?? null);

        if (session?.user) {
          const admin = await checkAdminRole(session.user.id);
          setIsAdmin(admin);
        } else {
          setIsAdmin(false);
        }
        checkedRef.current = true;
        setIsLoading(false);
      }
    );

    // Eagerly resolve if no session exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !checkedRef.current) {
        checkedRef.current = true;
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string) => {
    signInActiveRef.current = true;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      setUser(data.user);
      const admin = await checkAdminRole(data.user.id);
      setIsAdmin(admin);
      checkedRef.current = true;
      setIsLoading(false);
    } else {
      signInActiveRef.current = false;
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return { user, isAdmin, isLoading, signIn, signOut };
};
