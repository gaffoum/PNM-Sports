// Compte "SuperAdmin" — invisible dans la liste des agents/admins, seul
// habilité à gérer les briques commerciales (/features). Un rôle au-dessus
// du rôle "admin" classique, réservé au propriétaire de l'agence.
export const OWNER_EMAIL = "gaffoum@gmail.com";

export function isOwner(agent) {
  return (agent?.email || "").toLowerCase() === OWNER_EMAIL;
}
