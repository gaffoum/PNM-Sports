import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, X, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { logActivity } from "../lib/logActivity";
import {
  STEPS, KANBAN_STEPS, TERMINAL_STEPS,
  statutForStep, stepLabel, stepShort, stepCardClass,
} from "../lib/recruitment";

const SELECT_FIELDS =
  "id, nom, prenom, poste, club_actuel, photo_url, recruitment_step, statut, agent:agents!players_agent_referent_fkey(prenom, nom)";

function Card({ p, onMove }) {
  const nav = useNavigate();
  return (
    <div className={`panel p-3 ${stepCardClass(p.recruitment_step)} space-y-2`}>
      <button
        onClick={() => nav(`/players/${p.id}`)}
        className="flex items-center gap-2 w-full text-left"
      >
        {p.photo_url ? (
          <img src={p.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-line" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-bg-1 border border-line grid place-items-center text-[10px] text-ink-muted">
            {(p.prenom?.[0] ?? "") + (p.nom?.[0] ?? "")}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{p.prenom} {p.nom}</div>
          <div className="text-[11px] text-ink-dim truncate">
            {[p.poste, p.club_actuel].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
      </button>

      <select
        className="input py-1 text-xs"
        value={p.recruitment_step}
        onChange={(e) => onMove(p, e.target.value)}
      >
        {STEPS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>

      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] text-ink-muted truncate">
          {p.agent ? `${p.agent.prenom} ${p.agent.nom}` : "—"}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onMove(p, "accepte")}
            title="Accepté"
            className="p-1 rounded border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMove(p, "ne_pas_suivre")}
            title="Ne pas suivre"
            className="p-1 rounded border border-red-400/30 text-red-300 hover:bg-red-400/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Column({ step, players, onMove }) {
  return (
    <div className="min-w-0 flex flex-col">
      <div className="flex items-center justify-between gap-1 px-1 pb-2 mb-2 border-b border-line">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-dim whitespace-nowrap truncate" title={step.label}>{stepShort(step.key)}</span>
        <span className="text-[10px] text-ink-muted bg-bg-1 border border-line rounded-full px-2 py-0.5 shrink-0">{players.length}</span>
      </div>
      <div className="space-y-2 flex-1 min-h-[40px]">
        {players.map((p) => <Card key={p.id} p={p} onMove={onMove} />)}
        {players.length === 0 && <div className="text-[11px] text-ink-muted italic px-1">—</div>}
      </div>
    </div>
  );
}

export default function Recruitment() {
  const { agent } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("players")
      .select(SELECT_FIELDS)
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    else setPlayers(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function onMove(player, newStep) {
    if (player.recruitment_step === newStep) return;
    const statut = statutForStep(newStep);
    setPlayers((ps) => ps.map((p) => p.id === player.id ? { ...p, recruitment_step: newStep, statut } : p));
    const { error } = await supabase
      .from("players")
      .update({ recruitment_step: newStep, statut })
      .eq("id", player.id);
    if (error) { toast.error(error.message); load(); return; }
    logActivity(agent.id, player.id, "update_step", { from: player.recruitment_step, to: newStep });
    toast.success(`${player.prenom} ${player.nom} → ${stepLabel(newStep)}`);
  }

  const by = (key) => players.filter((p) => p.recruitment_step === key);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl">Recrutement</h1>
          <p className="text-ink-dim text-sm">Tunnel de suivi des prospects · {players.length} fiche{players.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowArchived((v) => !v)} className="btn btn-ghost text-xs">
            {showArchived ? "Masquer" : "Afficher"} Accepté / Ne pas suivre
          </button>
          <button onClick={load} className="btn btn-outline text-xs"><RefreshCw className="w-4 h-4" />Rafraîchir</button>
        </div>
      </header>

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 pb-2">
            {KANBAN_STEPS.map((step) => (
              <Column key={step.key} step={step} players={by(step.key)} onMove={onMove} />
            ))}
          </div>

          {showArchived && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-2 border-t border-line pt-4">
              {TERMINAL_STEPS.map((step) => (
                <Column key={step.key} step={step} players={by(step.key)} onMove={onMove} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
