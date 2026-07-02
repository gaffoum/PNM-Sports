import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { createEvaluation, deleteEvaluation } from "../../hooks/useEvaluations";
import { useAuth } from "../../hooks/useAuth";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useFeatures } from "../../hooks/useFeatures";
import { formatDateFr } from "../../lib/utils";
import { SCOUTING_AXES, evaluationAverage, averageByAxis } from "../../lib/scouting";
import PlayerRadarChart from "./PlayerRadarChart";

const EMPTY = { vitesse: 5, technique: 5, physique: 5, mental: 5, tactique: 5, passes: 5, notes: "" };

export default function ScoutingPanel({ playerId, evaluations, onChange }) {
  const { agent } = useAuth();
  const { hasFeature } = useFeatures();
  const confirm = useConfirm();
  const hasRadar = hasFeature("data_radar_reel");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const latest = evaluations[0] ?? null;
  const avgByAxis = averageByAxis(evaluations);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createEvaluation({
        player_id: playerId,
        agent_id: agent.id,
        ...Object.fromEntries(SCOUTING_AXES.map((a) => [a.key, Number(form[a.key])])),
        notes: form.notes.trim() || null,
      });
      onChange([created, ...evaluations]);
      setForm(EMPTY);
      setShowAdd(false);
      toast.success("Évaluation ajoutée");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(e) {
    const ok = await confirm({ title: "Supprimer cette évaluation ?", message: formatDateFr(e.date_evaluation), confirmLabel: "Supprimer", danger: true });
    if (!ok) return;
    try {
      await deleteEvaluation(e.id);
      onChange(evaluations.filter((x) => x.id !== e.id));
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Scouting interne</h3>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} className="btn btn-ghost text-xs px-2 py-1">
            <Plus className="w-3.5 h-3.5" />Nouvelle évaluation
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={submit} className="bg-bg-1 border border-line rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SCOUTING_AXES.map((ax) => (
              <div key={ax.key}>
                <label className="label flex items-center justify-between">
                  <span>{ax.label}</span>
                  <span className="text-cyan-bright font-semibold">{form[ax.key]}</span>
                </label>
                <input
                  type="range" min="1" max="10" value={form[ax.key]}
                  onChange={(e) => setForm({ ...form, [ax.key]: e.target.value })}
                  className="w-full"
                />
              </div>
            ))}
          </div>
          <textarea className="input min-h-[50px]" placeholder="Notes d'observation" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn btn-primary px-3">{saving ? "…" : "Enregistrer"}</button>
            <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY); }} className="btn btn-ghost px-3">Annuler</button>
          </div>
        </form>
      )}

      {evaluations.length === 0 ? (
        <p className="text-sm text-ink-dim">Aucune évaluation enregistrée.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {hasRadar && (
            <div className="flex flex-col items-center">
              <PlayerRadarChart scores={latest} />
              <p className="text-[11px] text-ink-muted">Dernière évaluation · {formatDateFr(latest.date_evaluation)}</p>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-muted mb-1.5">Moyenne historique</div>
              <div className="grid grid-cols-3 gap-2">
                {SCOUTING_AXES.map((ax) => (
                  <div key={ax.key} className="text-center bg-bg-1 border border-line rounded-lg py-2">
                    <div className="text-[10px] text-ink-muted uppercase">{ax.label}</div>
                    <div className="font-display font-bold text-cyan-bright">{avgByAxis[ax.key] != null ? avgByAxis[ax.key].toFixed(1) : "—"}</div>
                  </div>
                ))}
              </div>
            </div>
            <ul className="divide-y divide-line max-h-72 overflow-y-auto">
              {evaluations.map((ev) => (
                <li key={ev.id} className="py-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {formatDateFr(ev.date_evaluation)} · Moy. {evaluationAverage(ev)?.toFixed(1) ?? "—"}/10
                    </div>
                    <div className="text-[11px] text-ink-muted">{ev.agent ? `${ev.agent.prenom} ${ev.agent.nom}` : "—"}</div>
                    {ev.notes && <p className="text-sm text-ink-dim whitespace-pre-wrap mt-0.5">{ev.notes}</p>}
                  </div>
                  <button onClick={() => remove(ev)} className="btn btn-ghost p-1.5 shrink-0" title="Supprimer">
                    <Trash2 className="w-3.5 h-3.5 text-red-300" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
