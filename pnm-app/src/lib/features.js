// =====================================================================
// Catalogue des "briques" (feature flags facturables).
// Miroir du seed de supabase/migrations/0005_features.sql — sert de
// filet d'affichage (label/pack) si une clé arrive sans média local.
// La source de vérité de l'état ON/OFF reste la table public.features.
// =====================================================================

export const PACKS = [
  { key: "data_scouting",   label: "Data & Scouting" },
  { key: "placement_crm",   label: "Placement & CRM" },
  { key: "communication",   label: "Communication" },
  { key: "documents_media", label: "Documents & média" },
  { key: "mobile_pilotage", label: "Mobile & Pilotage" },
  { key: "securite",        label: "Sécurité & Conformité" },
  { key: "vitrine",         label: "Vitrine & présence en ligne" },
];

export const FEATURES = [
  { key: "data_besoccer",         label: "Connexion BeSoccer Pro",             pack: "data_scouting" },
  { key: "data_radar_reel",       label: "Radar de notation réel",             pack: "data_scouting" },
  { key: "data_scouting_interne", label: "Scouting interne (grille agents)",   pack: "data_scouting" },
  { key: "data_comparaison",      label: "Comparaison de joueurs",             pack: "data_scouting" },
  { key: "placement_clubs",       label: "Annuaire clubs & contacts",          pack: "placement_crm" },
  { key: "placement_pipeline",    label: "Pipeline transferts & mandats",      pack: "placement_crm" },
  { key: "placement_commissions", label: "Commissions & revenus",              pack: "placement_crm" },
  { key: "placement_contrats",    label: "Gestion avancée des contrats",       pack: "placement_crm" },
  { key: "placement_agenda",      label: "Agenda & rappels",                   pack: "placement_crm" },
  { key: "placement_historique",  label: "Historique d'interactions",          pack: "placement_crm" },
  { key: "comm_emails",           label: "Emails automatiques",                pack: "communication" },
  { key: "comm_notifications",    label: "Notifications in-app",               pack: "communication" },
  { key: "comm_envoi_pdf",        label: "Envoi de fiche PDF par email",       pack: "communication" },
  { key: "media_videos",          label: "Galerie vidéos / highlights",        pack: "documents_media" },
  { key: "media_signature",       label: "Signature électronique",             pack: "documents_media" },
  { key: "media_book",            label: "Book / plaquette joueur",            pack: "documents_media" },
  { key: "pilotage_dashboard",    label: "Tableau de bord avancé",             pack: "mobile_pilotage" },
  { key: "pilotage_rapports",     label: "Rapports périodiques",               pack: "mobile_pilotage" },
  { key: "pilotage_portefeuille", label: "Vue portefeuille & valorisation",    pack: "mobile_pilotage" },
  { key: "mobile_pwa",            label: "Application mobile (PWA)",           pack: "mobile_pilotage" },
  { key: "mobile_recherche",      label: "Recherche avancée & filtres sauvegardés", pack: "mobile_pilotage" },
  { key: "secu_permissions_fines",label: "Permissions fines par module",       pack: "securite" },
  { key: "secu_audit",            label: "Journal d'audit complet",            pack: "securite" },
  { key: "secu_2fa",              label: "Authentification renforcée (2FA)",  pack: "securite" },
  { key: "secu_rgpd",             label: "Conformité RGPD avancée",            pack: "securite" },
  { key: "vitrine_public_joueurs",label: "Espace public joueurs",              pack: "vitrine" },
  { key: "vitrine_multilingue",   label: "Multilingue (FR/EN)",                pack: "vitrine" },
  { key: "vitrine_blog",          label: "Blog / actualités",                  pack: "vitrine" },
];

export const FEATURE_MAP = Object.fromEntries(FEATURES.map((f) => [f.key, f]));
export const PACK_MAP = Object.fromEntries(PACKS.map((p) => [p.key, p]));

export function featureLabel(key) {
  return FEATURE_MAP[key]?.label ?? key;
}
export function packLabel(key) {
  return PACK_MAP[key]?.label ?? key ?? "Autres";
}
