// Traduction explicite (FR) des actions du journal d'activité.
import { stepLabel } from "./recruitment";

const ACTION_LABELS = {
  create_player: "Création de la fiche",
  update_player: "Mise à jour de la fiche",
  update_photo: "Mise à jour de la photo",
  update_step: "Mise à jour statut",
  delete_player: "Suppression de la fiche",
  export_pdf: "Export PDF",
  send_pdf_email: "Envoi de la fiche PDF par email",
};

// Retourne une description française explicite de l'activité.
export function describeActivity(action, details) {
  if (action === "update_step") {
    const to = details?.to ?? details?.step;
    const from = details?.from;
    if (from && to) return `Mise à jour statut ${stepLabel(from)} vers ${stepLabel(to)}`;
    if (to) return `Mise à jour statut vers ${stepLabel(to)}`;
    return "Mise à jour statut";
  }
  if (action === "send_pdf_email" && details?.to) {
    return `Envoi de la fiche PDF par email à ${details.to}`;
  }
  return ACTION_LABELS[action] ?? action;
}
