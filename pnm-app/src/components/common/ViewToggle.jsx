import { LayoutGrid, List } from "lucide-react";

// Bascule carte / tableau, réutilisée sur les pages d'annuaire (clubs,
// besoins clubs...). Même style que le bouton "Mes joueurs" (actif = plein).
export default function ViewToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 panel p-1">
      <button
        type="button"
        onClick={() => onChange("cards")}
        title="Vue en cartes"
        className={`btn px-2.5 py-1.5 ${value === "cards" ? "btn-primary" : "btn-ghost"}`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        title="Vue en tableau"
        className={`btn px-2.5 py-1.5 ${value === "table" ? "btn-primary" : "btn-ghost"}`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
