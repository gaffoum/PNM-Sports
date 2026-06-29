import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ChevronLeft, ChevronRight, Download, Plus, ArrowUpDown, FileSpreadsheet, UserCheck } from "lucide-react";
import { usePlayers } from "../hooks/usePlayers";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import PlayerSearch from "../components/players/PlayerSearch";
import { calcAge, formatDateFr, formatMoney } from "../lib/utils";
import { STEPS, stepLabel, stepShort, stepBadgeClass, stepDotClass } from "../lib/recruitment";

const PAGE_SIZE = 20;

const TONE_UI = {
  all:     { dot: "bg-ink-dim",     num: "text-ink",         active: "border-ink-dim ring-ink-dim/30" },
  sky:     { dot: "bg-sky-400",     num: "text-sky-300",     active: "border-sky-400 ring-sky-400/40" },
  indigo:  { dot: "bg-indigo-400",  num: "text-indigo-300",  active: "border-indigo-400 ring-indigo-400/40" },
  teal:    { dot: "bg-teal-400",    num: "text-teal-300",    active: "border-teal-400 ring-teal-400/40" },
  amber:   { dot: "bg-amber-400",   num: "text-amber-300",   active: "border-amber-400 ring-amber-400/40" },
  orange:  { dot: "bg-orange-400",  num: "text-orange-300",  active: "border-orange-400 ring-orange-400/40" },
  fuchsia: { dot: "bg-fuchsia-400", num: "text-fuchsia-300", active: "border-fuchsia-400 ring-fuchsia-400/40" },
  lime:    { dot: "bg-lime-400",    num: "text-lime-300",    active: "border-lime-400 ring-lime-400/40" },
  violet:  { dot: "bg-violet-400",  num: "text-violet-300",  active: "border-violet-400 ring-violet-400/40" },
  emerald: { dot: "bg-emerald-400", num: "text-emerald-300", active: "border-emerald-400 ring-emerald-400/40" },
  red:     { dot: "bg-red-400",     num: "text-red-300",     active: "border-red-400 ring-red-400/40" },
};

function StepCard({ tone, label, value, active, onClick }) {
  const c = TONE_UI[tone] ?? TONE_UI.all;
  return (
    <button
      onClick={onClick}
      title={label}
      className={`panel px-3 py-2.5 text-left transition border ${active ? `${c.active} ring-1` : "border-line hover:border-line-strong"}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
        <span className="text-[10px] uppercase tracking-wider text-ink-muted truncate">{label}</span>
      </div>
      <div className={`font-display font-bold text-xl mt-0.5 ${c.num}`}>{value}</div>
    </button>
  );
}

export default function PlayerList() {
  const nav = useNavigate();
  const { agent } = useAuth();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ column: "created_at", asc: false });

  const { rows, count, loading } = usePlayers({ page, pageSize: PAGE_SIZE, search, filters, sort });

  // Filtres initiaux depuis l'URL (ex: clic depuis le tableau de bord)
  const [searchParams] = useSearchParams();
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const seed = {};
    for (const k of ["statut", "recruitment_step", "poste", "nationalite", "club", "fin_contrat_avant", "fin_contrat_apres", "agent_referent"]) {
      const v = searchParams.get(k);
      if (v) seed[k] = v;
    }
    if (Object.keys(seed).length) setFilters(seed);
  }, [searchParams]);

  // Compteur par étape de recrutement
  const [stepCounts, setStepCounts] = useState({});
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("players").select("recruitment_step");
      if (!active) return;
      const tally = {};
      (data ?? []).forEach((r) => { tally[r.recruitment_step] = (tally[r.recruitment_step] ?? 0) + 1; });
      setStepCounts(tally);
    })();
    return () => { active = false; };
  }, []);
  const totalCount = Object.values(stepCounts).reduce((a, b) => a + b, 0);

  function setStep(v) {
    setPage(0);
    setFilters((f) => ({ ...f, recruitment_step: v || undefined }));
  }

  const mine = !!agent?.id && filters.agent_referent === agent.id;
  function toggleMine() {
    setPage(0);
    setFilters((f) => ({ ...f, agent_referent: mine ? undefined : agent?.id }));
  }

  function toggleSort(column) {
    setSort((s) => s.column === column ? { column, asc: !s.asc } : { column, asc: true });
  }

  const columns = useMemo(() => [
    {
      accessorKey: "photo_url",
      header: "",
      cell: ({ row }) => row.original.photo_url ? (
        <img src={row.original.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-line" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-bg-1 border border-line grid place-items-center text-[10px] text-ink-muted">
          {(row.original.prenom?.[0] ?? "") + (row.original.nom?.[0] ?? "")}
        </div>
      ),
    },
    { accessorKey: "nom", header: "Nom", cell: ({ row }) => <span className="font-semibold">{row.original.prenom} {row.original.nom}</span> },
    { accessorKey: "poste", header: "Poste" },
    { accessorKey: "club_actuel", header: "Club" },
    { accessorKey: "nationalite", header: "Nationalité" },
    { accessorKey: "date_naissance", header: "Âge", cell: ({ row }) => calcAge(row.original.date_naissance) ?? "—" },
    { accessorKey: "fin_contrat", header: "Fin contrat", cell: ({ row }) => formatDateFr(row.original.fin_contrat) },
    { accessorKey: "valeur_estimee_eur", header: "Valeur", cell: ({ row }) => formatMoney(row.original.valeur_estimee_eur) },
    {
      accessorKey: "statut",
      header: "Statut",
      cell: ({ row }) => (
        <span className={`badge ${row.original.statut === "joueur" ? "badge-joueur" : "badge-prospect"}`}>
          {row.original.statut}
        </span>
      ),
    },
    {
      accessorKey: "recruitment_step",
      header: "Étape",
      cell: ({ row }) => (
        <span className={`badge ${stepBadgeClass(row.original.recruitment_step)}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stepDotClass(row.original.recruitment_step)}`} />
          {stepLabel(row.original.recruitment_step)}
        </span>
      ),
    },
    {
      id: "agent",
      header: "Agent",
      cell: ({ row }) => row.original.agent ? `${row.original.agent.prenom} ${row.original.agent.nom}` : "—",
    },
  ], []);

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  function buildExportRows() {
    return rows.map((r) => ({
      Nom: r.nom,
      Prenom: r.prenom,
      DateNaissance: r.date_naissance,
      Age: calcAge(r.date_naissance),
      Nationalite: r.nationalite,
      Poste: r.poste,
      PiedFort: r.pied_fort,
      TailleCm: r.taille_cm,
      PoidsKg: r.poids_kg,
      ClubActuel: r.club_actuel,
      ClubPrecedent: r.club_precedent,
      FinContrat: r.fin_contrat,
      ValeurEstimeeEur: r.valeur_estimee_eur,
      Telephone: r.telephone,
      Email: r.email,
      Statut: r.statut,
      Etape: stepLabel(r.recruitment_step),
      Agent: r.agent ? `${r.agent.prenom} ${r.agent.nom}` : "",
    }));
  }

  function exportCsv() {
    const csv = Papa.unparse(buildExportRows());
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pnm-joueurs-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function exportXlsx() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(buildExportRows());
    XLSX.utils.book_append_sheet(wb, ws, "Joueurs");
    XLSX.writeFile(wb, `pnm-joueurs-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl">Joueurs &amp; Prospects</h1>
          <p className="text-ink-dim text-sm">{count} fiche{count !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className={`btn ${mine ? "btn-primary" : "btn-outline"}`} onClick={toggleMine}>
            <UserCheck className="w-4 h-4" />Mes joueurs
          </button>
          <button className="btn btn-outline" onClick={exportCsv}><Download className="w-4 h-4" />CSV</button>
          <button className="btn btn-outline" onClick={exportXlsx}><FileSpreadsheet className="w-4 h-4" />Excel</button>
          <Link to="/players/new" className="btn btn-primary"><Plus className="w-4 h-4" />Ajouter</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
        <StepCard tone="all" label="Tous" value={totalCount}
          active={!filters.recruitment_step} onClick={() => setStep(undefined)} />
        {STEPS.map((st) => (
          <StepCard key={st.key} tone={st.tone} label={stepShort(st.key)} value={stepCounts[st.key] ?? 0}
            active={filters.recruitment_step === st.key}
            onClick={() => setStep(filters.recruitment_step === st.key ? undefined : st.key)} />
        ))}
      </section>

      <PlayerSearch search={search} setSearch={setSearch} filters={filters} setFilters={setFilters} />

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-ink-muted">
              {table.getHeaderGroups()[0].headers.map((h) => (
                <th key={h.id} className="px-4 py-3 font-semibold whitespace-nowrap">
                  {h.column.id !== "photo_url" && h.column.id !== "agent" ? (
                    <button onClick={() => toggleSort(h.column.id)} className="inline-flex items-center gap-1 hover:text-ink">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  ) : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-ink-dim">Chargement…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-ink-dim">Aucun joueur.</td></tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => nav(`/players/${row.original.id}`)}
                className="border-b border-line/60 hover:bg-cyan-bright/5 cursor-pointer transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2.5 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-ink-dim">Page {page + 1} / {totalPages}</div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn btn-ghost px-2">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn btn-ghost px-2">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
