// =====================================================================
// Tunnel de recrutement — configuration centrale
// Basé sur le schéma fourni : 1ère observation -> ... -> Accepté,
// avec états de "parking" (Veille / Réflexion) et sortie "Ne pas suivre".
// =====================================================================

// Une couleur DISTINCTE par étape (repérage en un coup d'œil).
export const STEPS = [
  { key: "premiere_observation", label: "1ère observation",     tone: "sky",     kanban: true },
  { key: "contre_observation",   label: "Contre-observation",   tone: "indigo",  kanban: true },
  { key: "observation_decisive", label: "Observation décisive", tone: "teal",    kanban: true },
  { key: "veille",               label: "Veille d'évolution",   tone: "amber",   kanban: true, parking: true },
  { key: "prise_contact",        label: "Prise de contact",     tone: "orange",  kanban: true },
  { key: "rdv1",                 label: "RDV 1",                tone: "fuchsia", kanban: true },
  { key: "reflexion",            label: "Réflexion",            tone: "lime",    kanban: true, parking: true },
  { key: "rdv2",                 label: "RDV 2",                tone: "violet",  kanban: true },
  { key: "accepte",              label: "Accepté",              tone: "emerald", kanban: false, terminal: true },
  { key: "ne_pas_suivre",        label: "Ne pas suivre",        tone: "red",     kanban: false, terminal: true },
];

export const STEP_MAP = Object.fromEntries(STEPS.map((s) => [s.key, s]));
export const STEP_KEYS = STEPS.map((s) => s.key);
export const KANBAN_STEPS = STEPS.filter((s) => s.kanban);
export const TERMINAL_STEPS = STEPS.filter((s) => s.terminal);

export const DEFAULT_STEP = "premiere_observation";

// Règle métier : badge "Joueur" uniquement quand l'étape est "Accepté", sinon "Prospect".
export function statutForStep(step) {
  return step === "accepte" ? "joueur" : "prospect";
}

export function stepLabel(step) {
  return STEP_MAP[step]?.label ?? step ?? "—";
}

// Libellés courts pour les en-têtes de colonnes Kanban (tiennent sur une ligne).
export const STEP_SHORT = {
  premiere_observation: "1ère obs.",
  contre_observation: "Contre-obs.",
  observation_decisive: "Obs. décisive",
  veille: "Veille",
  prise_contact: "Prise contact",
  rdv1: "RDV 1",
  reflexion: "Réflexion",
  rdv2: "RDV 2",
  accepte: "Accepté",
  ne_pas_suivre: "Ne pas suivre",
};
export function stepShort(step) {
  return STEP_SHORT[step] ?? stepLabel(step);
}

export function stepTone(step) {
  return STEP_MAP[step]?.tone ?? "sky";
}

export const TONE_KEYS = ["sky", "indigo", "teal", "amber", "orange", "fuchsia", "lime", "violet", "emerald", "red"];

// Classes CSS (définies dans index.css) pour colorer badges / cartes par tonalité.
export const TONE_BADGE = Object.fromEntries(TONE_KEYS.map((k) => [k, `tone-badge-${k}`]));
export const TONE_CARD = Object.fromEntries(TONE_KEYS.map((k) => [k, `tone-card-${k}`]));

// Pastilles de couleur (classes Tailwind littérales pour le scanner).
export const TONE_DOT = {
  sky: "bg-sky-400", indigo: "bg-indigo-400", teal: "bg-teal-400", amber: "bg-amber-400",
  orange: "bg-orange-400", fuchsia: "bg-fuchsia-400", lime: "bg-lime-400", violet: "bg-violet-400",
  emerald: "bg-emerald-400", red: "bg-red-400",
};

export function stepBadgeClass(step) {
  return TONE_BADGE[stepTone(step)] ?? TONE_BADGE.sky;
}
export function stepCardClass(step) {
  return TONE_CARD[stepTone(step)] ?? TONE_CARD.sky;
}
export function stepDotClass(step) {
  return TONE_DOT[stepTone(step)] ?? TONE_DOT.sky;
}
