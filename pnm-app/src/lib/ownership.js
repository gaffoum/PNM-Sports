// Compte "SuperAdmin" — seul habilité à gérer les briques commerciales
// (/features). Un rôle au-dessus du rôle "admin" classique, réservé au
// propriétaire de l'agence. Porté par la colonne agents.is_owner (attribuée
// automatiquement au tout premier compte admin créé, voir scripts/setup.mjs)
// plutôt qu'un email en dur, pour que ce statut soit correct sur chaque
// déploiement client.
export function isOwner(agent) {
  return !!agent?.is_owner;
}
