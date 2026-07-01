import { supabase } from "../lib/supabaseClient";
import { CLUBS } from "../lib/clubs";

// Liste des clubs = référentiel FFF ∪ clubs de joueurs ∪ clubs déjà présents
// dans l'annuaire (contact ou note ajoutée sans référentiel, ex. club étranger).
export async function listClubsDirectory() {
  const [playersRes, contactsRes, activityRes] = await Promise.all([
    supabase.from("players").select("club_actuel").not("club_actuel", "is", null),
    supabase.from("club_contacts").select("club"),
    supabase.from("club_activity").select("club"),
  ]);
  if (playersRes.error) throw playersRes.error;
  if (contactsRes.error) throw contactsRes.error;
  if (activityRes.error) throw activityRes.error;

  const playerCounts = {};
  (playersRes.data ?? []).forEach((r) => {
    const name = (r.club_actuel || "").trim();
    if (name) playerCounts[name] = (playerCounts[name] ?? 0) + 1;
  });
  const contactCounts = {};
  (contactsRes.data ?? []).forEach((r) => {
    contactCounts[r.club] = (contactCounts[r.club] ?? 0) + 1;
  });
  const activityClubs = (activityRes.data ?? []).map((r) => r.club);

  const names = new Set([...CLUBS, ...Object.keys(playerCounts), ...Object.keys(contactCounts), ...activityClubs]);

  return Array.from(names)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((name) => ({
      name,
      playerCount: playerCounts[name] ?? 0,
      contactCount: contactCounts[name] ?? 0,
    }));
}

export async function getClubContacts(club) {
  const { data, error } = await supabase.from("club_contacts").select("*").eq("club", club).order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function getClubActivity(club) {
  const { data, error } = await supabase
    .from("club_activity")
    .select("*, agent:agents(prenom, nom)")
    .eq("club", club)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getClubPlayers(club) {
  const { data, error } = await supabase
    .from("players")
    .select("id, nom, prenom, poste, photo_url, statut, recruitment_step")
    .eq("club_actuel", club)
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
