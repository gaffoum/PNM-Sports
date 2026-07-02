import { supabase } from "../lib/supabaseClient";

const SELECT_WITH_CLUB = "*, club:clubs(id, nom)";

export async function listContractsByPlayer(playerId) {
  const { data, error } = await supabase
    .from("player_contracts")
    .select(SELECT_WITH_CLUB)
    .eq("player_id", playerId)
    .order("date_debut", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createContract(payload) {
  const { data, error } = await supabase.from("player_contracts").insert(payload).select(SELECT_WITH_CLUB).single();
  if (error) throw error;
  return data;
}

export async function updateContract(id, payload) {
  const { data, error } = await supabase.from("player_contracts").update(payload).eq("id", id).select(SELECT_WITH_CLUB).single();
  if (error) throw error;
  return data;
}

export async function deleteContract(id) {
  const { error } = await supabase.from("player_contracts").delete().eq("id", id);
  if (error) throw error;
}
