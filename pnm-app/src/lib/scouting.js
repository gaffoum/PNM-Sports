// Grille de notation interne PNM — mêmes 6 axes que le radar du PDF
// (components/players/PlayerPdf.jsx), pour rester cohérent entre la
// notation en dev (scouting interne) et le futur radar réel (BeSoccer).
export const SCOUTING_AXES = [
  { key: "vitesse", label: "Vitesse" },
  { key: "technique", label: "Technique" },
  { key: "physique", label: "Physique" },
  { key: "mental", label: "Mental" },
  { key: "tactique", label: "Tactique" },
  { key: "passes", label: "Passes" },
];

export function evaluationAverage(evaluation) {
  if (!evaluation) return null;
  const values = SCOUTING_AXES.map((a) => evaluation[a.key]).filter((v) => v != null);
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Moyenne de chaque axe sur l'historique complet des évaluations d'un joueur.
export function averageByAxis(evaluations) {
  const out = {};
  SCOUTING_AXES.forEach((a) => {
    const values = evaluations.map((e) => e[a.key]).filter((v) => v != null);
    out[a.key] = values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
  });
  return out;
}
