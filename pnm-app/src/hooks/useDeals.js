import { supabase } from "../lib/supabaseClient";

const SELECT_WITH_JOINS = "*, player:players(id, nom, prenom, photo_url), club:clubs(id, nom, pays)";

export async function listAllDeals() {
  const { data, error } = await supabase
    .from("player_deals")
    .select(SELECT_WITH_JOINS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listDealsByPlayer(playerId) {
  const { data, error } = await supabase
    .from("player_deals")
    .select(SELECT_WITH_JOINS)
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listDealsByClub(clubId) {
  const { data, error } = await supabase
    .from("player_deals")
    .select(SELECT_WITH_JOINS)
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDeal(payload) {
  const { data, error } = await supabase.from("player_deals").insert(payload).select(SELECT_WITH_JOINS).single();
  if (error) throw error;
  return data;
}

export async function updateDeal(id, payload) {
  const { data, error } = await supabase.from("player_deals").update(payload).eq("id", id).select(SELECT_WITH_JOINS).single();
  if (error) throw error;
  return data;
}

export async function deleteDeal(id) {
  const { error } = await supabase.from("player_deals").delete().eq("id", id);
  if (error) throw error;
}
