import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Phone, Mail, Users, StickyNote } from "lucide-react";
import { createInteraction, updateInteraction, deleteInteraction } from "../../hooks/usePlayerInteractions";
import { useAuth } from "../../hooks/useAuth";
import { useConfirm } from "../../contexts/ConfirmContext";
import { formatDateFr } from "../../lib/utils";
import { INTERACTION_TYPES, interactionLabel } from "../../lib/playerInteractions";

const ICONS = { appel: Phone, email: Mail, reunion: Users, note: StickyNote };

export default function InteractionsPanel({ playerId, interactions, onChange }) {
  const { agent } = useAuth();
  const confirm = useConfirm();
  const [type, setType] = useState("note");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      const created = await createInteraction({ player_id: playerId, type, note: note.trim(), agent_id: agent.id });
      onChange([created, ...interactions]);
      setNote("");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(i) {
    setEditingId(i.id);
    setEditingText(i.note);
  }

  async function saveEdit(i) {
    if (!editingText.trim()) return toast.error("La note ne peut pas être vide.");
    try {
      const updated = await updateInteraction(i.id, editingText.trim());
      onChange(interactions.map((x) => (x.id === i.id ? updated : x)));
      setEditingId(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(i) {
    const ok = await confirm({ title: "Supprimer cette interaction ?", confirmLabel: "Supprimer", danger: true });
    if (!ok) return;
    try {
      await deleteInteraction(i.id);
      onChange(interactions.filter((x) => x.id !== i.id));
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="panel p-5 space-y-3">
      <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Historique d'interactions</h3>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)}>
            {INTERACTION_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        <textarea
          className="input min-h-[60px]"
          placeholder="Détail de l'appel, du mail, de la réunion…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit" disabled={saving} className="btn btn-outline w-fit">
          <Plus className="w-4 h-4" />{saving ? "…" : "Ajouter"}
        </button>
      </form>

      {interactions.length === 0 && <p className="text-sm text-ink-dim">Aucune interaction enregistrée.</p>}
      <ul className="divide-y divide-line">
        {interactions.map((i) => {
          const Icon = ICONS[i.type] ?? StickyNote;
          return (
            <li key={i.id} className="py-2.5">
              {editingId === i.id ? (
                <div className="space-y-2">
                  <textarea className="input min-h-[60px]" value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(i)} className="btn btn-primary px-2 py-1"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="btn btn-ghost px-2 py-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-muted uppercase tracking-wider">
                      <Icon className="w-3.5 h-3.5" />{interactionLabel(i.type)}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(i)} className="btn btn-ghost p-1.5" title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(i)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap mt-1">{i.note}</p>
                  <div className="text-[11px] text-ink-muted mt-1">
                    {i.agent ? `${i.agent.prenom} ${i.agent.nom}` : "—"} · {formatDateFr(i.created_at)}
                    {i.updated_at && <> · modifiée le {formatDateFr(i.updated_at)}</>}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
