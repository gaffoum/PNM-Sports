import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Scale, Send, Trash2, ChevronDown, AlertTriangle } from "lucide-react";
import { askLegalQuestion, saveLegalQuery, listMyLegalQueries, deleteLegalQuery } from "../hooks/useLegalAssistant";
import { useAuth } from "../hooks/useAuth";
import { formatDateFr } from "../lib/utils";
import { legalCategoryLabel } from "../lib/legalAssistant";

function AdminSourcesHint({ isAdmin }) {
  if (!isAdmin) return null;
  return (
    <p className="text-xs text-amber-100/80 mt-1">
      Gérer les sources : <Link to="/assistant-juridique/sources" className="underline hover:text-amber-200">/assistant-juridique/sources</Link>
    </p>
  );
}

function SourceChips({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {sources.map((s) => (
        <span key={s.id} className="badge bg-slate-500/15 text-slate-300" title={legalCategoryLabel(s.categorie)}>
          {s.titre}{s.reference ? ` — ${s.reference}` : ""}
        </span>
      ))}
    </div>
  );
}

export default function LegalAssistant() {
  const { agent, isAdmin } = useAuth();
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      setHistory(await listMyLegalQueries());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingHistory(false);
    }
  }
  useEffect(() => { loadHistory(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setCurrent(null);
    try {
      const result = await askLegalQuestion(question.trim());
      setCurrent({ question: question.trim(), ...result });
      const saved = await saveLegalQuery({ agent_id: agent.id, question: question.trim(), reponse: result.reponse, sources: result.sources });
      setHistory((h) => [saved, ...h]);
      setQuestion("");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAsking(false);
    }
  }

  async function remove(id) {
    try {
      await deleteLegalQuery(id);
      setHistory((h) => h.filter((q) => q.id !== id));
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl flex items-center gap-2"><Scale className="w-7 h-7 text-cyan-bright" />Assistant IA droit du sport</h1>
        <p className="text-ink-dim text-sm">Pose une question sur le droit du sport (transferts, agents, contrats…) — réponses basées uniquement sur la base documentaire.</p>
      </header>

      <div className="panel p-3 flex items-start gap-2 border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-amber-100/80">
            Outil informatif basé sur les textes indexés dans la base documentaire. Ne remplace pas l'avis d'un avocat spécialisé en droit du sport.
          </p>
          <AdminSourcesHint isAdmin={isAdmin} />
        </div>
      </div>

      <form onSubmit={submit} className="panel p-4 space-y-3">
        <textarea
          className="input min-h-[80px]"
          placeholder="Ex : Quelles sont les conditions pour qu'un transfert soit valable pendant une fenêtre de mercato fermée ?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" disabled={asking || !question.trim()} className="btn btn-primary">
          <Send className="w-4 h-4" />{asking ? "Recherche en cours…" : "Poser la question"}
        </button>
      </form>

      {current && (
        <div className="panel p-4 space-y-2">
          <div className="text-xs uppercase tracking-wider text-ink-muted">{current.question}</div>
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{current.reponse}</p>
          <SourceChips sources={current.sources} />
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Historique</h3>
        {loadingHistory ? (
          <div className="text-ink-dim text-sm">Chargement…</div>
        ) : history.length === 0 ? (
          <p className="text-sm text-ink-dim">Aucune question posée pour l'instant.</p>
        ) : (
          history.map((q) => (
            <div key={q.id} className="panel p-3">
              <button onClick={() => setExpandedId((id) => (id === q.id ? null : q.id))} className="w-full flex items-center justify-between gap-3 text-left">
                <span className="text-sm font-medium truncate">{q.question}</span>
                <span className="flex items-center gap-2 shrink-0 text-ink-muted text-xs">
                  {formatDateFr(q.created_at)}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedId === q.id ? "rotate-180" : ""}`} />
                </span>
              </button>
              {expandedId === q.id && (
                <div className="mt-2 pt-2 border-t border-line">
                  <p className="text-sm text-ink-dim whitespace-pre-wrap leading-relaxed">{q.reponse}</p>
                  <SourceChips sources={q.sources} />
                  <button onClick={() => remove(q.id)} className="btn btn-ghost text-xs px-2 py-1 mt-2"><Trash2 className="w-3.5 h-3.5 text-red-300" />Supprimer</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
