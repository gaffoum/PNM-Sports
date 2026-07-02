export const AUDIT_TABLES = [
  { key: "players", label: "Joueurs" },
  { key: "clubs", label: "Clubs" },
  { key: "player_deals", label: "Deals" },
  { key: "deal_commissions", label: "Commissions" },
  { key: "player_contracts", label: "Contrats" },
  { key: "agents", label: "Agents" },
  { key: "features", label: "Briques" },
  { key: "rgpd_requests", label: "Demandes RGPD" },
];

export const AUDIT_ACTIONS = [
  { key: "insert", label: "Création" },
  { key: "update", label: "Modification" },
  { key: "delete", label: "Suppression" },
];

export function auditTableLabel(key) {
  return AUDIT_TABLES.find((t) => t.key === key)?.label ?? key;
}

export function auditActionLabel(key) {
  return AUDIT_ACTIONS.find((a) => a.key === key)?.label ?? key;
}

export function auditActionBadgeClass(action) {
  if (action === "insert") return "bg-emerald-500/15 text-emerald-300";
  if (action === "update") return "bg-cyan-500/15 text-cyan-300";
  if (action === "delete") return "bg-red-500/15 text-red-300";
  return "bg-slate-500/15 text-slate-300";
}

// Devine un libellé lisible ("nom prénom", "titre", ...) à partir du
// contenu JSON capturé, pour éviter d'afficher un UUID brut à l'agent.
export function auditRecordLabel(entry) {
  const data = entry.new_data ?? entry.old_data;
  if (!data) return entry.record_id ?? "—";
  if (data.nom && data.prenom) return `${data.prenom} ${data.nom}`;
  if (data.nom) return data.nom;
  if (data.label) return data.label;
  if (data.titre) return data.titre;
  if (data.email) return data.email;
  return entry.record_id ?? "—";
}
