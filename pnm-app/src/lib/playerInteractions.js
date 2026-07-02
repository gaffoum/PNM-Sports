export const INTERACTION_TYPES = [
  { key: "appel", label: "Appel" },
  { key: "email", label: "Email" },
  { key: "reunion", label: "Réunion" },
  { key: "note", label: "Note" },
];
export const INTERACTION_MAP = Object.fromEntries(INTERACTION_TYPES.map((t) => [t.key, t]));

export function interactionLabel(key) {
  return INTERACTION_MAP[key]?.label ?? key ?? "—";
}
