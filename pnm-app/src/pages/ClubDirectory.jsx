import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, Plus, Users, Contact } from "lucide-react";
import { listClubsDirectory } from "../hooks/useClubs";
import { useAuth } from "../hooks/useAuth";

export default function ClubDirectory() {
  const nav = useNavigate();
  const { isAdmin, can } = useAuth();
  const canEdit = isAdmin || can("edit_players");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [newClub, setNewClub] = useState("");

  async function load() {
    setLoading(true);
    try {
      setClubs(await listClubsDirectory());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function goToClub(name) {
    nav(`/clubs/${encodeURIComponent(name)}`);
  }

  function createClub(e) {
    e.preventDefault();
    const name = newClub.trim();
    if (!name) return;
    goToClub(name);
  }

  const filtered = clubs.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl">Clubs &amp; contacts</h1>
        <p className="text-ink-dim text-sm">Annuaire des clubs, dirigeants et historique des échanges.</p>
      </header>

      {canEdit && (
        <form onSubmit={createClub} className="panel p-4 flex flex-wrap items-center gap-2">
          <input
            className="input flex-1 min-w-[220px]"
            placeholder="Ajouter un club (hors référentiel, ex. club étranger)…"
            value={newClub}
            onChange={(e) => setNewClub(e.target.value)}
          />
          <button type="submit" className="btn btn-primary px-3"><Plus className="w-4 h-4" />Ajouter</button>
        </form>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input className="input pl-10" placeholder="Rechercher un club…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <button
              key={c.name}
              onClick={() => goToClub(c.name)}
              className="panel panel-hover p-4 text-left"
            >
              <div className="font-semibold truncate">{c.name}</div>
              <div className="flex items-center gap-4 mt-2 text-xs text-ink-dim">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.playerCount} joueur{c.playerCount !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1"><Contact className="w-3.5 h-3.5" />{c.contactCount} contact{c.contactCount !== 1 ? "s" : ""}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-ink-dim col-span-full">Aucun club trouvé.</p>}
        </div>
      )}
    </div>
  );
}
