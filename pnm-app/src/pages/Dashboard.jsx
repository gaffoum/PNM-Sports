import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, AlertTriangle, Activity, ChevronRight, UserCheck, UserSearch } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { formatDateFr } from "../lib/utils";

function StatCard({ icon: Icon, label, value, tone = "cyan" }) {
  const toneCls = {
    cyan: "text-cyan-bright",
    amber: "text-amber-300",
    violet: "text-violet-300",
  }[tone];
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-bg-1 border border-line grid place-items-center ${toneCls}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">{label}</div>
          <div className="font-display font-bold text-3xl text-ink">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { agent } = useAuth();
  const [counts, setCounts] = useState({ joueurs: 0, prospects: 0, expirent: 0 });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      const sixMonthsStr = sixMonths.toISOString().slice(0, 10);

      const [{ count: cJ }, { count: cP }, { count: cE }, { data: act }] = await Promise.all([
        supabase.from("players").select("id", { count: "exact", head: true }).eq("statut", "joueur"),
        supabase.from("players").select("id", { count: "exact", head: true }).eq("statut", "prospect"),
        supabase.from("players").select("id", { count: "exact", head: true })
          .lte("fin_contrat", sixMonthsStr).gte("fin_contrat", new Date().toISOString().slice(0, 10)),
        supabase.from("activity_log")
          .select("id, action, details, created_at, agent:agents(prenom, nom), player:players(nom, prenom)")
          .order("created_at", { ascending: false }).limit(8),
      ]);
      if (!active) return;
      setCounts({ joueurs: cJ ?? 0, prospects: cP ?? 0, expirent: cE ?? 0 });
      setActivity(act ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl">Bonjour, {agent?.prenom} 👋</h1>
          <p className="text-ink-dim text-sm mt-1">Voici ton tableau de bord PNM.</p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={UserCheck} label="Joueurs signés" value={loading ? "—" : counts.joueurs} tone="cyan" />
        <StatCard icon={UserSearch} label="Prospects suivis" value={loading ? "—" : counts.prospects} tone="violet" />
        <StatCard icon={AlertTriangle} label="Contrats < 6 mois" value={loading ? "—" : counts.expirent} tone="amber" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/players" className="panel panel-hover p-5 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan-bright" />
              <div>
                <div className="font-semibold">Liste des joueurs</div>
                <div className="text-xs text-ink-dim">Rechercher, filtrer, exporter.</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-cyan-bright transition" />
          </div>
        </Link>
        <Link to="/players/new" className="panel panel-hover p-5 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-cyan-bright" />
              <div>
                <div className="font-semibold">Ajouter un joueur</div>
                <div className="text-xs text-ink-dim">Créer une fiche prospect/joueur.</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-cyan-bright transition" />
          </div>
        </Link>
        <Link to="/profile" className="panel panel-hover p-5 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-cyan-bright" />
              <div>
                <div className="font-semibold">Mon profil</div>
                <div className="text-xs text-ink-dim">Mes informations agent.</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-cyan-bright transition" />
          </div>
        </Link>
      </section>

      <section className="panel p-5">
        <header className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-cyan-bright" />
          <h2 className="text-base">Activité récente</h2>
        </header>
        {activity.length === 0 && !loading && (
          <p className="text-sm text-ink-dim">Aucune activité pour l'instant.</p>
        )}
        <ul className="divide-y divide-line">
          {activity.map((a) => (
            <li key={a.id} className="py-2.5 flex items-center justify-between text-sm">
              <span>
                <span className="text-ink-dim">{a.agent?.prenom} {a.agent?.nom}</span>{" "}
                <span className="text-cyan-bright">{a.action}</span>
                {a.player && <> <span className="text-ink-dim">— {a.player.prenom} {a.player.nom}</span></>}
              </span>
              <time className="text-[11px] text-ink-muted">{formatDateFr(a.created_at)}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
