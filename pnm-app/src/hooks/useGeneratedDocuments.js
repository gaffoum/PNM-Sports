import { supabase } from "../lib/supabaseClient";

const SELECT = "*, player:players(id, nom, prenom), club:clubs(id, nom)";

export async function listGeneratedDocuments() {
  const { data, error } = await supabase.from("generated_documents").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listGeneratedDocumentsByPlayer(playerId) {
  const { data, error } = await supabase.from("generated_documents").select(SELECT).eq("player_id", playerId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGeneratedDocument(payload) {
  const { data, error } = await supabase.from("generated_documents").insert(payload).select(SELECT).single();
  if (error) throw error;
  return data;
}

export async function updateGeneratedDocument(id, payload) {
  const { data, error } = await supabase.from("generated_documents").update(payload).eq("id", id).select(SELECT).single();
  if (error) throw error;
  return data;
}

export async function deleteGeneratedDocument(id) {
  const { error } = await supabase.from("generated_documents").delete().eq("id", id);
  if (error) throw error;
}
