// Identité de marque du déploiement courant — source unique consommée par
// l'UI, les PDF générés et les emails transactionnels. Chaque client obtient
// ses propres valeurs via les variables d'environnement VITE_BRAND_* (voir
// .env.example) ; les valeurs ci-dessous ne s'appliquent qu'en leur absence.
//
// Le fichier logo reste conventionnellement à public/logo-pnm.png : chaque
// déploiement client remplace ce fichier, sans renommage nécessaire.
export const BRAND = {
  name: import.meta.env.VITE_BRAND_NAME || "SKRINERS",
  legalName: import.meta.env.VITE_BRAND_LEGAL_NAME || import.meta.env.VITE_BRAND_NAME || "SKRINERS",
  domain: import.meta.env.VITE_BRAND_DOMAIN || "skriners.fr",
  contactEmail: import.meta.env.VITE_BRAND_CONTACT_EMAIL || "contact@skriners.fr",
  themeColor: import.meta.env.VITE_BRAND_THEME_COLOR || "#001C25",
  logoPath: `${import.meta.env.BASE_URL}logo-pnm.png`,
};
