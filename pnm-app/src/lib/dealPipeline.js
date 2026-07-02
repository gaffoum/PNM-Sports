// Classes Tailwind écrites en toutes lettres (anti-purge, voir lib/recruitment.js).
export const DEAL_TYPES = [
  { key: "transfert", label: "Transfert" },
  { key: "pret", label: "Prêt" },
  { key: "essai", label: "Essai" },
];
export const DEAL_TYPE_MAP = Object.fromEntries(DEAL_TYPES.map((t) => [t.key, t]));
export function dealTypeLabel(key) {
  return DEAL_TYPE_MAP[key]?.label ?? key ?? "—";
}

export const DEAL_STATUTS = [
  { key: "en_discussion", label: "En discussion", badge: "bg-sky-400/10 text-sky-300 border-sky-400/30", dot: "bg-sky-400" },
  { key: "offre_recue", label: "Offre reçue", badge: "bg-amber-400/10 text-amber-300 border-amber-400/30", dot: "bg-amber-400" },
  { key: "accord_verbal", label: "Accord verbal", badge: "bg-orange-400/10 text-orange-300 border-orange-400/30", dot: "bg-orange-400" },
  { key: "signe", label: "Signé", badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30", dot: "bg-emerald-400" },
  { key: "refuse", label: "Refusé", badge: "bg-red-400/10 text-red-300 border-red-400/30", dot: "bg-red-400" },
  { key: "abandonne", label: "Abandonné", badge: "bg-line/30 text-ink-dim border-line", dot: "bg-ink-dim" },
];
export const DEAL_STATUT_MAP = Object.fromEntries(DEAL_STATUTS.map((s) => [s.key, s]));
export const DEAL_KANBAN_STATUTS = DEAL_STATUTS.filter((s) => !["refuse", "abandonne"].includes(s.key));
export const DEAL_TERMINAL_STATUTS = DEAL_STATUTS.filter((s) => ["refuse", "abandonne"].includes(s.key));

export function dealStatutLabel(key) {
  return DEAL_STATUT_MAP[key]?.label ?? key ?? "—";
}
export function dealStatutBadgeClass(key) {
  return DEAL_STATUT_MAP[key]?.badge ?? DEAL_STATUT_MAP.en_discussion.badge;
}
export function dealStatutDotClass(key) {
  return DEAL_STATUT_MAP[key]?.dot ?? DEAL_STATUT_MAP.en_discussion.dot;
}
