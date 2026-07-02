import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { listAllNeeds, createNeed, updateNeed, deleteNeed } from "../hooks/useClubNeeds";
import { listClubsBasic } from "../hooks/useClubs";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../contexts/ConfirmContext";
import { formatDateFr } from "../lib/utils";
import { STATUTS, statutLabel, statutBadgeClass, CRITERE_SUGGESTIONS, POSTE_SUGGESTIONS } from "../lib/clubNeeds";
import AutocompleteInput from "../components/common/AutocompleteInput";
import ClubNeedForm from "../components/clubs/ClubNeedForm";

const EMPTY_FORM = { clubNom: "", poste: "", criteres: [], description: "", statut: "ouvert" };

export default function ClubNeeds() {
  const { agent, isAdmin, can } = useAuth();
  const confirm = useConfirm();
  const canEdit = isAdmin || can("edit_players");

  const [needs, setNeeds] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);

  const [filterClub, setFilterClub] = useState("");
  const [filterPoste, setFilterPoste] = useState("");
  const [filterCritere, setFilterCritere] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [n, c] = await Promise.all([listAllNeeds(), listClubsBasic()]);
      setNeeds(n); setClubs(c);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const clubNames = clubs.map((c) => c.nom);

  async function submitCreate(e) {
    e.preventDefault();
    const club = clubs.find((c) => c.nom.toLowerCase() === form.clubNom.trim().toLowerCase());
    if (!club) return toast.error("Sélectionne un club existant dans la liste (crée-le d'abord depuis /clubs si besoin).");
    setCreating(true);
    try {
      const created = await createNeed({
        club_id: club.id,
        poste: form.poste.trim() || null,
        criteres: form.criteres,
        description: form.description.trim() || null,
        statut: form.statut,
        agent_id: agent.id,
      });
      setNeeds((ns) => [created, ...ns]);
      setForm(EMPTY_FORM);
      setShowCreate(false);
      toast.success("Besoin ajouté");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(n) {
    setEditingId(n.id);
    setEditForm({ clubNom: n.club?.nom ?? "", poste: n.poste ?? "", criteres: n.criteres ?? [], description: n.description ?? "", statut: n.statut });
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const updated = await updateNeed(editingId, {
        poste: editForm.poste.trim() || null,
        criteres: editForm.criteres,
        description: editForm.description.trim() || null,
        statut: editForm.statut,
      });
      setNeeds((ns) => ns.map((n) => (n.id === editingId ? { ...updated, club: n.club } : n)));
      setEditingId(null);
      toast.success("Besoin mis à jour");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function removeNeed(n) {
    const ok = await confirm({
      title: "Supprimer ce besoin ?",
      message: `${n.club?.nom ?? "Club"} — ${n.poste || "poste non précisé"}`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteNeed(n.id);
      setNeeds((ns) => ns.filter((x) => x.id !== n.id));
      toast.success("Besoin supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  }

  const filtered = needs.filter((n) =>
    (!filterClub.trim() || (n.club?.nom ?? "").toLowerCase().includes(filterClub.trim().toLowerCase())) &&
    (!filterPoste.trim() || (n.poste ?? "").toLowerCase().includes(filterPoste.trim().toLowerCase())) &&
    (!filterCritere.trim() || (n.criteres ?? []).some((c) => c.toLowerCase().includes(filterCritere.trim().toLowerCase()))) &&
    (!filterStatut || n.statut === filterStatut)
  );

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl">Besoins clubs</h1>
          <p className="text-ink-dim text-sm">Demandes de recrutement centralisées, exprimées par les clubs.</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowCreate((v) => !v)} className="btn btn-primary">
            <Plus className="w-4 h-4" />Ajouter un besoin
          </button>
        )}
      </header>

      {showCreate && (
        <div className="panel p-4">
          <ClubNeedForm
            form={form}
            setForm={setForm}
            clubNames={clubNames}
            submitLabel="Ajouter"
            onSubmit={submitCreate}
            onCancel={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
            busy={creating}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <AutocompleteInput className="w-48" placeholder="Club" options={clubNames} value={filterClub} onChange={setFilterClub} />
        <AutocompleteInput className="w-48" placeholder="Poste" options={POSTE_SUGGESTIONS} value={filterPoste} onChange={setFilterPoste} />
        <AutocompleteInput className="w-48" placeholder="Critère" options={CRITERE_SUGGESTIONS} value={filterCritere} onChange={setFilterCritere} />
        <select className="input w-auto" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div key={n.id} className="panel p-4">
              {editingId === n.id ? (
                <ClubNeedForm
                  form={editForm}
                  setForm={setEditForm}
                  clubNames={clubNames}
                  disableClub
                  submitLabel="Enregistrer"
                  onSubmit={submitEdit}
                  onCancel={() => setEditingId(null)}
                  busy={savingEdit}
                />
              ) : (
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/clubs/${encodeURIComponent(n.club?.nom ?? "")}`} className="font-semibold flex items-center gap-1.5 hover:text-cyan-bright">
                        <Building2 className="w-3.5 h-3.5" />{n.club?.nom ?? "Club supprimé"}
                      </Link>
                      <span className={`badge ${statutBadgeClass(n.statut)}`}>{statutLabel(n.statut)}</span>
                    </div>
                    {n.poste && <div className="text-sm font-medium">{n.poste}</div>}
                    {n.criteres?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {n.criteres.map((c) => (
                          <span key={c} className="text-[11px] bg-line/30 border border-line rounded-full px-2 py-0.5 text-ink-dim">{c}</span>
                        ))}
                      </div>
                    )}
                    {n.description && <p className="text-sm text-ink-dim whitespace-pre-wrap">{n.description}</p>}
                    <div className="text-[11px] text-ink-muted">{formatDateFr(n.created_at)}</div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(n)} className="btn btn-ghost p-1.5" title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeNeed(n)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-ink-dim">Aucun besoin trouvé.</p>}
        </div>
      )}
    </div>
  );
}
