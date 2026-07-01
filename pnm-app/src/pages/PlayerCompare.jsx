import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { getPlayerById, getPlayerStats } from "../hooks/usePlayers";
import { calcAge, formatDateFr, formatMoney } from "../lib/utils";
import { stepLabel, stepBadgeClass } from "../lib/recruitment";

function Row({ label, cells }) {
  return (
    <tr className="border-b border-line/60">
      <td className="px-4 py-2.5 text-[11px] uppercase tracking-wider text-ink-muted whitespace-nowrap">{label}</td>
      {cells.map((c, i) => (
        <td key={i} className="px-4 py-2.5 text-sm font-medium">{c ?? "—"}</td>
      ))}
    </tr>
  );
}

export default function PlayerCompare() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);
  const [players, setPlayers] = useState([]);
  const [statsByPlayer, setStatsByPlayer] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (ids.length < 2) { setLoading(false); return; }
      setLoading(true);
      try {
        const [ps, statsArrays] = await Promise.all([
          Promise.all(ids.map((id) => getPlayerById(id))),
          Promise.all(ids.map((id) => getPlayerStats(id))),
        ]);
        if (!active) return;
        setPlayers(ps);
        const byId = {};
        ids.forEach((id, i) => { byId[id] = statsArrays[i]?.[0] ?? null; });
        setStatsByPlayer(byId);
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (ids.length < 2) {
    return (
      <div className="space-y-4">
        <p className="text-ink-dim">Sélectionne au moins 2 joueurs depuis la liste pour les comparer.</p>
        <Link to="/players" className="btn btn-outline"><ArrowLeft className="w-4 h-4" />Retour aux joueurs</Link>
      </div>
    );
  }

  if (loading) return <div className="text-ink-dim">Chargement…</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => nav("/players")} className="btn btn-ghost text-xs"><ArrowLeft className="w-4 h-4" />Liste</button>

      <header>
        <h1 className="text-3xl">Comparaison de joueurs</h1>
        <p className="text-ink-dim text-sm">{players.length} joueurs sélectionnés</p>
      </header>

      <div className="panel overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-3 w-40"></th>
              {players.map((p) => (
                <th key={p.id} className="px-4 py-3 text-left">
                  <Link to={`/players/${p.id}`} className="flex items-center gap-3 hover:text-cyan-bright">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border border-line" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-bg-1 border border-line grid place-items-center text-xs text-ink-muted">
                        {(p.prenom?.[0] ?? "") + (p.nom?.[0] ?? "")}
                      </div>
                    )}
                    <span>
                      <span className="block font-display font-bold">{p.prenom} {p.nom}</span>
                      <span className="flex items-center gap-1.5 mt-1">
                        <span className={`badge ${p.statut === "joueur" ? "badge-joueur" : "badge-prospect"}`}>{p.statut}</span>
                        <span className={`badge ${stepBadgeClass(p.recruitment_step)}`}>{stepLabel(p.recruitment_step)}</span>
                      </span>
                    </span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Poste" cells={players.map((p) => p.poste)} />
            <Row label="Nationalité" cells={players.map((p) => p.nationalite)} />
            <Row label="Âge" cells={players.map((p) => calcAge(p.date_naissance))} />
            <Row label="Pied fort" cells={players.map((p) => p.pied_fort)} />
            <Row label="Taille" cells={players.map((p) => p.taille_cm ? `${p.taille_cm} cm` : null)} />
            <Row label="Poids" cells={players.map((p) => p.poids_kg ? `${p.poids_kg} kg` : null)} />
            <Row label="Club actuel" cells={players.map((p) => p.club_actuel)} />
            <Row label="Club précédent" cells={players.map((p) => p.club_precedent)} />
            <Row label="Fin de contrat" cells={players.map((p) => formatDateFr(p.fin_contrat))} />
            <Row label="Valeur estimée" cells={players.map((p) => formatMoney(p.valeur_estimee_eur))} />
            <Row label="Agent référent" cells={players.map((p) => p.agent ? `${p.agent.prenom} ${p.agent.nom}` : null)} />
            <Row label="Saison (dernière)" cells={players.map((p) => statsByPlayer[p.id]?.saison)} />
            <Row label="Matchs" cells={players.map((p) => statsByPlayer[p.id]?.matchs)} />
            <Row label="Buts" cells={players.map((p) => statsByPlayer[p.id]?.buts)} />
            <Row label="Passes" cells={players.map((p) => statsByPlayer[p.id]?.passes)} />
            <Row label="Minutes jouées" cells={players.map((p) => statsByPlayer[p.id]?.minutes_jouees)} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
