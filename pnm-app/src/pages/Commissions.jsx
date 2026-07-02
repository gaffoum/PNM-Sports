import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { listAllCommissions, createCommission, updateCommission, deleteCommission } from "../hooks/useCommissions";
import { listAllDeals } from "../hooks/useDeals";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../contexts/ConfirmContext";
import { formatDateFr, formatMoney } from "../lib/utils";
import { COMMISSION_STATUTS, commissionStatutLabel, commissionStatutBadgeClass } from "../lib/commissions";
import AutocompleteInput from "../components/common/AutocompleteInput";

const EMPTY_FORM = { dealLabel: "", montant: "", statut: "attendue", date_echeance: "", notes: "" };

function dealLabel(d) {
  return `${d.player?.prenom ?? "?"} ${d.player?.nom ?? "?"} → ${d.club?.nom ?? "?"}`;
}

export default function Commissions() {
  const { agent } = useAuth();
  const confirm = useConfirm();
  const [commissions, setCommissions] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ montant: "", statut: "attendue", date_echeance: "", notes: "" });

  async function load() {
    setLoading(true);
    try {
      const [c, d] = await Promise.all([listAllCommissions(), listAllDeals()]);
      setCommissions(c); setDeals(d);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const dealLabels = deals.map(dealLabel);
  const totalAttendu = useMemo(
    () => commissions.filter((c) => c.statut !== "encaissee").reduce((sum, c) => sum + Number(c.montant || 0), 0),
    [commissions]
  );
  const totalEncaisse = useMemo(
    () => commissions.filter((c) => c.statut === "encaissee").reduce((sum, c) => sum + Number(c.montant || 0), 0),
    [commissions]
  );

  async function submitCreate(e) {
    e.preventDefault();
    const deal = deals.find((d) => dealLabel(d).toLowerCase() === form.dealLabel.trim().toLowerCase());
    if (!deal) return toast.error("Sélectionne un deal existant dans la liste (crée-le d'abord depuis /pipeline).");
    if (!form.montant) return toast.error("Montant requis.");
    setCreating(true);
    try {
      const created = await createCommission({
        deal_id: deal.id,
        montant: Number(form.montant),
        statut: form.statut,
        date_echeance: form.date_echeance || null,
        notes: form.notes.trim() || null,
        agent_id: agent.id,
      });
      setCommissions((cs) => [created, ...cs]);
      setForm(EMPTY_FORM);
      setShowAdd(false);
      toast.success("Commission ajoutée");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditForm({ montant: c.montant, statut: c.statut, date_echeance: c.date_echeance ?? "", notes: c.notes ?? "" });
  }

  async function saveEdit(c) {
    try {
      const updated = await updateCommission(c.id, {
        montant: Number(editForm.montant),
        statut: editForm.statut,
        date_echeance: editForm.date_echeance || null,
        notes: editForm.notes.trim() || null,
      });
      setCommissions((cs) => cs.map((x) => (x.id === c.id ? updated : x)));
      setEditingId(null);
      toast.success("Commission mise à jour");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(c) {
    const ok = await confirm({ title: "Supprimer cette commission ?", message: formatMoney(c.montant), confirmLabel: "Supprimer", danger: true });
    if (!ok) return;
    try {
      await deleteCommission(c.id);
      setCommissions((cs) => cs.filter((x) => x.id !== c.id));
      toast.success("Commission supprimée");
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl">Commissions &amp; revenus</h1>
          <p className="text-ink-dim text-sm">Suivi des commissions par deal.</p>
        </div>
        <button onClick={() => setShowAdd((v) => !v)} className="btn btn-primary"><Plus className="w-4 h-4" />Ajouter une commission</button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="panel px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Revenu prévisionnel (hors encaissé)</div>
          <div className="font-display font-bold text-xl mt-0.5 text-cyan-bright">{formatMoney(totalAttendu)}</div>
        </div>
        <div className="panel px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Encaissé</div>
          <div className="font-display font-bold text-xl mt-0.5 text-emerald-300">{formatMoney(totalEncaisse)}</div>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={submitCreate} className="panel p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <AutocompleteInput className="lg:col-span-2" placeholder="Deal (joueur → club)…" options={dealLabels} value={form.dealLabel} onChange={(v) => setForm({ ...form, dealLabel: v })} />
            <input className="input" type="number" placeholder="Montant (€)" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} />
            <input className="input" type="date" value={form.date_echeance} onChange={(e) => setForm({ ...form, date_echeance: e.target.value })} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="input w-auto" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
              {COMMISSION_STATUTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <textarea className="input min-h-[50px]" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="btn btn-primary px-3">{creating ? "…" : "Ajouter"}</button>
            <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }} className="btn btn-ghost px-3">Annuler</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="space-y-3">
          {commissions.length === 0 && <p className="text-ink-dim">Aucune commission enregistrée.</p>}
          {commissions.map((c) => (
            <div key={c.id} className="panel p-4">
              {editingId === c.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input className="input" type="number" value={editForm.montant} onChange={(e) => setEditForm({ ...editForm, montant: e.target.value })} />
                    <input className="input" type="date" value={editForm.date_echeance} onChange={(e) => setEditForm({ ...editForm, date_echeance: e.target.value })} />
                    <select className="input" value={editForm.statut} onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}>
                      {COMMISSION_STATUTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <textarea className="input min-h-[50px]" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(c)} className="btn btn-primary px-2 py-1"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="btn btn-ghost px-2 py-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.deal?.player && (
                        <Link to={`/players/${c.deal.player.id}`} className="font-semibold hover:text-cyan-bright">
                          {c.deal.player.prenom} {c.deal.player.nom}
                        </Link>
                      )}
                      <span className="text-ink-dim text-sm">→ {c.deal?.club?.nom ?? "—"}</span>
                      <span className={`badge ${commissionStatutBadgeClass(c.statut)}`}>{commissionStatutLabel(c.statut)}</span>
                    </div>
                    <div className="font-display font-bold text-lg">{formatMoney(c.montant)}</div>
                    {c.date_echeance && <div className="text-[11px] text-ink-muted">Échéance : {formatDateFr(c.date_echeance)}</div>}
                    {c.notes && <p className="text-sm text-ink-dim whitespace-pre-wrap">{c.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(c)} className="btn btn-ghost p-1.5" title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(c)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
