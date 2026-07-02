import { supabase } from "../lib/supabaseClient";

export async function listAllPosts() {
  const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function slugify(titre) {
  return titre
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createPost(payload) {
  const slug = payload.slug?.trim() || slugify(payload.titre);
  const { data, error } = await supabase.from("blog_posts").insert({ ...payload, slug }).select().single();
  if (error) throw error;
  return data;
}

export async function updatePost(id, payload) {
  const { data, error } = await supabase.from("blog_posts").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePost(id) {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
}
