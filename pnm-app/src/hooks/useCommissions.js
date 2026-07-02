import { supabase } from "../lib/supabaseClient";

const SELECT_WITH_DEAL = "*, deal:player_deals(id, type, statut, player:players(id, nom, prenom), club:clubs(id, nom))";

export async function listAllCommissions() {
  const { data, error } = await supabase
    .from("deal_commissions")
    .select(SELECT_WITH_DEAL)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listCommissionsByDeal(dealId) {
  const { data, error } = await supabase
    .from("deal_commissions")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCommission(payload) {
  const { data, error } = await supabase.from("deal_commissions").insert(payload).select(SELECT_WITH_DEAL).single();
  if (error) throw error;
  return data;
}

export async function updateCommission(id, payload) {
  const { data, error } = await supabase.from("deal_commissions").update(payload).eq("id", id).select(SELECT_WITH_DEAL).single();
  if (error) throw error;
  return data;
}

export async function deleteCommission(id) {
  const { error } = await supabase.from("deal_commissions").delete().eq("id", id);
  if (error) throw error;
}
