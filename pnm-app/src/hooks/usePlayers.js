import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Liste paginee/filtrable des joueurs.
 * options: { page, pageSize, search, filters, sort: { column, asc } }
 */
export function usePlayers({ page = 0, pageSize = 20, search = "", filters = {}, sort } = {}) {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from("players")
      .select("*, agent:agents!players_agent_referent_fkey(id, nom, prenom)", { count: "exact" });

    if (search?.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(
        `nom.ilike.${s},prenom.ilike.${s},club_actuel.ilike.${s},nationalite.ilike.${s},poste.ilike.${s}`
      );
    }
    if (filters.statut) q = q.eq("statut", filters.statut);
    if (filters.poste) q = q.eq("poste", filters.poste);
    if (filters.nationalite) q = q.ilike("nationalite", `%${filters.nationalite}%`);
    if (filters.club) q = q.ilike("club_actuel", `%${filters.club}%`);
    if (filters.agent_referent) q = q.eq("agent_referent", filters.agent_referent);
    if (filters.fin_contrat_avant) q = q.lte("fin_contrat", filters.fin_contrat_avant);
    if (filters.age_max) {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - filters.age_max);
      q = q.gte("date_naissance", minDate.toISOString().slice(0, 10));
    }
    if (filters.age_min) {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - filters.age_min);
      q = q.lte("date_naissance", maxDate.toISOString().slice(0, 10));
    }

    if (sort?.column) q = q.order(sort.column, { ascending: !!sort.asc });
    else q = q.order("created_at", { ascending: false });

    const from = page * pageSize;
    const to = from + pageSize - 1;
    q = q.range(from, to);

    const { data, error: err, count: c } = await q;
    if (err) setError(err);
    else { setRows(data ?? []); setCount(c ?? 0); }
    setLoading(false);
  }, [page, pageSize, search, JSON.stringify(filters), sort?.column, sort?.asc]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  return { rows, count, loading, error, refetch: fetchPlayers };
}

export async function getPlayerById(id) {
  const { data, error } = await supabase
    .from("players")
    .select("*, agent:agents!players_agent_referent_fkey(id, nom, prenom, email)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getPlayerStats(playerId) {
  const { data, error } = await supabase
    .from("player_stats")
    .select("*")
    .eq("player_id", playerId)
    .order("saison", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPlayerDocuments(playerId) {
  const { data, error } = await supabase
    .from("player_documents")
    .select("*")
    .eq("player_id", playerId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
