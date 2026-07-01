import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

export const FeatureContext = createContext(null);

export function FeatureProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("features").select("*");
    if (error) {
      // Table absente (migration 0005 pas encore appliquée) : aucune brique active.
      // eslint-disable-next-line no-console
      console.warn("features:", error.message);
      setRows([]);
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const enabledKeys = useMemo(
    () => new Set(rows.filter((r) => r.enabled).map((r) => r.key)),
    [rows]
  );

  const value = useMemo(() => ({
    features: rows,
    loading,
    hasFeature: (key) => enabledKeys.has(key),
    refreshFeatures: load,
  }), [rows, loading, enabledKeys, load]);

  return <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>;
}
