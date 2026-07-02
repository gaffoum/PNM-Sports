import { supabase } from "../lib/supabaseClient";

const SELECT_WITH_PLAYER = "*, player:players(id, nom, prenom, photo_url)";

export async function listAppointmentsByPlayer(playerId) {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("player_id", playerId)
    .order("date_rdv", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listAllAppointments() {
  const { data, error } = await supabase
    .from("appointments")
    .select(SELECT_WITH_PLAYER)
    .order("date_rdv", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createAppointment(payload) {
  const { data, error } = await supabase.from("appointments").insert(payload).select(SELECT_WITH_PLAYER).single();
  if (error) throw error;
  return data;
}

export async function updateAppointment(id, payload) {
  const { data, error } = await supabase.from("appointments").update(payload).eq("id", id).select(SELECT_WITH_PLAYER).single();
  if (error) throw error;
  return data;
}

export async function deleteAppointment(id) {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
}
