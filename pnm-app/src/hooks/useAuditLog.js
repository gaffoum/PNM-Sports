import { supabase } from "../lib/supabaseClient";

const SELECT_WITH_ACTOR = "*, actor:agents!audit_log_actor_id_fkey(id, nom, prenom, email)";
const PAGE_SIZE = 50;

export async function listAuditLog({ tableName = "", action = "", page = 0 } = {}) {
  let query = supabase
    .from("audit_log")
    .select(SELECT_WITH_ACTOR)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (tableName) query = query.eq("table_name", tableName);
  if (action) query = query.eq("action", action);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export { PAGE_SIZE };
