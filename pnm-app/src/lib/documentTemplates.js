// Catalogue des types de documents générables. "type" est la clé stable
// stockée en base (document_templates.type / generated_documents.type) —
// un seul modèle actif par type à la fois.
export const DOC_TYPES = [
  { key: "mandat_representation", label: "Mandat de représentation" },
  { key: "contrat_travail", label: "Contrat de travail joueur" },
];

export function docTypeLabel(key) {
  return DOC_TYPES.find((t) => t.key === key)?.label ?? key;
}

// Variables toujours disponibles quand un joueur/club est sélectionné,
// en plus des champs personnalisés définis par le modèle (accessibles
// via {{champ.<cle>}}).
export const AUTO_VARIABLES = [
  { key: "joueur.prenom", label: "Prénom du joueur" },
  { key: "joueur.nom", label: "Nom du joueur" },
  { key: "joueur.date_naissance", label: "Date de naissance du joueur" },
  { key: "joueur.nationalite", label: "Nationalité du joueur" },
  { key: "club.nom", label: "Nom du club" },
  { key: "club.pays", label: "Pays du club" },
  { key: "date.jour", label: "Date du jour" },
];

export const CHAMP_TYPES = [
  { key: "text", label: "Texte court" },
  { key: "textarea", label: "Texte long" },
  { key: "number", label: "Nombre" },
  { key: "date", label: "Date" },
];

function flattenContext(ctx, prefix, out) {
  for (const [k, v] of Object.entries(ctx || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flattenContext(v, key, out);
    else out[key] = v ?? "";
  }
  return out;
}

// Remplace les {{cle}} d'un paragraphe par les valeurs du contexte fourni.
// Les variables non résolues restent affichées telles quelles (visibles
// pour que l'agent les repère et les complète manuellement si besoin).
export function renderTemplate(text, context) {
  const flat = flattenContext(context, "", {});
  return (text || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
    return key in flat && flat[key] !== "" ? String(flat[key]) : match;
  });
}

export function buildMergeContext({ player, club, champValues, formatDateFr }) {
  return {
    joueur: player
      ? {
          prenom: player.prenom,
          nom: player.nom,
          date_naissance: formatDateFr ? formatDateFr(player.date_naissance) : player.date_naissance,
          nationalite: player.nationalite,
        }
      : {},
    club: club ? { nom: club.nom, pays: club.pays } : {},
    date: { jour: formatDateFr ? formatDateFr(new Date()) : new Date().toISOString().slice(0, 10) },
    champ: champValues || {},
  };
}
