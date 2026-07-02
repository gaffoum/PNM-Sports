import { supabase } from "../lib/supabaseClient";

export async function listInteractionsByPlayer(playerId) {
  const { data, error } = await supabase
    .from("player_interactions")
    .select("*, agent:agents(prenom, nom)")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createInteraction(payload) {
  const { data, error } = await supabase
    .from("player_interactions")
    .insert(payload)
    .select("*, agent:agents(prenom, nom)")
    .single();
  if (error) throw error;
  return data;
}

export async function updateInteraction(id, note) {
  const { data, error } = await supabase
    .from("player_interactions")
    .update({ note, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, agent:agents(prenom, nom)")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInteraction(id) {
  const { error } = await supabase.from("player_interactions").delete().eq("id", id);
  if (error) throw error;
}
