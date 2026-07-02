import { supabase } from "../lib/supabaseClient";

export async function listEvaluationsByPlayer(playerId) {
  const { data, error } = await supabase
    .from("player_evaluations")
    .select("*, agent:agents(prenom, nom)")
    .eq("player_id", playerId)
    .order("date_evaluation", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEvaluation(payload) {
  const { data, error } = await supabase
    .from("player_evaluations")
    .insert(payload)
    .select("*, agent:agents(prenom, nom)")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvaluation(id) {
  const { error } = await supabase.from("player_evaluations").delete().eq("id", id);
  if (error) throw error;
}
