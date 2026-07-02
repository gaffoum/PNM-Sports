import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Upload, BookMarked, ArrowLeft, Check } from "lucide-react";
import { listSources, createSource, updateSource, deleteSource, listChunksBySource, bulkCreateChunks, deleteChunk } from "../hooks/useLegalSources";
import { extractLegalChunks } from "../hooks/useLegalImport";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../contexts/ConfirmContext";
import { blobToBase64 } from "../lib/utils";
import { LEGAL_CATEGORIES, legalCategoryLabel, splitPastedText } from "../lib/legalAssistant";

const EMPTY_SOURCE = { titre: "", categorie: "autre", url_source: "" };

export default function LegalSources() {
  const { agent } = useAuth();
  const confirm = useConfirm();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_SOURCE);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [pending, setPending] = useState(null); // extraits en attente de validation
  const [importing, setImporting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      setSources(await listSources());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function openSource(s) {
    setSelected(s);
    setPending(null);
    setPasteText("");
    setLoadingChunks(true);
    try {
      setChunks(await listChunksBySource(s.id));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingChunks(false);
    }
  }

  async function submitCreate(e) {
    e.preventDefault();
    if (!form.titre.trim()) return toast.error("Titre requis.");
    setCreating(true);
    try {
      const created = await createSource({ titre: form.titre.trim(), categorie: form.categorie, url_source: form.url_source.trim() || null, agent_id: agent.id });
      setSources((s) => [created, ...s]);
      setForm(EMPTY_SOURCE);
      setShowAdd(false);
      toast.success("Source créée");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleActif(s) {
    try {
      const updated = await updateSource(s.id, { actif: !s.actif });
      setSources((ss) => ss.map((x) => (x.id === s.id ? updated : x)));
      if (selected?.id === s.id) setSelected(updated);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function removeSource(s) {
    const ok = await confirm({ title: "Supprimer cette source ?", message: `${s.titre} — tous ses extraits seront supprimés.`, confirmLabel: "Supprimer", danger: true });
    if (!ok) return;
    try {
      await deleteSource(s.id);
      setSources((ss) => ss.filter((x) => x.id !== s.id));
      if (selected?.id === s.id) setSelected(null);
      toast.success("Source supprimée");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Seuls les fichiers PDF sont pris en charge.");
    setImporting(true);
    try {
      const base64 = await blobToBase64(file);
      const result = await extractLegalChunks(base64);
      setPending(result.extraits ?? []);
      toast.success(`${(result.extraits ?? []).length} extrait(s) proposé(s) — relis avant d'enregistrer.`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  }

  function preparePaste() {
    if (!pasteText.trim()) return toast.error("Colle du texte d'abord.");
    setPending(splitPastedText(pasteText));
  }

  async function confirmPending() {
    if (!pending || pending.length === 0) return;
    try {
      const created = await bulkCreateChunks(selected.id, pending);
      setChunks((c) => [...c, ...created]);
      setPending(null);
      setPasteText("");
      toast.success(`${created.length} extrait(s) enregistré(s)`);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function removeChunk(id) {
    try {
      await deleteChunk(id);
      setChunks((c) => c.filter((x) => x.id !== id));
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (selected) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="btn btn-ghost text-xs"><ArrowLeft className="w-4 h-4" />Sources</button>
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl">{selected.titre}</h1>
            <p className="text-ink-dim text-sm">{legalCategoryLabel(selected.categorie)} · {chunks.length} extrait(s)</p>
          </div>
          <button onClick={() => toggleActif(selected)} className={`btn ${selected.actif ? "btn-outline" : "btn-primary"}`}>
            {selected.actif ? "Désactiver" : "Activer"}
          </button>
        </header>

        <div className="panel p-4 space-y-3">
          <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Ajouter des extraits</h3>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={handleImport} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={importing} className="btn btn-outline text-xs">
              <Upload className="w-3.5 h-3.5" />{importing ? "Analyse en cours…" : "Importer un PDF (IA)"}
            </button>
          </div>
          <div className="space-y-2">
            <textarea className="input min-h-[90px] font-mono text-xs" placeholder="Ou colle du texte ici — un extrait par paragraphe (séparés par une ligne vide)…" value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
            {pasteText.trim() && <button onClick={preparePaste} className="btn btn-outline text-xs">Découper en extraits</button>}
          </div>

          {pending && (
            <div className="bg-bg-1 border border-line rounded-lg p-3 space-y-2">
              <div className="text-xs uppercase tracking-wider text-ink-muted">{pending.length} extrait(s) à valider</div>
              {pending.map((p, i) => (
                <div key={i} className="text-xs border-b border-line/50 pb-2 last:border-0">
                  {p.reference && <div className="font-semibold text-cyan-bright">{p.reference}</div>}
                  <div className="text-ink-dim whitespace-pre-wrap">{p.contenu}</div>
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={confirmPending} className="btn btn-primary text-xs"><Check className="w-3.5 h-3.5" />Enregistrer ces extraits</button>
                <button onClick={() => setPending(null)} className="btn btn-ghost text-xs">Annuler</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {loadingChunks ? (
            <div className="text-ink-dim text-sm">Chargement…</div>
          ) : chunks.length === 0 ? (
            <p className="text-sm text-ink-dim">Aucun extrait pour l'instant.</p>
          ) : (
            chunks.map((c) => (
              <div key={c.id} className="panel p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {c.reference && <div className="text-xs font-semibold text-cyan-bright">{c.reference}</div>}
                  <p className="text-sm text-ink-dim whitespace-pre-wrap">{c.contenu}</p>
                </div>
                <button onClick={() => removeChunk(c.id)} className="btn btn-ghost p-1.5 shrink-0" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl flex items-center gap-2"><BookMarked className="w-7 h-7 text-cyan-bright" />Sources juridiques</h1>
          <p className="text-ink-dim text-sm">Base documentaire utilisée par l'assistant IA droit du sport.</p>
        </div>
        <button onClick={() => setShowAdd((v) => !v)} className="btn btn-primary"><Plus className="w-4 h-4" />Nouvelle source</button>
      </header>

      {showAdd && (
        <form onSubmit={submitCreate} className="panel p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className="input" placeholder="Titre (ex. Règlement FIFA RSTP)" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            <select className="input" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
              {LEGAL_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <input className="input" placeholder="URL de la source officielle (optionnel)" value={form.url_source} onChange={(e) => setForm({ ...form, url_source: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="btn btn-primary px-3">{creating ? "…" : "Créer"}</button>
            <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_SOURCE); }} className="btn btn-ghost px-3">Annuler</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="space-y-2">
          {sources.length === 0 && <p className="text-ink-dim">Aucune source. Ajoute les règlements officiels (FIFA RSTP, FFAR, Code du sport…) pour que l'assistant puisse répondre.</p>}
          {sources.map((s) => (
            <div key={s.id} className="panel p-4 flex items-center justify-between gap-3 flex-wrap">
              <button onClick={() => openSource(s)} className="text-left min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{s.titre}</span>
                  <span className="badge bg-slate-500/15 text-slate-300">{legalCategoryLabel(s.categorie)}</span>
                  <span className={`badge ${s.actif ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"}`}>{s.actif ? "Active" : "Inactive"}</span>
                </div>
              </button>
              <button onClick={() => removeSource(s)} className="btn btn-ghost p-1.5 shrink-0" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
