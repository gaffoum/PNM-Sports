import { supabase } from "../lib/supabaseClient";

export async function askLegalQuestion(question) {
  const { data, error } = await supabase.functions.invoke("legal-assistant-query", { body: { question } });
  if (error || data?.error) throw new Error(data?.error || error.message);
  return data;
}

export async function saveLegalQuery({ agent_id, question, reponse, sources }) {
  const { data, error } = await supabase.from("legal_queries").insert({ agent_id, question, reponse, sources }).select().single();
  if (error) throw error;
  return data;
}

export async function listMyLegalQueries() {
  const { data, error } = await supabase.from("legal_queries").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function deleteLegalQuery(id) {
  const { error } = await supabase.from("legal_queries").delete().eq("id", id);
  if (error) throw error;
}
