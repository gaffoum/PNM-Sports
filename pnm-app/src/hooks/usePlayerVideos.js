import { supabase } from "../lib/supabaseClient";

export async function listVideosByPlayer(playerId) {
  const { data, error } = await supabase
    .from("player_videos")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createVideo(payload) {
  const { data, error } = await supabase.from("player_videos").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteVideo(id) {
  const { error } = await supabase.from("player_videos").delete().eq("id", id);
  if (error) throw error;
}
