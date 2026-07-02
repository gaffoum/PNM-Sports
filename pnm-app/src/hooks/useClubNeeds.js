import { supabase } from "../lib/supabaseClient";

const SELECT_WITH_CLUB = "*, club:clubs(id, nom, pays)";

export async function listAllNeeds() {
  const { data, error } = await supabase
    .from("club_needs")
    .select(SELECT_WITH_CLUB)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listNeedsByClub(clubId) {
  const { data, error } = await supabase
    .from("club_needs")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createNeed(payload) {
  const { data, error } = await supabase.from("club_needs").insert(payload).select(SELECT_WITH_CLUB).single();
  if (error) throw error;
  return data;
}

export async function updateNeed(id, payload) {
  const { data, error } = await supabase.from("club_needs").update(payload).eq("id", id).select(SELECT_WITH_CLUB).single();
  if (error) throw error;
  return data;
}

export async function deleteNeed(id) {
  const { error } = await supabase.from("club_needs").delete().eq("id", id);
  if (error) throw error;
}
