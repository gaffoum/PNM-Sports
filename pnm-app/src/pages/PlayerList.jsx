import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ChevronLeft, ChevronRight, Download, Plus, ArrowUpDown, FileSpreadsheet } from "lucide-react";
import { usePlayers } from "../hooks/usePlayers";
import PlayerSearch from "../components/players/PlayerSearch";
import { calcAge, formatDateFr, formatMoney } from "../lib/utils";

const PAGE_SIZE = 20;

export default function PlayerList() {
  const nav = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ column: "created_at", asc: false });

  const { rows, count, loading } = usePlayers({ page, pageSize: PAGE_SIZE, search, filters, sort });

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
          <button className="btn btn-outline" onClick={exportCsv}><Download className="w-4 h-4" />CSV</button>
          <button className="btn btn-outline" onClick={exportXlsx}><FileSpreadsheet className="w-4 h-4" />Excel</button>
          <Link to="/players/new" className="btn btn-primary"><Plus className="w-4 h-4" />Ajouter</Link>
        </div>
      </header>

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
