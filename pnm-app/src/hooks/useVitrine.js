import { supabase } from "../lib/supabaseClient";

// Ces appels sont utilisables sans session (pages publiques) : ils
// passent par des fonctions security definer cote base, elles-memes
// verrouillees par is_feature_enabled().
export async function isFeaturePublicEnabled(key) {
  const { data, error } = await supabase.rpc("is_feature_enabled", { p_key: key });
  if (error) return false;
  return !!data;
}

export async function getVitrineJoueurs() {
  const { data, error } = await supabase.rpc("get_vitrine_joueurs");
  if (error) throw error;
  return data ?? [];
}

export async function getVitrineBlogPosts() {
  const { data, error } = await supabase.rpc("get_vitrine_blog_posts");
  if (error) throw error;
  return data ?? [];
}
