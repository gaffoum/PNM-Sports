import { supabase } from "../lib/supabaseClient";

export async function listMySavedSearches() {
  const { data, error } = await supabase.from("saved_searches").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSavedSearch({ agent_id, nom, search, filters }) {
  const { data, error } = await supabase.from("saved_searches").insert({ agent_id, nom, search: search || null, filters: filters ?? {} }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSavedSearch(id) {
  const { error } = await supabase.from("saved_searches").delete().eq("id", id);
  if (error) throw error;
}
