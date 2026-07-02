import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import { Plus, Download, Trash2, FileText, Settings } from "lucide-react";
import { listGeneratedDocuments, deleteGeneratedDocument } from "../hooks/useGeneratedDocuments";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../contexts/ConfirmContext";
import { formatDateFr } from "../lib/utils";
import { docTypeLabel } from "../lib/documentTemplates";
import GeneratedDocumentPdf from "../components/documents/GeneratedDocumentPdf";

function statutBadgeClass(statut) {
  return statut === "finalise" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300";
}
function statutLabel(statut) {
  return statut === "finalise" ? "Finalisé" : "Brouillon";
}

export default function Documents() {
  const nav = useNavigate();
  const { isAdmin } = useAuth();
  const confirm = useConfirm();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setDocs(await listGeneratedDocuments());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function download(d) {
    try {
      const blob = await pdf(<GeneratedDocumentPdf titre={d.titre} paragraphes={d.paragraphes} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${d.titre.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(d) {
    const ok = await confirm({ title: "Supprimer ce document ?", message: d.titre, confirmLabel: "Supprimer", danger: true });
    if (!ok) return;
    try {
      await deleteGeneratedDocument(d.id);
      setDocs((ds) => ds.filter((x) => x.id !== d.id));
      toast.success("Document supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl flex items-center gap-2"><FileText className="w-7 h-7 text-cyan-bright" />Documents générés</h1>
          <p className="text-ink-dim text-sm">Mandats, contrats et autres documents générés à partir des modèles.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => nav("/documents/modeles")} className="btn btn-outline"><Settings className="w-4 h-4" />Modèles</button>
          )}
          <button onClick={() => nav("/documents/nouveau")} className="btn btn-primary"><Plus className="w-4 h-4" />Nouveau document</button>
        </div>
      </header>

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="space-y-3">
          {docs.length === 0 && <p className="text-ink-dim">Aucun document généré pour l'instant.</p>}
          {docs.map((d) => (
            <div key={d.id} className="panel p-4 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{d.titre}</span>
                  <span className="badge bg-slate-500/15 text-slate-300">{docTypeLabel(d.type)}</span>
                  <span className={`badge ${statutBadgeClass(d.statut)}`}>{statutLabel(d.statut)}</span>
                </div>
                <div className="text-[11px] text-ink-muted">
                  {d.player && <Link to={`/players/${d.player.id}`} className="hover:text-cyan-bright">{d.player.prenom} {d.player.nom}</Link>}
                  {d.player && d.club && " · "}
                  {d.club?.nom}
                  {(d.player || d.club) && " · "}
                  {formatDateFr(d.created_at)}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => download(d)} className="btn btn-ghost p-1.5" title="Télécharger le PDF"><Download className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(d)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
