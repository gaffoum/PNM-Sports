// =====================================================================
// Catalogue (anticipé) des droits attribuables à un agent.
// Les clés ci-dessous sont des PLACEHOLDERS extensibles : on pourra en
// ajouter / retirer quand les droits définitifs seront décidés, sans
// changer la mécanique (agent.permissions = { cle: true }).
// Un agent "admin" possède tous les droits implicitement.
// =====================================================================

export const PERMISSIONS = [
  { key: "manage_agents",      label: "Gérer les agents",            desc: "Créer des agents et définir leurs droits" },
  { key: "view_all_players",   label: "Voir tous les joueurs",       desc: "Accès à toutes les fiches (pas seulement les siennes)" },
  { key: "edit_players",       label: "Créer / modifier des fiches", desc: "Ajouter et éditer des joueurs / prospects (couvre tous les modules)" },
  { key: "delete_players",     label: "Supprimer des fiches",        desc: "Suppression (droit à l'oubli RGPD)" },
  { key: "manage_recruitment", label: "Gérer la prospection",        desc: "Modifier les étapes du tunnel" },
  { key: "export_data",        label: "Exporter les données",        desc: "Export CSV / Excel / PDF" },
  { key: "manage_clubs",       label: "Gérer les clubs",             desc: "Annuaire clubs, contacts, historique, besoins clubs" },
  { key: "manage_pipeline",    label: "Gérer le pipeline & commissions", desc: "Deals joueur↔club et commissions associées" },
  { key: "manage_agenda",      label: "Gérer agenda & interactions", desc: "Rendez-vous et historique d'échanges par joueur" },
  { key: "manage_scouting",    label: "Gérer scouting & contrats",   desc: "Évaluations internes et contrats détaillés" },
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

// Un admin a tous les droits ; sinon on regarde la carte permissions.
export function hasPermission(agent, key) {
  if (!agent) return false;
  if (agent.role === "admin") return true;
  return !!agent.permissions?.[key];
}
