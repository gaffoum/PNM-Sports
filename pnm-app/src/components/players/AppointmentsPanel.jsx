import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, CalendarClock, MapPin } from "lucide-react";
import { createAppointment, updateAppointment, deleteAppointment } from "../../hooks/useAppointments";
import { useAuth } from "../../hooks/useAuth";
import { useConfirm } from "../../contexts/ConfirmContext";
import { APPOINTMENT_STATUTS, appointmentStatutLabel, appointmentStatutBadgeClass } from "../../lib/appointments";

const EMPTY = { titre: "", date_rdv: "", lieu: "", notes: "", statut: "a_venir" };

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatRdv(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AppointmentsPanel({ playerId, appointments, onChange }) {
  const { agent } = useAuth();
  const confirm = useConfirm();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);

  async function submit(e) {
    e.preventDefault();
    if (!form.titre.trim() || !form.date_rdv) return toast.error("Titre et date/heure requis.");
    setSaving(true);
    try {
      const created = await createAppointment({
        player_id: playerId,
        titre: form.titre.trim(),
        date_rdv: new Date(form.date_rdv).toISOString(),
        lieu: form.lieu.trim() || null,
        notes: form.notes.trim() || null,
        statut: form.statut,
        agent_id: agent.id,
      });
      onChange([...appointments, created].sort((a, b) => new Date(a.date_rdv) - new Date(b.date_rdv)));
      setForm(EMPTY);
      setShowAdd(false);
      toast.success("Rendez-vous ajouté");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(a) {
    setEditingId(a.id);
    setEditForm({ titre: a.titre, date_rdv: toLocalInput(a.date_rdv), lieu: a.lieu ?? "", notes: a.notes ?? "", statut: a.statut });
  }

  async function saveEdit(a) {
    if (!editForm.titre.trim() || !editForm.date_rdv) return toast.error("Titre et date/heure requis.");
    try {
      const updated = await updateAppointment(a.id, {
        titre: editForm.titre.trim(),
        date_rdv: new Date(editForm.date_rdv).toISOString(),
        lieu: editForm.lieu.trim() || null,
        notes: editForm.notes.trim() || null,
        statut: editForm.statut,
      });
      onChange(appointments.map((x) => (x.id === a.id ? updated : x)).sort((x, y) => new Date(x.date_rdv) - new Date(y.date_rdv)));
      setEditingId(null);
      toast.success("Rendez-vous mis à jour");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(a) {
    const ok = await confirm({ title: "Supprimer ce rendez-vous ?", message: a.titre, confirmLabel: "Supprimer", danger: true });
    if (!ok) return;
    try {
      await deleteAppointment(a.id);
      onChange(appointments.filter((x) => x.id !== a.id));
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="panel p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Agenda &amp; rendez-vous</h3>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} className="btn btn-ghost text-xs px-2 py-1">
            <Plus className="w-3.5 h-3.5" />Ajouter
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={submit} className="bg-bg-1 border border-line rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className="input" placeholder="Titre (ex. RDV 1 avec le club)" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            <input className="input" type="datetime-local" value={form.date_rdv} onChange={(e) => setForm({ ...form, date_rdv: e.target.value })} />
            <input className="input" placeholder="Lieu" value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} />
            <select className="input" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
              {APPOINTMENT_STATUTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <textarea className="input min-h-[50px]" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn btn-primary px-3"><Check className="w-4 h-4" />{saving ? "…" : "Ajouter"}</button>
            <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY); }} className="btn btn-ghost px-3">Annuler</button>
          </div>
        </form>
      )}

      {appointments.length === 0 && <p className="text-sm text-ink-dim">Aucun rendez-vous programmé.</p>}
      <ul className="divide-y divide-line">
        {appointments.map((a) => (
          <li key={a.id} className="py-2.5">
            {editingId === a.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input className="input" value={editForm.titre} onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })} />
                  <input className="input" type="datetime-local" value={editForm.date_rdv} onChange={(e) => setEditForm({ ...editForm, date_rdv: e.target.value })} />
                  <input className="input" placeholder="Lieu" value={editForm.lieu} onChange={(e) => setEditForm({ ...editForm, lieu: e.target.value })} />
                  <select className="input" value={editForm.statut} onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}>
                    {APPOINTMENT_STATUTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <textarea className="input min-h-[50px]" placeholder="Notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(a)} className="btn btn-primary px-2 py-1"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingId(null)} className="btn btn-ghost px-2 py-1"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{a.titre}</span>
                    <span className={`badge ${appointmentStatutBadgeClass(a.statut)}`}>{appointmentStatutLabel(a.statut)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-ink-muted mt-1">
                    <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{formatRdv(a.date_rdv)}</span>
                    {a.lieu && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.lieu}</span>}
                  </div>
                  {a.notes && <p className="text-sm text-ink-dim whitespace-pre-wrap mt-1">{a.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(a)} className="btn btn-ghost p-1.5" title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(a)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
