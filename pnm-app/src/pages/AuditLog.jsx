import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { listAuditLog, PAGE_SIZE } from "../hooks/useAuditLog";
import { AUDIT_TABLES, AUDIT_ACTIONS, auditTableLabel, auditActionLabel, auditActionBadgeClass, auditRecordLabel } from "../lib/auditLog";
import { formatDateTimeFr } from "../lib/utils";

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableName, setTableName] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await listAuditLog({ tableName, action, page });
      setEntries(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [tableName, action, page]);

  function changeFilter(setter, value) {
    setter(value);
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl flex items-center gap-2"><ShieldAlert className="w-7 h-7 text-cyan-bright" />Journal d'audit</h1>
        <p className="text-ink-dim text-sm">Historique des créations, modifications et suppressions sur les données sensibles.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <select className="input w-auto" value={tableName} onChange={(e) => changeFilter(setTableName, e.target.value)}>
          <option value="">Tous les modules</option>
          {AUDIT_TABLES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <select className="input w-auto" value={action} onChange={(e) => changeFilter(setAction, e.target.value)}>
          <option value="">Toutes les actions</option>
          {AUDIT_ACTIONS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="space-y-2">
          {entries.length === 0 && <p className="text-ink-dim">Aucun événement pour ce filtre.</p>}
          {entries.map((entry) => (
            <div key={entry.id} className="panel p-3">
              <button
                onClick={() => setExpandedId((id) => (id === entry.id ? null : entry.id))}
                className="w-full flex items-center justify-between gap-3 flex-wrap text-left"
              >
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className={`badge ${auditActionBadgeClass(entry.action)}`}>{auditActionLabel(entry.action)}</span>
                  <span className="text-ink-muted text-xs uppercase tracking-wider">{auditTableLabel(entry.table_name)}</span>
                  <span className="font-semibold truncate">{auditRecordLabel(entry)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-dim shrink-0">
                  <span>{entry.actor ? `${entry.actor.prenom} ${entry.actor.nom}` : "Système"}</span>
                  <span>{formatDateTimeFr(entry.created_at)}</span>
                </div>
              </button>
              {expandedId === entry.id && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {entry.old_data && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">Avant</div>
                      <pre className="text-[11px] bg-bg-1 rounded-lg p-2 overflow-x-auto">{JSON.stringify(entry.old_data, null, 2)}</pre>
                    </div>
                  )}
                  {entry.new_data && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">Après</div>
                      <pre className="text-[11px] bg-bg-1 rounded-lg p-2 overflow-x-auto">{JSON.stringify(entry.new_data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="btn btn-ghost px-3"><ChevronLeft className="w-4 h-4" />Précédent</button>
        <span className="text-xs text-ink-muted">Page {page + 1}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={entries.length < PAGE_SIZE} className="btn btn-ghost px-3">Suivant<ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
