import { supabase } from "../lib/supabaseClient";

export async function listSources() {
  const { data, error } = await supabase.from("legal_sources").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSource(payload) {
  const { data, error } = await supabase.from("legal_sources").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateSource(id, payload) {
  const { data, error } = await supabase.from("legal_sources").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSource(id) {
  const { error } = await supabase.from("legal_sources").delete().eq("id", id);
  if (error) throw error;
}

export async function listChunksBySource(sourceId) {
  const { data, error } = await supabase.from("legal_chunks").select("*").eq("source_id", sourceId).order("ordre");
  if (error) throw error;
  return data ?? [];
}

export async function bulkCreateChunks(sourceId, extraits) {
  const rows = extraits.map((e, i) => ({ source_id: sourceId, reference: e.reference || null, contenu: e.contenu, ordre: i }));
  const { data, error } = await supabase.from("legal_chunks").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

export async function deleteChunk(id) {
  const { error } = await supabase.from("legal_chunks").delete().eq("id", id);
  if (error) throw error;
}
