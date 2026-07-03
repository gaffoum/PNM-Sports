import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, AlertTriangle, Activity, ChevronRight, UserCheck, UserSearch, GitMerge, Euro, CalendarClock, ClipboardList } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { useFeatures } from "../hooks/useFeatures";
import { formatDateFr, formatMoney } from "../lib/utils";
import { describeActivity } from "../lib/activityLabels";
import { BRAND } from "../config/brand";

function StatCard({ icon: Icon, label, value, tone = "cyan", to }) {
  const toneCls = {
    cyan: "text-cyan-bright",
    amber: "text-amber-300",
    violet: "text-violet-300",
  }[tone];
  const inner = (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg bg-bg-1 border border-line grid place-items-center ${toneCls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">{label}</div>
        <div className="font-display font-bold text-3xl text-ink">{value}</div>
      </div>
    </div>
  );
  return to
    ? <Link to={to} className="panel panel-hover p-5 block">{inner}</Link>
    : <div className="panel p-5">{inner}</div>;
}

export default function Dashboard() {
  const { agent } = useAuth();
  const { hasFeature } = useFeatures();
  const hasPilotage = hasFeature("pilotage_dashboard");
  const hasPipeline = hasFeature("placement_pipeline");
  const hasCommissions = hasFeature("placement_commissions");
  const hasAgenda = hasFeature("placement_agenda");
  const hasBesoinsClubs = hasFeature("placement_besoins_clubs");
  const [counts, setCounts] = useState({ joueurs: 0, prospects: 0, expirent: 0 });
  const [pilotage, setPilotage] = useState({ pipelineValue: 0, commissionsAttendues: 0, rdvSemaine: 0, besoinsOuverts: 0 });
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

  useEffect(() => {
    if (!hasPilotage) return;
    let active = true;
    (async () => {
      const now = new Date();
      const in7d = new Date();
      in7d.setDate(in7d.getDate() + 7);

      const [deals, commissions, rdv, besoins] = await Promise.all([
        hasPipeline
          ? supabase.from("player_deals").select("montant_propose").eq("statut", "en_discussion")
          : Promise.resolve({ data: [] }),
        hasCommissions
          ? supabase.from("deal_commissions").select("montant").neq("statut", "encaissee")
          : Promise.resolve({ data: [] }),
        hasAgenda
          ? supabase.from("appointments").select("id", { count: "exact", head: true })
              .eq("statut", "a_venir").gte("date_rdv", now.toISOString()).lte("date_rdv", in7d.toISOString())
          : Promise.resolve({ count: 0 }),
        hasBesoinsClubs
          ? supabase.from("club_needs").select("id", { count: "exact", head: true }).eq("statut", "ouvert")
          : Promise.resolve({ count: 0 }),
      ]);
      if (!active) return;
      setPilotage({
        pipelineValue: (deals.data ?? []).reduce((s, d) => s + Number(d.montant_propose || 0), 0),
        commissionsAttendues: (commissions.data ?? []).reduce((s, c) => s + Number(c.montant || 0), 0),
        rdvSemaine: rdv.count ?? 0,
        besoinsOuverts: besoins.count ?? 0,
      });
    })();
    return () => { active = false; };
  }, [hasPilotage, hasPipeline, hasCommissions, hasAgenda, hasBesoinsClubs]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const sixMoStr = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl">Bonjour, {agent?.prenom} 👋</h1>
          <p className="text-ink-dim text-sm mt-1">Voici ton tableau de bord {BRAND.name}.</p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={UserCheck} label="Joueurs signés" value={loading ? "—" : counts.joueurs} tone="cyan" to="/players?statut=joueur" />
        <StatCard icon={UserSearch} label="Prospects suivis" value={loading ? "—" : counts.prospects} tone="violet" to="/players?statut=prospect" />
        <StatCard icon={AlertTriangle} label="Contrats < 6 mois" value={loading ? "—" : counts.expirent} tone="amber" to={`/players?fin_contrat_apres=${todayStr}&fin_contrat_avant=${sixMoStr}`} />
      </section>

      {hasPilotage && (hasPipeline || hasCommissions || hasAgenda || hasBesoinsClubs) && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.18em] text-ink-muted">Vue avancée</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {hasPipeline && <StatCard icon={GitMerge} label="Pipeline en discussion" value={formatMoney(pilotage.pipelineValue)} tone="cyan" to="/pipeline" />}
            {hasCommissions && <StatCard icon={Euro} label="Commissions attendues" value={formatMoney(pilotage.commissionsAttendues)} tone="violet" to="/commissions" />}
            {hasAgenda && <StatCard icon={CalendarClock} label="RDV à venir (7 j)" value={pilotage.rdvSemaine} tone="amber" to="/agenda" />}
            {hasBesoinsClubs && <StatCard icon={ClipboardList} label="Besoins clubs ouverts" value={pilotage.besoinsOuverts} tone="cyan" to="/besoins-clubs" />}
          </div>
        </section>
      )}

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
                <span className="text-ink-dim">{a.agent?.prenom} {a.agent?.nom}</span>
                <span className="text-ink-muted"> : </span>
                <span className="text-cyan-bright">{describeActivity(a.action, a.details)}</span>
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
