import { supabase } from "../lib/supabaseClient";

export async function listPortfolioPlayers() {
  const { data, error } = await supabase
    .from("players")
    .select("id, nom, prenom, poste, club_actuel, statut, fin_contrat, valeur_estimee_eur, agent:agents(id, prenom, nom)")
    .not("valeur_estimee_eur", "is", null)
    .order("valeur_estimee_eur", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
