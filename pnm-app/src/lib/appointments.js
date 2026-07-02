// Classes Tailwind écrites en toutes lettres (voir lib/recruitment.js —
// anti-purge : les noms générés dynamiquement disparaissent en build prod).
export const APPOINTMENT_STATUTS = [
  { key: "a_venir", label: "À venir", badge: "bg-sky-400/10 text-sky-300 border-sky-400/30" },
  { key: "fait", label: "Fait", badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30" },
  { key: "annule", label: "Annulé", badge: "bg-red-400/10 text-red-300 border-red-400/30" },
];
export const APPOINTMENT_STATUT_MAP = Object.fromEntries(APPOINTMENT_STATUTS.map((s) => [s.key, s]));

export function appointmentStatutLabel(key) {
  return APPOINTMENT_STATUT_MAP[key]?.label ?? key ?? "—";
}
export function appointmentStatutBadgeClass(key) {
  return APPOINTMENT_STATUT_MAP[key]?.badge ?? APPOINTMENT_STATUT_MAP.a_venir.badge;
}
