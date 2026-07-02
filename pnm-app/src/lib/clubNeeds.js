// Statuts d'un besoin club — classes Tailwind écrites en toutes lettres
// (voir lib/recruitment.js : les noms de classes générés dynamiquement
// sont purgés par Tailwind en build de prod).
export const STATUTS = [
  { key: "ouvert", label: "Ouvert", badge: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  { key: "pourvu", label: "Pourvu", badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30" },
  { key: "annule", label: "Annulé", badge: "bg-red-400/10 text-red-300 border-red-400/30" },
];
export const STATUT_MAP = Object.fromEntries(STATUTS.map((s) => [s.key, s]));

export function statutLabel(key) {
  return STATUT_MAP[key]?.label ?? key ?? "—";
}
export function statutBadgeClass(key) {
  return STATUT_MAP[key]?.badge ?? STATUT_MAP.ouvert.badge;
}

// Suggestions de critères courants (auto-complétion) — texte libre autorisé.
export const CRITERE_SUGGESTIONS = [
  "Gaucher", "Droitier", "Ambidextre", "Rapide", "Technique", "Physique",
  "Bon dans les airs", "Meneur de jeu", "Expérimenté", "Jeune (-23 ans)",
  "Polyvalent", "Bon dans le jeu court", "Bon dans le jeu long", "Leader",
  "Bonne relance", "Un contre un", "Sens du but", "Vision de jeu",
];

// Postes suggérés (auto-complétion, texte libre autorisé).
export const POSTE_SUGGESTIONS = [
  "Gardien", "Défenseur central", "Latéral droit", "Latéral gauche",
  "Milieu défensif", "Milieu central", "Milieu offensif",
  "Ailier droit", "Ailier gauche", "Avant-centre",
];
