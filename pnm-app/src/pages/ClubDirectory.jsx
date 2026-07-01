import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, Plus, Users, Contact, Pencil, Trash2, Check, X } from "lucide-react";
import { listClubsDirectory, createClub, updateClub, deleteClub } from "../hooks/useClubs";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../contexts/ConfirmContext";
import { COUNTRIES } from "../lib/countries";
import AutocompleteInput from "../components/common/AutocompleteInput";

export default function ClubDirectory() {
  const nav = useNavigate();
  const { agent, isAdmin, can } = useAuth();
  const confirm = useConfirm();
  const canEdit = isAdmin || can("edit_players");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [newClub, setNewClub] = useState({ nom: "", pays: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nom: "", pays: "" });

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

  async function submitNewClub(e) {
    e.preventDefault();
    const nom = newClub.nom.trim();
    if (!nom) return;
    try {
      await createClub({ nom, pays: newClub.pays.trim(), created_by: agent.id });
      setNewClub({ nom: "", pays: "" });
      toast.success("Club ajouté");
      load();
    } catch (e) {
      if (e.code === "23505") toast.error("Ce club existe déjà.");
      else toast.error(e.message);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditForm({ nom: c.nom, pays: c.pays || "" });
  }

  async function saveEdit(c) {
    if (!editForm.nom.trim()) return toast.error("Le nom du club est requis.");
    try {
      await updateClub(c.id, { nom: editForm.nom.trim(), pays: editForm.pays.trim() });
      setEditingId(null);
      toast.success("Club mis à jour");
      load();
    } catch (e) {
      if (e.code === "23505") toast.error("Un club porte déjà ce nom.");
      else toast.error(e.message);
    }
  }

  async function removeClub(c) {
    const ok = await confirm({
      title: "Supprimer ce club ?",
      message: `${c.nom}\nSes contacts et son historique d'échanges seront supprimés.\nLes joueurs déjà associés à ce club ne sont pas modifiés.`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteClub(c.id);
      setClubs((cs) => cs.filter((x) => x.id !== c.id));
      toast.success("Club supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  }

  const filtered = clubs.filter((c) =>
    c.nom.toLowerCase().includes(q.trim().toLowerCase()) &&
    (!country.trim() || (c.pays || "").toLowerCase().includes(country.trim().toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl">Clubs &amp; contacts</h1>
        <p className="text-ink-dim text-sm">Annuaire des clubs, dirigeants et historique des échanges.</p>
      </header>

      {canEdit && (
        <form onSubmit={submitNewClub} className="panel p-4 flex flex-wrap items-center gap-2">
          <input
            className="input flex-1 min-w-[200px]"
            placeholder="Nom du club (hors référentiel, ex. club étranger)…"
            value={newClub.nom}
            onChange={(e) => setNewClub({ ...newClub, nom: e.target.value })}
          />
          <AutocompleteInput
            className="w-48"
            placeholder="Pays"
            options={COUNTRIES}
            value={newClub.pays}
            onChange={(v) => setNewClub({ ...newClub, pays: v })}
          />
          <button type="submit" className="btn btn-primary px-3"><Plus className="w-4 h-4" />Ajouter</button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input className="input pl-10" placeholder="Rechercher un club…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <AutocompleteInput
          className="w-48"
          placeholder="Tous les pays"
          options={COUNTRIES}
          value={country}
          onChange={setCountry}
        />
      </div>

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="panel p-4">
              {editingId === c.id ? (
                <div className="space-y-2">
                  <input className="input py-1.5" value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} />
                  <AutocompleteInput
                    className="py-1.5"
                    placeholder="Pays"
                    options={COUNTRIES}
                    value={editForm.pays}
                    onChange={(v) => setEditForm({ ...editForm, pays: v })}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(c)} className="btn btn-primary px-2 py-1"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="btn btn-ghost px-2 py-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={() => goToClub(c.nom)} className="text-left w-full panel-hover">
                    <div className="font-semibold truncate">{c.nom}</div>
                    {c.pays && <div className="text-[11px] text-ink-muted mt-0.5">{c.pays}</div>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-ink-dim">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.playerCount} joueur{c.playerCount !== 1 ? "s" : ""}</span>
                      <span className="flex items-center gap-1"><Contact className="w-3.5 h-3.5" />{c.contactCount} contact{c.contactCount !== 1 ? "s" : ""}</span>
                    </div>
                  </button>
                  {canEdit && (
                    <div className="flex gap-1 mt-3 pt-2 border-t border-line">
                      <button onClick={() => startEdit(c)} className="btn btn-ghost px-2 py-1 text-xs"><Pencil className="w-3.5 h-3.5" />Modifier</button>
                      <button onClick={() => removeClub(c)} className="btn btn-ghost px-2 py-1 text-xs text-red-300"><Trash2 className="w-3.5 h-3.5" />Supprimer</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-ink-dim col-span-full">Aucun club trouvé.</p>}
        </div>
      )}
    </div>
  );
}
