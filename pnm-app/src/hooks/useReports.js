import { supabase } from "../lib/supabaseClient";

// Rapport periodique agrege sur plusieurs modules ; chaque bloc n'est
// interroge que si le module correspondant est actif (evite les erreurs
// RLS sur une table dont la brique est desactivee).
export async function getPeriodReport({ from, to, hasAgenda, hasPipeline, hasCommissions }) {
  const fromIso = new Date(from).toISOString();
  const toIso = new Date(new Date(to).setHours(23, 59, 59, 999)).toISOString();

  const [nouveauxJoueurs, etapesChangees, rdvTenus, dealsSignes, commissionsEncaissees] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }).gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("activity_log").select("id", { count: "exact", head: true }).eq("action", "update_step").gte("created_at", fromIso).lte("created_at", toIso),
    hasAgenda
      ? supabase.from("appointments").select("id", { count: "exact", head: true }).eq("statut", "fait").gte("date_rdv", fromIso).lte("date_rdv", toIso)
      : Promise.resolve({ count: null }),
    hasPipeline
      ? supabase.from("player_deals").select("montant_propose").eq("statut", "signe").gte("updated_at", fromIso).lte("updated_at", toIso)
      : Promise.resolve({ data: null }),
    hasCommissions
      ? supabase.from("deal_commissions").select("montant").eq("statut", "encaissee").gte("updated_at", fromIso).lte("updated_at", toIso)
      : Promise.resolve({ data: null }),
  ]);

  return {
    nouveauxJoueurs: nouveauxJoueurs.count ?? 0,
    etapesChangees: etapesChangees.count ?? 0,
    rdvTenus: hasAgenda ? (rdvTenus.count ?? 0) : null,
    dealsSignes: hasPipeline ? (dealsSignes.data ?? []).length : null,
    montantDealsSignes: hasPipeline ? (dealsSignes.data ?? []).reduce((s, d) => s + Number(d.montant_propose || 0), 0) : null,
    commissionsEncaissees: hasCommissions ? (commissionsEncaissees.data ?? []).reduce((s, c) => s + Number(c.montant || 0), 0) : null,
  };
}
