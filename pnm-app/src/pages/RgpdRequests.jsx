import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, ScrollText } from "lucide-react";
import { listRgpdRequests, createRgpdRequest, updateRgpdRequest, deleteRgpdRequest } from "../hooks/useRgpdRequests";
import { listPlayersBasic } from "../hooks/usePlayers";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../contexts/ConfirmContext";
import { formatDateFr } from "../lib/utils";
import { RGPD_TYPES, RGPD_STATUTS, rgpdTypeLabel, rgpdStatutLabel, rgpdStatutBadgeClass } from "../lib/rgpd";
import AutocompleteInput from "../components/common/AutocompleteInput";

const EMPTY_FORM = { playerLabel: "", player_nom: "", type: "acces", notes: "" };

function playerLabel(p) {
  return `${p.prenom} ${p.nom}`;
}

export default function RgpdRequests() {
  const { agent } = useAuth();
  const confirm = useConfirm();
  const [requests, setRequests] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ statut: "recue", date_traitement: "", notes: "" });

  async function load() {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([listRgpdRequests(), listPlayersBasic()]);
      setRequests(r); setPlayers(p);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const playerLabels = players.map(playerLabel);

  async function submitCreate(e) {
    e.preventDefault();
    const player = players.find((p) => playerLabel(p).toLowerCase() === form.playerLabel.trim().toLowerCase());
    const playerNom = player ? playerLabel(player) : form.player_nom.trim();
    if (!playerNom) return toast.error("Indique le nom du joueur/prospect concerné.");
    setCreating(true);
    try {
      const created = await createRgpdRequest({
        player_id: player?.id ?? null,
        player_nom: playerNom,
        type: form.type,
        notes: form.notes.trim() || null,
        agent_id: agent.id,
      });
      setRequests((rs) => [created, ...rs]);
      setForm(EMPTY_FORM);
      setShowAdd(false);
      toast.success("Demande RGPD enregistrée");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(r) {
    setEditingId(r.id);
    setEditForm({ statut: r.statut, date_traitement: r.date_traitement ?? "", notes: r.notes ?? "" });
  }

  async function saveEdit(r) {
    try {
      const updated = await updateRgpdRequest(r.id, {
        statut: editForm.statut,
        date_traitement: editForm.date_traitement || null,
        notes: editForm.notes.trim() || null,
      });
      setRequests((rs) => rs.map((x) => (x.id === r.id ? updated : x)));
      setEditingId(null);
      toast.success("Demande mise à jour");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(r) {
    const ok = await confirm({ title: "Supprimer cette demande RGPD ?", message: r.player_nom, confirmLabel: "Supprimer", danger: true });
    if (!ok) return;
    try {
      await deleteRgpdRequest(r.id);
      setRequests((rs) => rs.filter((x) => x.id !== r.id));
      toast.success("Demande supprimée");
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl flex items-center gap-2"><ScrollText className="w-7 h-7 text-cyan-bright" />Demandes RGPD</h1>
          <p className="text-ink-dim text-sm">Registre des demandes d'accès, rectification, suppression, opposition ou portabilité.</p>
        </div>
        <button onClick={() => setShowAdd((v) => !v)} className="btn btn-primary"><Plus className="w-4 h-4" />Nouvelle demande</button>
      </header>

      {showAdd && (
        <form onSubmit={submitCreate} className="panel p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <AutocompleteInput
              placeholder="Joueur / prospect concerné…"
              options={playerLabels}
              value={form.playerLabel}
              onChange={(v) => setForm({ ...form, playerLabel: v, player_nom: v })}
            />
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {RGPD_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <textarea className="input min-h-[50px]" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="btn btn-primary px-3">{creating ? "…" : "Enregistrer"}</button>
            <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }} className="btn btn-ghost px-3">Annuler</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="space-y-3">
          {requests.length === 0 && <p className="text-ink-dim">Aucune demande enregistrée.</p>}
          {requests.map((r) => (
            <div key={r.id} className="panel p-4">
              {editingId === r.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select className="input" value={editForm.statut} onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}>
                      {RGPD_STATUTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <input className="input" type="date" value={editForm.date_traitement} onChange={(e) => setEditForm({ ...editForm, date_traitement: e.target.value })} />
                  </div>
                  <textarea className="input min-h-[50px]" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(r)} className="btn btn-primary px-2 py-1"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="btn btn-ghost px-2 py-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.player ? (
                        <Link to={`/players/${r.player.id}`} className="font-semibold hover:text-cyan-bright">{r.player_nom}</Link>
                      ) : (
                        <span className="font-semibold">{r.player_nom}</span>
                      )}
                      <span className="badge bg-slate-500/15 text-slate-300">{rgpdTypeLabel(r.type)}</span>
                      <span className={`badge ${rgpdStatutBadgeClass(r.statut)}`}>{rgpdStatutLabel(r.statut)}</span>
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      Reçue le {formatDateFr(r.date_reception)}
                      {r.date_traitement && <> · Traitée le {formatDateFr(r.date_traitement)}</>}
                    </div>
                    {r.notes && <p className="text-sm text-ink-dim whitespace-pre-wrap">{r.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(r)} className="btn btn-ghost p-1.5" title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(r)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
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
