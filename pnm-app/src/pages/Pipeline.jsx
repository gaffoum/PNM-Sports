import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { listAllDeals, createDeal, updateDeal, deleteDeal } from "../hooks/useDeals";
import { listPlayersBasic } from "../hooks/usePlayers";
import { listClubsBasic } from "../hooks/useClubs";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../contexts/ConfirmContext";
import { formatMoney } from "../lib/utils";
import {
  DEAL_STATUTS, DEAL_KANBAN_STATUTS, DEAL_TERMINAL_STATUTS, DEAL_TYPES,
  dealTypeLabel, dealStatutDotClass,
} from "../lib/dealPipeline";
import AutocompleteInput from "../components/common/AutocompleteInput";

const EMPTY_FORM = { playerName: "", clubName: "", type: "transfert", montant_propose: "", notes: "" };

function DealCard({ d, onMove, onDelete }) {
  const nav = useNavigate();
  return (
    <div className="panel p-3 space-y-2">
      <button onClick={() => nav(`/players/${d.player?.id}`)} className="flex items-center gap-2 w-full text-left">
        {d.player?.photo_url ? (
          <img src={d.player.photo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-line" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-bg-1 border border-line grid place-items-center text-[10px] text-ink-muted">
            {(d.player?.prenom?.[0] ?? "") + (d.player?.nom?.[0] ?? "")}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{d.player ? `${d.player.prenom} ${d.player.nom}` : "Joueur supprimé"}</div>
          <div className="text-[11px] text-ink-dim truncate">{d.club?.nom ?? "Club supprimé"}</div>
        </div>
      </button>
      <div className="flex items-center justify-between text-[11px] text-ink-muted">
        <span>{dealTypeLabel(d.type)}</span>
        {d.montant_propose != null && <span>{formatMoney(d.montant_propose)}</span>}
      </div>
      <select className="input py-1 text-xs" value={d.statut} onChange={(e) => onMove(d, e.target.value)}>
        {DEAL_STATUTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
      <button onClick={() => onDelete(d)} className="btn btn-ghost text-xs w-full justify-center">
        <Trash2 className="w-3.5 h-3.5 text-red-300" />
      </button>
    </div>
  );
}

function Column({ statut, deals, onMove, onDelete }) {
  return (
    <div className="min-w-0 flex flex-col">
      <div className="flex items-center justify-between gap-1 px-1 pb-2 mb-2 border-b border-line">
        <span className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dealStatutDotClass(statut.key)}`} />
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-dim whitespace-nowrap truncate">{statut.label}</span>
        </span>
        <span className="text-[10px] text-ink-muted bg-bg-1 border border-line rounded-full px-2 py-0.5 shrink-0">{deals.length}</span>
      </div>
      <div className="space-y-2 flex-1 min-h-[40px]">
        {deals.map((d) => <DealCard key={d.id} d={d} onMove={onMove} onDelete={onDelete} />)}
        {deals.length === 0 && <div className="text-[11px] text-ink-muted italic px-1">—</div>}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const { agent } = useAuth();
  const confirm = useConfirm();
  const [deals, setDeals] = useState([]);
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [d, p, c] = await Promise.all([listAllDeals(), listPlayersBasic(), listClubsBasic()]);
      setDeals(d); setPlayers(p); setClubs(c);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const playerNames = players.map((p) => `${p.prenom} ${p.nom}`);
  const clubNames = clubs.map((c) => c.nom);

  async function submitCreate(e) {
    e.preventDefault();
    const player = players.find((p) => `${p.prenom} ${p.nom}`.toLowerCase() === form.playerName.trim().toLowerCase());
    const club = clubs.find((c) => c.nom.toLowerCase() === form.clubName.trim().toLowerCase());
    if (!player) return toast.error("Sélectionne un joueur existant dans la liste.");
    if (!club) return toast.error("Sélectionne un club existant dans la liste.");
    setCreating(true);
    try {
      const created = await createDeal({
        player_id: player.id,
        club_id: club.id,
        type: form.type,
        montant_propose: form.montant_propose ? Number(form.montant_propose) : null,
        notes: form.notes.trim() || null,
        agent_id: agent.id,
      });
      setDeals((ds) => [created, ...ds]);
      setForm(EMPTY_FORM);
      setShowAdd(false);
      toast.success("Deal ajouté");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function onMove(deal, statut) {
    if (deal.statut === statut) return;
    setDeals((ds) => ds.map((d) => (d.id === deal.id ? { ...d, statut } : d)));
    try {
      await updateDeal(deal.id, { statut });
    } catch (e) {
      toast.error(e.message);
      load();
    }
  }

  async function onDelete(deal) {
    const ok = await confirm({
      title: "Supprimer ce deal ?",
      message: `${deal.player?.prenom} ${deal.player?.nom} — ${deal.club?.nom}`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDeal(deal.id);
      setDeals((ds) => ds.filter((d) => d.id !== deal.id));
      toast.success("Deal supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  }

  const by = (key) => deals.filter((d) => d.statut === key);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl">Pipeline transferts &amp; mandats</h1>
          <p className="text-ink-dim text-sm">Suivi des négociations joueur ↔ club · {deals.length} deal{deals.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd((v) => !v)} className="btn btn-primary"><Plus className="w-4 h-4" />Ajouter un deal</button>
          <button onClick={() => setShowArchived((v) => !v)} className="btn btn-ghost text-xs">
            {showArchived ? "Masquer" : "Afficher"} Refusé / Abandonné
          </button>
          <button onClick={load} className="btn btn-outline text-xs"><RefreshCw className="w-4 h-4" />Rafraîchir</button>
        </div>
      </header>

      {showAdd && (
        <form onSubmit={submitCreate} className="panel p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <AutocompleteInput placeholder="Joueur…" options={playerNames} value={form.playerName} onChange={(v) => setForm({ ...form, playerName: v })} />
            <AutocompleteInput placeholder="Club…" options={clubNames} value={form.clubName} onChange={(v) => setForm({ ...form, clubName: v })} />
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {DEAL_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <input className="input" type="number" placeholder="Montant proposé (€)" value={form.montant_propose} onChange={(e) => setForm({ ...form, montant_propose: e.target.value })} />
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
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-2">
            {DEAL_KANBAN_STATUTS.map((s) => (
              <Column key={s.key} statut={s} deals={by(s.key)} onMove={onMove} onDelete={onDelete} />
            ))}
          </div>
          {showArchived && (
            <div className="grid grid-cols-2 gap-3 pb-2 border-t border-line pt-4">
              {DEAL_TERMINAL_STATUTS.map((s) => (
                <Column key={s.key} statut={s} deals={by(s.key)} onMove={onMove} onDelete={onDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
