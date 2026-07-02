import { supabase } from "../lib/supabaseClient";

export async function listRgpdRequests() {
  const { data, error } = await supabase
    .from("rgpd_requests")
    .select("*, player:players(id, nom, prenom)")
    .order("date_reception", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRgpdRequest(payload) {
  const { data, error } = await supabase.from("rgpd_requests").insert(payload).select("*, player:players(id, nom, prenom)").single();
  if (error) throw error;
  return data;
}

export async function updateRgpdRequest(id, payload) {
  const { data, error } = await supabase.from("rgpd_requests").update(payload).eq("id", id).select("*, player:players(id, nom, prenom)").single();
  if (error) throw error;
  return data;
}

export async function deleteRgpdRequest(id) {
  const { error } = await supabase.from("rgpd_requests").delete().eq("id", id);
  if (error) throw error;
}
