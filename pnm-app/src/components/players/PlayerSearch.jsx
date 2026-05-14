import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const POSTES = ["", "Gardien", "Défenseur", "Milieu", "Attaquant", "Latéral", "Pivot", "Ailier"];

export default function PlayerSearch({ search, setSearch, filters, setFilters }) {
  const [open, setOpen] = useState(false);

  function update(k, v) { setFilters({ ...filters, [k]: v || undefined }); }
  function reset() { setFilters({}); setSearch(""); }

  const active = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            className="input pl-10"
            placeholder="Rechercher (nom, club, nationalité, poste…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button onClick={() => setOpen(!open)} className="btn btn-outline">
          <SlidersHorizontal className="w-4 h-4" />
          Filtres {active > 0 && <span className="badge badge-joueur">{active}</span>}
        </button>
        {active > 0 && (
          <button onClick={reset} className="btn btn-ghost text-xs">Réinitialiser</button>
        )}
      </div>

      {open && (
        <div className="panel p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Statut</label>
            <select className="input" value={filters.statut ?? ""} onChange={(e) => update("statut", e.target.value)}>
              <option value="">Tous</option>
              <option value="joueur">Joueur signé</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
          <div>
            <label className="label">Poste</label>
            <select className="input" value={filters.poste ?? ""} onChange={(e) => update("poste", e.target.value)}>
              {POSTES.map((p) => <option key={p} value={p}>{p || "Tous"}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nationalité</label>
            <input className="input" placeholder="ex : France" value={filters.nationalite ?? ""} onChange={(e) => update("nationalite", e.target.value)} />
          </div>
          <div>
            <label className="label">Club actuel</label>
            <input className="input" placeholder="ex : OL" value={filters.club ?? ""} onChange={(e) => update("club", e.target.value)} />
          </div>
          <div>
            <label className="label">Âge min</label>
            <input type="number" min={5} max={60} className="input" value={filters.age_min ?? ""} onChange={(e) => update("age_min", e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div>
            <label className="label">Âge max</label>
            <input type="number" min={5} max={60} className="input" value={filters.age_max ?? ""} onChange={(e) => update("age_max", e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div>
            <label className="label">Fin de contrat avant</label>
            <input type="date" className="input" value={filters.fin_contrat_avant ?? ""} onChange={(e) => update("fin_contrat_avant", e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}
