import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileBarChart, Download } from "lucide-react";
import { getPeriodReport } from "../hooks/useReports";
import { useFeatures } from "../hooks/useFeatures";
import { formatMoney } from "../lib/utils";

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

function Metric({ label, value }) {
  if (value === null) return null;
  return (
    <div className="panel px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="font-display font-bold text-2xl mt-0.5 text-cyan-bright">{value}</div>
    </div>
  );
}

export default function Reports() {
  const { hasFeature } = useFeatures();
  const hasAgenda = hasFeature("placement_agenda");
  const hasPipeline = hasFeature("placement_pipeline");
  const hasCommissions = hasFeature("placement_commissions");

  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await getPeriodReport({ from, to, hasAgenda, hasPipeline, hasCommissions });
      setReport(r);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  function exportCsv() {
    if (!report) return;
    const rows = [
      ["Indicateur", "Valeur"],
      ["Période", `${from} → ${to}`],
      ["Nouveaux joueurs/prospects", report.nouveauxJoueurs],
      ["Changements d'étape recrutement", report.etapesChangees],
    ];
    if (report.rdvTenus !== null) rows.push(["Rendez-vous tenus", report.rdvTenus]);
    if (report.dealsSignes !== null) rows.push(["Deals signés", report.dealsSignes], ["Montant des deals signés (€)", report.montantDealsSignes]);
    if (report.commissionsEncaissees !== null) rows.push(["Commissions encaissées (€)", report.commissionsEncaissees]);
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pnm-rapport-${from}-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl flex items-center gap-2"><FileBarChart className="w-7 h-7 text-cyan-bright" />Rapports périodiques</h1>
          <p className="text-ink-dim text-sm">Synthèse de l'activité sur une période donnée.</p>
        </div>
        <button onClick={exportCsv} disabled={!report} className="btn btn-outline"><Download className="w-4 h-4" />Exporter en CSV</button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <input type="date" className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-ink-dim text-sm">→</span>
        <input type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {loading || !report ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Metric label="Nouveaux joueurs / prospects" value={report.nouveauxJoueurs} />
          <Metric label="Changements d'étape recrutement" value={report.etapesChangees} />
          <Metric label="Rendez-vous tenus" value={report.rdvTenus} />
          <Metric label="Deals signés" value={report.dealsSignes} />
          <Metric label="Montant des deals signés" value={report.montantDealsSignes !== null ? formatMoney(report.montantDealsSignes) : null} />
          <Metric label="Commissions encaissées" value={report.commissionsEncaissees !== null ? formatMoney(report.commissionsEncaissees) : null} />
        </div>
      )}
    </div>
  );
}
