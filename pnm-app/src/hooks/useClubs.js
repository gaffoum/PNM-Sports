import { supabase } from "../lib/supabaseClient";

// Annuaire clubs — source de vérité : table public.clubs (nom unique, pays).
export async function listClubsDirectory() {
  const [clubsRes, playersRes, contactsRes] = await Promise.all([
    supabase.from("clubs").select("*").order("nom"),
    supabase.from("players").select("club_actuel").not("club_actuel", "is", null),
    supabase.from("club_contacts").select("club_id"),
  ]);
  if (clubsRes.error) throw clubsRes.error;
  if (playersRes.error) throw playersRes.error;
  if (contactsRes.error) throw contactsRes.error;

  const playerCounts = {};
  (playersRes.data ?? []).forEach((r) => {
    const name = (r.club_actuel || "").trim();
    if (name) playerCounts[name] = (playerCounts[name] ?? 0) + 1;
  });
  const contactCounts = {};
  (contactsRes.data ?? []).forEach((r) => {
    contactCounts[r.club_id] = (contactCounts[r.club_id] ?? 0) + 1;
  });

  return (clubsRes.data ?? []).map((c) => ({
    ...c,
    playerCount: playerCounts[c.nom] ?? 0,
    contactCount: contactCounts[c.id] ?? 0,
  }));
}

export async function getClubByNom(nom) {
  const { data, error } = await supabase.from("clubs").select("*").eq("nom", nom).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createClub({ nom, pays, created_by }) {
  const { data, error } = await supabase.from("clubs").insert({ nom, pays: pays || null, created_by }).select().single();
  if (error) throw error;
  return data;
}

export async function updateClub(id, { nom, pays }) {
  const { data, error } = await supabase.from("clubs").update({ nom, pays: pays || null }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClub(id) {
  const { error } = await supabase.from("clubs").delete().eq("id", id);
  if (error) throw error;
}

export async function getClubContacts(clubId) {
  const { data, error } = await supabase.from("club_contacts").select("*").eq("club_id", clubId).order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function getClubActivity(clubId) {
  const { data, error } = await supabase
    .from("club_activity")
    .select("*, agent:agents(prenom, nom)")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getClubPlayers(clubNom) {
  const { data, error } = await supabase
    .from("players")
    .select("id, nom, prenom, poste, photo_url, statut, recruitment_step")
    .eq("club_actuel", clubNom)
    .order("nom");
  if (error) throw error;
  return data ?? [];
}

export async function addClubContact(payload) {
  const { data, error } = await supabase.from("club_contacts").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClubContact(id) {
  const { error } = await supabase.from("club_contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function addClubActivity(payload) {
  const { data, error } = await supabase.from("club_activity").insert(payload).select("*, agent:agents(prenom, nom)").single();
  if (error) throw error;
  return data;
}

export async function updateClubActivity(id, note) {
  const { data, error } = await supabase
    .from("club_activity")
    .update({ note, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, agent:agents(prenom, nom)")
    .single();
  if (error) throw error;
  return data;
}
