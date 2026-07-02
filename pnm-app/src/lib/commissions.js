export const COMMISSION_STATUTS = [
  { key: "attendue", label: "Attendue", badge: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  { key: "facturee", label: "Facturée", badge: "bg-sky-400/10 text-sky-300 border-sky-400/30" },
  { key: "encaissee", label: "Encaissée", badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30" },
];
export const COMMISSION_STATUT_MAP = Object.fromEntries(COMMISSION_STATUTS.map((s) => [s.key, s]));

export function commissionStatutLabel(key) {
  return COMMISSION_STATUT_MAP[key]?.label ?? key ?? "—";
}
export function commissionStatutBadgeClass(key) {
  return COMMISSION_STATUT_MAP[key]?.badge ?? COMMISSION_STATUT_MAP.attendue.badge;
}
