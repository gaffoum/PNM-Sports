import { supabase } from "./supabaseClient";

export async function logActivity(agentId, playerId, action, details = null) {
  if (!agentId) return;
  try {
    await supabase.from("activity_log").insert({
      agent_id: agentId,
      player_id: playerId,
      action,
      details,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("activity_log:", e?.message);
  }
}
