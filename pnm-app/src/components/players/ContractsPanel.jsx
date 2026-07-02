import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { createContract, updateContract, deleteContract } from "../../hooks/useContracts";
import { listClubsBasic } from "../../hooks/useClubs";
import { useConfirm } from "../../contexts/ConfirmContext";
import { formatDateFr, formatMoney } from "../../lib/utils";
import AutocompleteInput from "../common/AutocompleteInput";

const EMPTY = { clubNom: "", date_debut: "", date_fin: "", salaire_annuel: "", clause_liberatoire: "", notes: "" };

export default function ContractsPanel({ playerId, contracts, onChange }) {
  const confirm = useConfirm();
  const [clubs, setClubs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);

  useEffect(() => { listClubsBasic().then(setClubs).catch(() => {}); }, []);
  const clubNames = clubs.map((c) => c.nom);

  async function submit(e) {
    e.preventDefault();
    const club = clubs.find((c) => c.nom.toLowerCase() === form.clubNom.trim().toLowerCase());
    setSaving(true);
    try {
      const created = await createContract({
        player_id: playerId,
        club_id: club?.id ?? null,
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
        salaire_annuel: form.salaire_annuel ? Number(form.salaire_annuel) : null,
        clause_liberatoire: form.clause_liberatoire.trim() || null,
        notes: form.notes.trim() || null,
      });
      onChange([created, ...contracts]);
      setForm(EMPTY);
      setShowAdd(false);
      toast.success("Contrat ajouté");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditForm({
      clubNom: c.club?.nom ?? "",
      date_debut: c.date_debut ?? "",
      date_fin: c.date_fin ?? "",
      salaire_annuel: c.salaire_annuel ?? "",
      clause_liberatoire: c.clause_liberatoire ?? "",
      notes: c.notes ?? "",
    });
  }

  async function saveEdit(c) {
    const club = clubs.find((x) => x.nom.toLowerCase() === editForm.clubNom.trim().toLowerCase());
    try {
      const updated = await updateContract(c.id, {
        club_id: club?.id ?? null,
        date_debut: editForm.date_debut || null,
        date_fin: editForm.date_fin || null,
        salaire_annuel: editForm.salaire_annuel ? Number(editForm.salaire_annuel) : null,
        clause_liberatoire: editForm.clause_liberatoire.trim() || null,
        notes: editForm.notes.trim() || null,
      });
      onChange(contracts.map((x) => (x.id === c.id ? updated : x)));
      setEditingId(null);
      toast.success("Contrat mis à jour");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(c) {
    const ok = await confirm({
      title: "Supprimer ce contrat ?",
      message: c.club?.nom ?? "Contrat sans club précisé",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteContract(c.id);
      onChange(contracts.filter((x) => x.id !== c.id));
      toast.success("Contrat supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="panel p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Contrats</h3>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} className="btn btn-ghost text-xs px-2 py-1">
            <Plus className="w-3.5 h-3.5" />Ajouter
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={submit} className="bg-bg-1 border border-line rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <AutocompleteInput placeholder="Club" options={clubNames} value={form.clubNom} onChange={(v) => setForm({ ...form, clubNom: v })} />
            <input className="input" type="number" placeholder="Salaire annuel (€)" value={form.salaire_annuel} onChange={(e) => setForm({ ...form, salaire_annuel: e.target.value })} />
            <div>
              <label className="label">Début</label>
              <input className="input" type="date" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} />
            </div>
            <div>
              <label className="label">Fin</label>
              <input className="input" type="date" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} />
            </div>
          </div>
          <input className="input" placeholder="Clause libératoire" value={form.clause_liberatoire} onChange={(e) => setForm({ ...form, clause_liberatoire: e.target.value })} />
          <textarea className="input min-h-[50px]" placeholder="Notes (renouvellement, options…)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn btn-primary px-3"><Check className="w-4 h-4" />{saving ? "…" : "Ajouter"}</button>
            <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY); }} className="btn btn-ghost px-3">Annuler</button>
          </div>
        </form>
      )}

      {contracts.length === 0 && <p className="text-sm text-ink-dim">Aucun contrat détaillé enregistré.</p>}
      <ul className="divide-y divide-line">
        {contracts.map((c) => (
          <li key={c.id} className="py-2.5">
            {editingId === c.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <AutocompleteInput placeholder="Club" options={clubNames} value={editForm.clubNom} onChange={(v) => setEditForm({ ...editForm, clubNom: v })} />
                  <input className="input" type="number" placeholder="Salaire annuel (€)" value={editForm.salaire_annuel} onChange={(e) => setEditForm({ ...editForm, salaire_annuel: e.target.value })} />
                  <input className="input" type="date" value={editForm.date_debut} onChange={(e) => setEditForm({ ...editForm, date_debut: e.target.value })} />
                  <input className="input" type="date" value={editForm.date_fin} onChange={(e) => setEditForm({ ...editForm, date_fin: e.target.value })} />
                </div>
                <input className="input" placeholder="Clause libératoire" value={editForm.clause_liberatoire} onChange={(e) => setEditForm({ ...editForm, clause_liberatoire: e.target.value })} />
                <textarea className="input min-h-[50px]" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(c)} className="btn btn-primary px-2 py-1"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingId(null)} className="btn btn-ghost px-2 py-1"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{c.club?.nom ?? "Club non précisé"}</div>
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    {formatDateFr(c.date_debut)} → {formatDateFr(c.date_fin)}
                    {c.salaire_annuel != null && <> · {formatMoney(c.salaire_annuel)}/an</>}
                  </div>
                  {c.clause_liberatoire && <div className="text-[11px] text-ink-muted">Clause libératoire : {c.clause_liberatoire}</div>}
                  {c.notes && <p className="text-sm text-ink-dim whitespace-pre-wrap mt-1">{c.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(c)} className="btn btn-ghost p-1.5" title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(c)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
