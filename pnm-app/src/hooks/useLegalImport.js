import { supabase } from "../lib/supabaseClient";

export async function extractLegalChunks(pdfBase64) {
  const { data, error } = await supabase.functions.invoke("extract-legal-chunks", { body: { pdfBase64 } });
  if (error || data?.error) throw new Error(data?.error || error.message);
  return data;
}
