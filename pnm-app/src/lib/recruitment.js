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

// IMPORTANT : classes Tailwind écrites en TOUTES LETTRES (littéraux) — sinon le
// scanner de Tailwind ne les voit pas et les purge du CSS final (cartouches blanches).
// Badge d'étape : même style que les badges de statut (fond /10, texte coloré -300, bordure /30).
export const TONE_BADGE = {
  sky:     "bg-sky-400/10 text-sky-300 border-sky-400/30",
  indigo:  "bg-indigo-400/10 text-indigo-300 border-indigo-400/30",
  teal:    "bg-teal-400/10 text-teal-300 border-teal-400/30",
  amber:   "bg-amber-400/10 text-amber-300 border-amber-400/30",
  orange:  "bg-orange-400/10 text-orange-300 border-orange-400/30",
  fuchsia: "bg-fuchsia-400/10 text-fuchsia-300 border-fuchsia-400/30",
  lime:    "bg-lime-400/10 text-lime-300 border-lime-400/30",
  violet:  "bg-violet-400/10 text-violet-300 border-violet-400/30",
  emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
  red:     "bg-red-400/10 text-red-300 border-red-400/30",
};
// Carte Kanban : liseré gauche coloré.
export const TONE_CARD = {
  sky:     "border-l-4 border-l-sky-400/70",
  indigo:  "border-l-4 border-l-indigo-400/70",
  teal:    "border-l-4 border-l-teal-400/70",
  amber:   "border-l-4 border-l-amber-400/70",
  orange:  "border-l-4 border-l-orange-400/70",
  fuchsia: "border-l-4 border-l-fuchsia-400/70",
  lime:    "border-l-4 border-l-lime-400/70",
  violet:  "border-l-4 border-l-violet-400/70",
  emerald: "border-l-4 border-l-emerald-400/70",
  red:     "border-l-4 border-l-red-400/70",
};

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
