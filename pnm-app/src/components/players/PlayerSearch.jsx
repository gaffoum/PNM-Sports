import { Search, X, SlidersHorizontal, Bookmark, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import { useFeatures } from "../../hooks/useFeatures";
import { listMySavedSearches, createSavedSearch, deleteSavedSearch } from "../../hooks/useSavedSearches";

const POSTES = ["", "Gardien", "Défenseur", "Milieu", "Attaquant", "Latéral", "Pivot", "Ailier"];

export default function PlayerSearch({ search, setSearch, filters, setFilters }) {
  const { agent } = useAuth();
  const { hasFeature } = useFeatures();
  const hasSavedSearches = hasFeature("mobile_recherche");
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [saved, setSaved] = useState([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    supabase.from("agents").select("id, nom, prenom").order("nom").then(({ data }) => setAgents(data ?? []));
  }, []);

  useEffect(() => {
    if (!hasSavedSearches) return;
    listMySavedSearches().then(setSaved).catch(() => {});
  }, [hasSavedSearches]);

  function update(k, v) { setFilters({ ...filters, [k]: v || undefined }); }
  function reset() { setFilters({}); setSearch(""); }

  async function saveCurrent(e) {
    e.preventDefault();
    if (!saveName.trim()) return toast.error("Nom requis.");
    try {
      const created = await createSavedSearch({ agent_id: agent.id, nom: saveName.trim(), search, filters });
      setSaved((s) => [created, ...s]);
      setSaveName("");
      setShowSaveForm(false);
      toast.success("Filtres enregistrés");
    } catch (e) {
      toast.error(e.message);
    }
  }

  function applySaved(s) {
    setSearch(s.search ?? "");
    setFilters(s.filters ?? {});
    setOpen(true);
  }

  async function removeSaved(s) {
    try {
      await deleteSavedSearch(s.id);
      setSaved((ss) => ss.filter((x) => x.id !== s.id));
    } catch (e) {
      toast.error(e.message);
    }
  }

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
        {hasSavedSearches && active > 0 && (
          <button onClick={() => setShowSaveForm((v) => !v)} className="btn btn-ghost text-xs"><Bookmark className="w-3.5 h-3.5" />Enregistrer</button>
        )}
      </div>

      {hasSavedSearches && showSaveForm && (
        <form onSubmit={saveCurrent} className="flex items-center gap-2">
          <input className="input flex-1" placeholder="Nom de cette recherche…" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
          <button type="submit" className="btn btn-primary px-3">Enregistrer</button>
          <button type="button" onClick={() => setShowSaveForm(false)} className="btn btn-ghost px-3">Annuler</button>
        </form>
      )}

      {hasSavedSearches && saved.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-ink-muted">Filtres sauvegardés :</span>
          {saved.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 bg-bg-1 border border-line rounded-full pl-3 pr-1 py-1 text-xs">
              <button onClick={() => applySaved(s)} className="hover:text-cyan-bright">{s.nom}</button>
              <button onClick={() => removeSaved(s)} className="p-1 text-ink-muted hover:text-red-300" title="Supprimer"><Trash2 className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

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
            <label className="label">Agent référent</label>
            <select className="input" value={filters.agent_referent ?? ""} onChange={(e) => update("agent_referent", e.target.value)}>
              <option value="">Tous</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
            </select>
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
