import { supabase } from "../lib/supabaseClient";

export async function listTemplates() {
  const { data, error } = await supabase.from("document_templates").select("*").order("type");
  if (error) throw error;
  return data ?? [];
}

export async function getTemplateByType(type) {
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("type", type)
    .eq("actif", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTemplate(payload) {
  const { data, error } = await supabase.from("document_templates").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateTemplate(id, payload) {
  const { data, error } = await supabase.from("document_templates").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(id) {
  const { error } = await supabase.from("document_templates").delete().eq("id", id);
  if (error) throw error;
}
