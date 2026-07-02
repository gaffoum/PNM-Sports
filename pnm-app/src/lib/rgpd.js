export const RGPD_TYPES = [
  { key: "acces", label: "Droit d'accès" },
  { key: "rectification", label: "Rectification" },
  { key: "suppression", label: "Suppression (droit à l'oubli)" },
  { key: "opposition", label: "Opposition" },
  { key: "portabilite", label: "Portabilité" },
];

export const RGPD_STATUTS = [
  { key: "recue", label: "Reçue" },
  { key: "en_cours", label: "En cours" },
  { key: "traitee", label: "Traitée" },
  { key: "refusee", label: "Refusée" },
];

export function rgpdTypeLabel(key) {
  return RGPD_TYPES.find((t) => t.key === key)?.label ?? key;
}

export function rgpdStatutLabel(key) {
  return RGPD_STATUTS.find((s) => s.key === key)?.label ?? key;
}

export function rgpdStatutBadgeClass(statut) {
  if (statut === "recue") return "bg-amber-500/15 text-amber-300";
  if (statut === "en_cours") return "bg-cyan-500/15 text-cyan-300";
  if (statut === "traitee") return "bg-emerald-500/15 text-emerald-300";
  if (statut === "refusee") return "bg-red-500/15 text-red-300";
  return "bg-slate-500/15 text-slate-300";
}
