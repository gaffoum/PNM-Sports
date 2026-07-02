import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { APP_DICT } from "../lib/appI18n";

export const LanguageContext = createContext(null);

// Préférence persistée sur agents.langue (suit l'agent d'un appareil à
// l'autre), écrite via la fonction update_my_langue() (security definer —
// la table agents n'est pas self-updatable en RLS pour éviter qu'un
// agent modifie son propre role/permissions).
export function LanguageProvider({ children }) {
  const { agent } = useAuth();
  const [lang, setLangState] = useState("fr");

  useEffect(() => {
    if (agent?.langue) setLangState(agent.langue);
  }, [agent?.langue]);

  const setLang = useCallback(async (l) => {
    if (!APP_DICT[l]) return;
    setLangState(l);
    if (agent) {
      const { error } = await supabase.rpc("update_my_langue", { p_langue: l });
      if (error) console.warn("update_my_langue:", error.message);
    }
  }, [agent]);

  const t = useCallback((key) => APP_DICT[lang]?.[key] ?? APP_DICT.fr[key] ?? key, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
