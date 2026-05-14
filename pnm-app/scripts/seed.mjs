// Seed de 20 joueurs fictifs pour les demos.
// Idempotent : supprime tous les enregistrements marques [FICTIF-SEED]
// avant de re-inserer. Tous sont rattaches au compte admin ADMIN_EMAIL.
//
// Usage : npm run seed

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "..", ".env.local") });

const { VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL } = process.env;
if (!VITE_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Variables d'env manquantes. Voir .env.example.");
  process.exit(1);
}

const admin = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MARKER = "[FICTIF-SEED]";
const today = new Date();
const ymd = (d) => d.toISOString().slice(0, 10);
const addYears = (years) => { const d = new Date(today); d.setFullYear(d.getFullYear() + years); return ymd(d); };
const addMonths = (months) => { const d = new Date(today); d.setMonth(d.getMonth() + months); return ymd(d); };
const birthYearsAgo = (n) => { const d = new Date(today); d.setFullYear(d.getFullYear() - n); d.setMonth(Math.floor(Math.random() * 12)); d.setDate(Math.floor(Math.random() * 28) + 1); return ymd(d); };
const avatar = (seed) => `https://i.pravatar.cc/200?img=${seed}`;

const players = [
  { prenom: "Mehdi",   nom: "Ben Arfa",      nationalite: "Tunisie",        poste: "Milieu",       pied_fort: "gauche", taille_cm: 178, poids_kg: 72, club_actuel: "OGC Nice",        club_precedent: "Bastia",          fin_contrat: addMonths(8),  valeur_estimee_eur: 4_500_000,  statut: "joueur",   photo: 1,  telephone: "+33 6 12 34 56 01", email: "m.benarfa@example.com" },
  { prenom: "Lucas",   nom: "Moreno",        nationalite: "Espagne",        poste: "Attaquant",    pied_fort: "droit",  taille_cm: 184, poids_kg: 79, club_actuel: "Stade de Reims",  club_precedent: "Villarreal B",    fin_contrat: addYears(2),   valeur_estimee_eur: 8_200_000,  statut: "joueur",   photo: 3,  telephone: "+33 6 12 34 56 02", email: "l.moreno@example.com" },
  { prenom: "Yannis",  nom: "Diallo",        nationalite: "Sénégal",        poste: "Défenseur",    pied_fort: "droit",  taille_cm: 191, poids_kg: 84, club_actuel: "Stade Brestois",  club_precedent: "AS Pikine",       fin_contrat: addMonths(4),  valeur_estimee_eur: 6_000_000,  statut: "joueur",   photo: 7,  telephone: "+33 6 12 34 56 03", email: "y.diallo@example.com" },
  { prenom: "Ilyes",   nom: "Boudjellal",    nationalite: "Algérie",        poste: "Ailier",       pied_fort: "gauche", taille_cm: 174, poids_kg: 68, club_actuel: null,              club_precedent: "Paradou AC",      fin_contrat: null,           valeur_estimee_eur: 1_200_000,  statut: "prospect", photo: 11, telephone: "+213 555 23 45 11", email: "i.boudjellal@example.com" },
  { prenom: "Camille", nom: "Roussel",       nationalite: "France",         poste: "Gardien",      pied_fort: "droit",  taille_cm: 193, poids_kg: 88, club_actuel: "Le Havre AC",     club_precedent: "Quevilly",        fin_contrat: addMonths(3),  valeur_estimee_eur: 2_800_000,  statut: "joueur",   photo: 13, telephone: "+33 6 12 34 56 05", email: "c.roussel@example.com" },
  { prenom: "Joao",    nom: "Pereira",       nationalite: "Portugal",       poste: "Latéral",      pied_fort: "droit",  taille_cm: 180, poids_kg: 74, club_actuel: "Vitória Guimarães", club_precedent: "Famalicão",     fin_contrat: addYears(1),   valeur_estimee_eur: 3_400_000,  statut: "joueur",   photo: 15, telephone: "+351 91 234 56 17", email: "j.pereira@example.com" },
  { prenom: "Anas",    nom: "Belghazi",      nationalite: "Maroc",          poste: "Milieu",       pied_fort: "droit",  taille_cm: 176, poids_kg: 70, club_actuel: "Wydad Casablanca",club_precedent: "Académie Mohammed VI", fin_contrat: addMonths(11), valeur_estimee_eur: 2_100_000,  statut: "prospect", photo: 22, telephone: "+212 661 12 34 56", email: "a.belghazi@example.com" },
  { prenom: "Tiago",   nom: "Da Silva",      nationalite: "Brésil",         poste: "Attaquant",    pied_fort: "gauche", taille_cm: 182, poids_kg: 77, club_actuel: "FC Lorient",      club_precedent: "Vasco da Gama",   fin_contrat: addYears(3),   valeur_estimee_eur: 12_000_000, statut: "joueur",   photo: 33, telephone: "+33 6 12 34 56 08", email: "t.dasilva@example.com" },
  { prenom: "Mateo",   nom: "Ferrari",       nationalite: "Italie",         poste: "Défenseur",    pied_fort: "droit",  taille_cm: 188, poids_kg: 82, club_actuel: "AC Monza",        club_precedent: "Sassuolo U19",    fin_contrat: addYears(2),   valeur_estimee_eur: 5_500_000,  statut: "joueur",   photo: 12, telephone: "+39 333 1234 567",  email: "m.ferrari@example.com" },
  { prenom: "Jules",   nom: "Lefebvre",      nationalite: "France",         poste: "Milieu",       pied_fort: "ambidextre", taille_cm: 179, poids_kg: 73, club_actuel: "Toulouse FC",     club_precedent: "TFC U19",         fin_contrat: addMonths(2),  valeur_estimee_eur: 3_900_000,  statut: "joueur",   photo: 14, telephone: "+33 6 12 34 56 10", email: "j.lefebvre@example.com" },
  { prenom: "Ousmane",  nom: "Konaté",       nationalite: "Mali",           poste: "Attaquant",    pied_fort: "droit",  taille_cm: 187, poids_kg: 80, club_actuel: null,              club_precedent: "Stade Malien",     fin_contrat: null,           valeur_estimee_eur: 800_000,    statut: "prospect", photo: 8,  telephone: "+223 76 12 34 56",  email: "o.konate@example.com" },
  { prenom: "Adam",    nom: "Schneider",     nationalite: "Allemagne",      poste: "Latéral",      pied_fort: "gauche", taille_cm: 181, poids_kg: 75, club_actuel: "FC Augsburg",     club_precedent: "Bayern II",       fin_contrat: addYears(1),   valeur_estimee_eur: 4_100_000,  statut: "joueur",   photo: 17, telephone: "+49 151 1234 5678", email: "a.schneider@example.com" },
  { prenom: "Nathan",  nom: "Verstappen",    nationalite: "Pays-Bas",       poste: "Milieu",       pied_fort: "droit",  taille_cm: 183, poids_kg: 76, club_actuel: "AZ Alkmaar",      club_precedent: "Ajax U21",        fin_contrat: addMonths(9),  valeur_estimee_eur: 7_300_000,  statut: "joueur",   photo: 18, telephone: "+31 6 12 34 56 78", email: "n.verstappen@example.com" },
  { prenom: "Liam",    nom: "Thompson",      nationalite: "USA",            poste: "Ailier",       pied_fort: "droit",  taille_cm: 177, poids_kg: 71, club_actuel: null,              club_precedent: "Philadelphia U.", fin_contrat: null,           valeur_estimee_eur: 600_000,    statut: "prospect", photo: 60, telephone: "+1 215 555 0123",   email: "l.thompson@example.com" },
  { prenom: "Karim",   nom: "Hadj-Sadok",    nationalite: "Algérie",        poste: "Attaquant",    pied_fort: "droit",  taille_cm: 185, poids_kg: 78, club_actuel: "RC Lens",         club_precedent: "USM Alger",       fin_contrat: addMonths(5),  valeur_estimee_eur: 9_500_000,  statut: "joueur",   photo: 51, telephone: "+33 6 12 34 56 15", email: "k.hadjsadok@example.com" },
  { prenom: "Romain",  nom: "Caron",         nationalite: "France",         poste: "Défenseur",    pied_fort: "droit",  taille_cm: 186, poids_kg: 81, club_actuel: "Angers SCO",      club_precedent: "Angers U19",      fin_contrat: addYears(2),   valeur_estimee_eur: 2_300_000,  statut: "joueur",   photo: 52, telephone: "+33 6 12 34 56 16", email: "r.caron@example.com" },
  { prenom: "Saliou",  nom: "N'Diaye",       nationalite: "Côte d'Ivoire",  poste: "Milieu",       pied_fort: "droit",  taille_cm: 180, poids_kg: 75, club_actuel: null,              club_precedent: "ASEC Mimosas",    fin_contrat: null,           valeur_estimee_eur: 1_100_000,  statut: "prospect", photo: 53, telephone: "+225 07 12 34 56",  email: "s.ndiaye@example.com" },
  { prenom: "Thiago",  nom: "Romero",        nationalite: "Argentine",      poste: "Attaquant",    pied_fort: "gauche", taille_cm: 178, poids_kg: 72, club_actuel: "Boca Juniors",    club_precedent: "Boca Reserva",    fin_contrat: addYears(1),   valeur_estimee_eur: 14_500_000, statut: "prospect", photo: 54, telephone: "+54 11 1234 5678",  email: "t.romero@example.com" },
  { prenom: "Hugo",    nom: "Mercier",       nationalite: "Belgique",       poste: "Gardien",      pied_fort: "droit",  taille_cm: 195, poids_kg: 90, club_actuel: "KV Mechelen",     club_precedent: "Standard B",      fin_contrat: addMonths(7),  valeur_estimee_eur: 3_200_000,  statut: "joueur",   photo: 56, telephone: "+32 470 12 34 56",  email: "h.mercier@example.com" },
  { prenom: "Ayoub",   nom: "El Idrissi",    nationalite: "Maroc",          poste: "Ailier",       pied_fort: "gauche", taille_cm: 175, poids_kg: 69, club_actuel: null,              club_precedent: "FAR Rabat U21",   fin_contrat: null,           valeur_estimee_eur: 450_000,    statut: "prospect", photo: 59, telephone: "+212 661 98 76 54", email: "a.elidrissi@example.com" },
];

// Quelques stats par joueur (selon le statut / age)
function statsFor(player) {
  const result = [];
  if (player.statut === "joueur") {
    result.push({ saison: "2024/2025", matchs: 28 + Math.floor(Math.random() * 8), buts: player.poste === "Gardien" ? 0 : Math.floor(Math.random() * 12), passes: Math.floor(Math.random() * 8), minutes_jouees: 1800 + Math.floor(Math.random() * 1200) });
    result.push({ saison: "2025/2026", matchs: 10 + Math.floor(Math.random() * 6), buts: player.poste === "Gardien" ? 0 : Math.floor(Math.random() * 5), passes: Math.floor(Math.random() * 4), minutes_jouees: 700 + Math.floor(Math.random() * 600) });
  } else if (Math.random() > 0.4) {
    result.push({ saison: "2024/2025", matchs: 18 + Math.floor(Math.random() * 8), buts: player.poste === "Gardien" ? 0 : Math.floor(Math.random() * 10), passes: Math.floor(Math.random() * 6), minutes_jouees: 1200 + Math.floor(Math.random() * 600) });
  }
  return result;
}

async function getAdminId() {
  const email = ADMIN_EMAIL ?? "gaffoum@gmail.com";
  const { data, error } = await admin.from("agents").select("id").eq("email", email).single();
  if (error) throw error;
  return data.id;
}

async function purgeOld() {
  console.log(`[SEED] Purge des fiches contenant "${MARKER}"...`);
  const { data, error } = await admin.from("players").select("id, photo_url").like("notes", `%${MARKER}%`);
  if (error) throw error;
  if (!data?.length) { console.log("[SEED] Aucune fiche fictive prealable."); return; }
  // Photos pravatar sont externes -> rien a nettoyer en Storage.
  const ids = data.map((d) => d.id);
  const { error: delErr } = await admin.from("players").delete().in("id", ids);
  if (delErr) throw delErr;
  console.log(`[SEED] ${ids.length} anciennes fiches supprimees.`);
}

async function seed() {
  const adminId = await getAdminId();
  console.log("[SEED] Admin id :", adminId);
  await purgeOld();

  const ages = [22, 26, 24, 18, 27, 23, 19, 21, 20, 22, 17, 25, 21, 18, 26, 24, 19, 20, 28, 18];

  console.log("[SEED] Insertion des 20 fiches...");
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const payload = {
      nom: p.nom,
      prenom: p.prenom,
      date_naissance: birthYearsAgo(ages[i]),
      nationalite: p.nationalite,
      poste: p.poste,
      pied_fort: p.pied_fort,
      taille_cm: p.taille_cm,
      poids_kg: p.poids_kg,
      club_actuel: p.club_actuel,
      club_precedent: p.club_precedent,
      fin_contrat: p.fin_contrat,
      valeur_estimee_eur: p.valeur_estimee_eur,
      telephone: p.telephone,
      email: p.email,
      statut: p.statut,
      agent_referent: adminId,
      photo_url: p.photo ? avatar(p.photo) : null,
      notes: `${MARKER}\n\n**${p.statut === "joueur" ? "Joueur signe" : "Prospect a suivre"}**\n\nFiche de demonstration generee automatiquement.`,
      consentement_rgpd: true,
      consentement_rgpd_date: new Date().toISOString(),
    };
    const { data, error } = await admin.from("players").insert(payload).select().single();
    if (error) { console.error("Echec insert", p.prenom, p.nom, error.message); continue; }

    const stats = statsFor(p).map((s) => ({ ...s, player_id: data.id }));
    if (stats.length) {
      const { error: sErr } = await admin.from("player_stats").insert(stats);
      if (sErr) console.warn("  stats:", sErr.message);
    }
    console.log(`  + ${p.prenom} ${p.nom} (${p.statut}, ${ages[i]} ans, ${p.poste})`);
  }
  console.log("\n[SEED] Termine. Rafraichis la liste des joueurs.");
}

seed().catch((e) => { console.error("Echec seed :", e); process.exit(1); });
