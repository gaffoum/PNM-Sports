import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { listPortfolioPlayers } from "../hooks/usePortfolio";
import { formatDateFr, formatMoney } from "../lib/utils";

export default function Portfolio() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setPlayers(await listPortfolioPlayers());
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = useMemo(() => players.reduce((sum, p) => sum + Number(p.valeur_estimee_eur || 0), 0), [players]);

  const byPoste = useMemo(() => {
    const map = new Map();
    for (const p of players) {
      const key = p.poste || "Non renseigné";
      map.set(key, (map.get(key) || 0) + Number(p.valeur_estimee_eur || 0));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [players]);

  const maxPoste = byPoste.length ? byPoste[0][1] : 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl flex items-center gap-2"><Wallet className="w-7 h-7 text-cyan-bright" />Portefeuille &amp; valorisation</h1>
        <p className="text-ink-dim text-sm">Vue consolidée de la valeur estimée du portefeuille joueurs.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="panel px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Valorisation totale</div>
          <div className="font-display font-bold text-2xl mt-0.5 text-cyan-bright">{formatMoney(total)}</div>
        </div>
        <div className="panel px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">Joueurs valorisés</div>
          <div className="font-display font-bold text-2xl mt-0.5">{players.length}</div>
        </div>
      </div>

      {byPoste.length > 0 && (
        <div className="panel p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-2">Répartition par poste</div>
          {byPoste.map(([poste, value]) => (
            <div key={poste} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-dim">{poste}</span>
                <span className="font-semibold">{formatMoney(value)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-bg-1 overflow-hidden">
                <div className="h-full bg-cyan-bright" style={{ width: `${Math.max(4, (value / maxPoste) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-ink-muted border-b border-line">
                <th className="px-4 py-2.5">Joueur</th>
                <th className="px-4 py-2.5">Poste</th>
                <th className="px-4 py-2.5">Club actuel</th>
                <th className="px-4 py-2.5">Fin de contrat</th>
                <th className="px-4 py-2.5">Agent référent</th>
                <th className="px-4 py-2.5 text-right">Valeur estimée</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-line/10">
                  <td className="px-4 py-2.5"><Link to={`/players/${p.id}`} className="font-medium hover:text-cyan-bright">{p.prenom} {p.nom}</Link></td>
                  <td className="px-4 py-2.5 text-ink-dim">{p.poste ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-dim">{p.club_actuel ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-dim">{formatDateFr(p.fin_contrat)}</td>
                  <td className="px-4 py-2.5 text-ink-dim">{p.agent ? `${p.agent.prenom} ${p.agent.nom}` : "—"}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-cyan-bright">{formatMoney(p.valeur_estimee_eur)}</td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-dim">Aucun joueur valorisé pour l'instant.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
