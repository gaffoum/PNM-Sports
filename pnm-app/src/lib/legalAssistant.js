export const LEGAL_CATEGORIES = [
  { key: "fifa_rstp", label: "FIFA — Statut et transfert des joueurs (RSTP)" },
  { key: "fifa_ffar", label: "FIFA — Réglementation des agents (FFAR)" },
  { key: "uefa", label: "UEFA" },
  { key: "code_sport", label: "Code du sport (France)" },
  { key: "charte_lfp_fff", label: "Charte / règlements FFF-LFP" },
  { key: "jurisprudence_cas", label: "Jurisprudence TAS/CAS" },
  { key: "autre", label: "Autre" },
];

export function legalCategoryLabel(key) {
  return LEGAL_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

// Découpage simple d'un texte collé manuellement en extraits : un extrait
// par bloc séparé par une ligne vide. Utilisé pour l'ajout manuel rapide,
// en alternative à l'import PDF assisté par IA.
export function splitPastedText(text) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((contenu) => ({ reference: "", contenu }));
}
