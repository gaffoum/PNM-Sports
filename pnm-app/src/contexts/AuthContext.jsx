import { createContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAgent = useCallback(async (userId) => {
    if (!userId) { setAgent(null); return; }
    const { data, error } = await supabase
      .from("agents")
      .select("id, nom, prenom, email, role, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("loadAgent:", error.message);
      setAgent(null);
      return;
    }
    setAgent(data);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadAgent(data.session?.user?.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      loadAgent(s?.user?.id);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadAgent]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    agent,
    isAdmin: agent?.role === "admin",
    isAuthenticated: !!session,
    loading,
    signIn,
    signOut,
    resetPassword,
  }), [session, agent, loading, signIn, signOut, resetPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
