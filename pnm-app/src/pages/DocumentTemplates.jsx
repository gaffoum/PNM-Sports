import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Upload, GripVertical, FileStack } from "lucide-react";
import { listTemplates, createTemplate, updateTemplate } from "../hooks/useDocumentTemplates";
import { extractDocumentClauses } from "../hooks/useDocumentImport";
import { blobToBase64 } from "../lib/utils";
import { DOC_TYPES, docTypeLabel, CHAMP_TYPES } from "../lib/documentTemplates";

function emptyTemplate(type) {
  return { type, nom: docTypeLabel(type), description: "", paragraphes: [], champs: [], actif: true };
}

export default function DocumentTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState(DOC_TYPES[0].key);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      setTemplates(await listTemplates());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const existing = templates.find((t) => t.type === activeType);
    setDraft(existing ? { ...existing } : emptyTemplate(activeType));
  }, [activeType, templates]);

  function updateParagraphe(i, key, value) {
    setDraft((d) => ({ ...d, paragraphes: d.paragraphes.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)) }));
  }
  function addParagraphe() {
    setDraft((d) => ({ ...d, paragraphes: [...d.paragraphes, { titre: "", contenu: "" }] }));
  }
  function removeParagraphe(i) {
    setDraft((d) => ({ ...d, paragraphes: d.paragraphes.filter((_, idx) => idx !== i) }));
  }
  function moveParagraphe(i, dir) {
    setDraft((d) => {
      const arr = [...d.paragraphes];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, paragraphes: arr };
    });
  }

  function updateChamp(i, key, value) {
    setDraft((d) => ({ ...d, champs: d.champs.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)) }));
  }
  function addChamp() {
    setDraft((d) => ({ ...d, champs: [...d.champs, { cle: "", label: "", type: "text" }] }));
  }
  function removeChamp(i) {
    setDraft((d) => ({ ...d, champs: d.champs.filter((_, idx) => idx !== i) }));
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Seuls les fichiers PDF sont pris en charge pour l'import.");
    setImporting(true);
    try {
      const base64 = await blobToBase64(file);
      const result = await extractDocumentClauses(base64);
      const newChamps = (result.champs_suggeres ?? []).map((c) => ({ cle: c.cle, label: c.label, type: c.type || "text" }));
      setDraft((d) => ({
        ...d,
        paragraphes: result.paragraphes ?? [],
        champs: [...d.champs.filter((c) => !newChamps.some((n) => n.cle === c.cle)), ...newChamps],
      }));
      toast.success(`${(result.paragraphes ?? []).length} paragraphe(s) extraits — relis et ajuste avant d'enregistrer.`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  }

  async function save() {
    if (!draft.nom.trim()) return toast.error("Nom du modèle requis.");
    setSaving(true);
    try {
      let saved;
      if (draft.id) saved = await updateTemplate(draft.id, draft);
      else saved = await createTemplate(draft);
      setTemplates((ts) => {
        const others = ts.filter((t) => t.id !== saved.id);
        return [...others, saved];
      });
      setDraft(saved);
      toast.success("Modèle enregistré");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !draft) return <div className="text-ink-dim">Chargement…</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl flex items-center gap-2"><FileStack className="w-7 h-7 text-cyan-bright" />Modèles de documents</h1>
        <p className="text-ink-dim text-sm">Un modèle par type — utilisé pour générer chaque document, avec des variables remplacées automatiquement.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {DOC_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveType(t.key)}
            className={`btn ${activeType === t.key ? "btn-primary" : "btn-outline"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="panel p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input className="input" placeholder="Nom du modèle" value={draft.nom} onChange={(e) => setDraft({ ...draft, nom: e.target.value })} />
          <input className="input" placeholder="Description (usage interne)" value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={handleImport} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={importing} className="btn btn-outline text-xs">
            <Upload className="w-3.5 h-3.5" />{importing ? "Analyse en cours…" : "Importer un PDF existant (IA)"}
          </button>
          <span className="text-[11px] text-ink-muted">Analyse le document et propose des paragraphes + variables — à relire avant d'enregistrer.</span>
        </div>
      </div>

      <div className="panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Paragraphes</h3>
          <button onClick={addParagraphe} className="btn btn-ghost text-xs px-2 py-1"><Plus className="w-3.5 h-3.5" />Ajouter</button>
        </div>
        {draft.paragraphes.length === 0 && <p className="text-sm text-ink-dim">Aucun paragraphe. Ajoute-en un ou importe un PDF existant.</p>}
        {draft.paragraphes.map((p, i) => (
          <div key={i} className="bg-bg-1 border border-line rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <GripVertical className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <input className="input flex-1" placeholder="Titre du paragraphe" value={p.titre} onChange={(e) => updateParagraphe(i, "titre", e.target.value)} />
              <button onClick={() => moveParagraphe(i, -1)} disabled={i === 0} className="btn btn-ghost px-2 py-1 text-xs">↑</button>
              <button onClick={() => moveParagraphe(i, 1)} disabled={i === draft.paragraphes.length - 1} className="btn btn-ghost px-2 py-1 text-xs">↓</button>
              <button onClick={() => removeParagraphe(i)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
            </div>
            <textarea
              className="input min-h-[90px] font-mono text-xs"
              placeholder="Contenu — utilise {{joueur.nom}}, {{club.nom}}, {{champ.ma_variable}}…"
              value={p.contenu}
              onChange={(e) => updateParagraphe(i, "contenu", e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Champs du formulaire de génération</h3>
          <button onClick={addChamp} className="btn btn-ghost text-xs px-2 py-1"><Plus className="w-3.5 h-3.5" />Ajouter</button>
        </div>
        <p className="text-[11px] text-ink-muted">Ces champs seront demandés à l'agent lors de la génération. Utilise-les dans les paragraphes via <code className="text-cyan-bright">{"{{champ.<clé>}}"}</code>.</p>
        {draft.champs.length === 0 && <p className="text-sm text-ink-dim">Aucun champ personnalisé (le joueur et le club restent disponibles automatiquement).</p>}
        {draft.champs.map((c, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto_auto] gap-2 items-center">
            <input className="input" placeholder="clé (ex: salaire_annuel)" value={c.cle} onChange={(e) => updateChamp(i, "cle", e.target.value)} />
            <input className="input" placeholder="Libellé affiché" value={c.label} onChange={(e) => updateChamp(i, "label", e.target.value)} />
            <select className="input" value={c.type} onChange={(e) => updateChamp(i, "type", e.target.value)}>
              {CHAMP_TYPES.map((ct) => <option key={ct.key} value={ct.key}>{ct.label}</option>)}
            </select>
            <button onClick={() => removeChamp(i)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn btn-primary"><Save className="w-4 h-4" />{saving ? "Enregistrement…" : "Enregistrer le modèle"}</button>
      </div>
    </div>
  );
}
