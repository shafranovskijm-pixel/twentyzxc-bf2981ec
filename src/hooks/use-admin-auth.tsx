import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const checkedRef = useRef(false);

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!checkedRef.current) {
        checkedRef.current = true;
        setIsLoading(false);
      }
    }, 2000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return { user, isAdmin, isLoading, signIn, signOut };
};
