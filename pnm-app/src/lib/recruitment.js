// =====================================================================
// Tunnel de recrutement — configuration centrale
// Basé sur le schéma fourni : 1ère observation -> ... -> Accepté,
// avec états de "parking" (Veille / Réflexion) et sortie "Ne pas suivre".
// =====================================================================

export const STEPS = [
  { key: "premiere_observation", label: "1ère observation",     tone: "blue",  kanban: true },
  { key: "contre_observation",   label: "Contre-observation",   tone: "blue",  kanban: true },
  { key: "observation_decisive", label: "Observation décisive", tone: "blue",  kanban: true },
  { key: "veille",               label: "Veille d'évolution",   tone: "amber", kanban: true, parking: true },
  { key: "prise_contact",        label: "Prise de contact",     tone: "cyan",  kanban: true },
  { key: "rdv1",                 label: "RDV 1",                tone: "cyan",  kanban: true },
  { key: "reflexion",            label: "Réflexion",            tone: "amber", kanban: true, parking: true },
  { key: "rdv2",                 label: "RDV 2",                tone: "cyan",  kanban: true },
  { key: "accepte",              label: "Accepté",              tone: "green", kanban: false, terminal: true },
  { key: "ne_pas_suivre",        label: "Ne pas suivre",        tone: "red",   kanban: false, terminal: true },
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

export function stepTone(step) {
  return STEP_MAP[step]?.tone ?? "blue";
}

// Classes CSS (définies dans index.css) pour colorer cartes / badges par tonalité.
export const TONE_BADGE = {
  blue:  "tone-badge-blue",
  cyan:  "tone-badge-cyan",
  amber: "tone-badge-amber",
  green: "tone-badge-green",
  red:   "tone-badge-red",
};
export const TONE_CARD = {
  blue:  "tone-card-blue",
  cyan:  "tone-card-cyan",
  amber: "tone-card-amber",
  green: "tone-card-green",
  red:   "tone-card-red",
};

export function stepBadgeClass(step) {
  return TONE_BADGE[stepTone(step)] ?? TONE_BADGE.blue;
}
export function stepCardClass(step) {
  return TONE_CARD[stepTone(step)] ?? TONE_CARD.blue;
}
