import { supabase } from "../lib/supabaseClient";

export async function extractDocumentClauses(pdfBase64) {
  const { data, error } = await supabase.functions.invoke("extract-document-clauses", { body: { pdfBase64 } });
  if (error || data?.error) throw new Error(data?.error || error.message);
  return data;
}
