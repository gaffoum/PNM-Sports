import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import { Wand2, Download, Save, ArrowLeft } from "lucide-react";
import { getTemplateByType } from "../hooks/useDocumentTemplates";
import { createGeneratedDocument } from "../hooks/useGeneratedDocuments";
import { listPlayersBasic } from "../hooks/usePlayers";
import { listClubsBasic } from "../hooks/useClubs";
import { useAuth } from "../hooks/useAuth";
import { formatDateFr } from "../lib/utils";
import { DOC_TYPES, docTypeLabel, renderTemplate, buildMergeContext } from "../lib/documentTemplates";
import AutocompleteInput from "../components/common/AutocompleteInput";
import GeneratedDocumentPdf from "../components/documents/GeneratedDocumentPdf";

export default function DocumentGenerate() {
  const nav = useNavigate();
  const { agent } = useAuth();
  const [type, setType] = useState(DOC_TYPES[0].key);
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [playerLabel, setPlayerLabel] = useState("");
  const [clubLabel, setClubLabel] = useState("");
  const [champValues, setChampValues] = useState({});
  const [titre, setTitre] = useState("");
  const [paragraphes, setParagraphes] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([listPlayersBasic(), listClubsBasic()]).then(([p, c]) => { setPlayers(p); setClubs(c); });
  }, []);

  useEffect(() => {
    setLoadingTemplate(true);
    setParagraphes(null);
    setChampValues({});
    getTemplateByType(type)
      .then(setTemplate)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingTemplate(false));
  }, [type]);

  const selectedPlayer = players.find((p) => `${p.prenom} ${p.nom}`.toLowerCase() === playerLabel.trim().toLowerCase());
  const selectedClub = clubs.find((c) => c.nom.toLowerCase() === clubLabel.trim().toLowerCase());

  function generateParagraphes() {
    if (!template) return;
    const ctx = buildMergeContext({ player: selectedPlayer, club: selectedClub, champValues, formatDateFr });
    setParagraphes(template.paragraphes.map((p) => ({ titre: p.titre, contenu: renderTemplate(p.contenu, ctx) })));
    if (!titre.trim()) {
      setTitre(`${docTypeLabel(type)}${selectedPlayer ? ` — ${selectedPlayer.prenom} ${selectedPlayer.nom}` : ""}`);
    }
  }

  function updateParagraphe(i, key, value) {
    setParagraphes((ps) => ps.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  }

  async function save(statut) {
    if (!titre.trim()) return toast.error("Titre du document requis.");
    if (!paragraphes || paragraphes.length === 0) return toast.error("Génère d'abord les paragraphes.");
    setBusy(true);
    try {
      const doc = await createGeneratedDocument({
        template_id: template?.id ?? null,
        type,
        titre: titre.trim(),
        player_id: selectedPlayer?.id ?? null,
        club_id: selectedClub?.id ?? null,
        form_data: champValues,
        paragraphes,
        statut,
        agent_id: agent.id,
      });
      toast.success(statut === "finalise" ? "Document finalisé" : "Brouillon enregistré");
      if (statut === "finalise") {
        const blob = await pdf(<GeneratedDocumentPdf titre={doc.titre} paragraphes={doc.paragraphes} />).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${doc.titre.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`; a.click();
        URL.revokeObjectURL(url);
      }
      nav("/documents");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const champs = template?.champs ?? [];

  return (
    <div className="space-y-6">
      <button onClick={() => nav("/documents")} className="btn btn-ghost text-xs"><ArrowLeft className="w-4 h-4" />Documents</button>
      <header>
        <h1 className="text-3xl">Générer un document</h1>
        <p className="text-ink-dim text-sm">Choisis un type, complète les informations, puis ajuste chaque paragraphe avant export.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {DOC_TYPES.map((t) => (
          <button key={t.key} onClick={() => setType(t.key)} className={`btn ${type === t.key ? "btn-primary" : "btn-outline"}`}>{t.label}</button>
        ))}
      </div>

      {loadingTemplate ? (
        <div className="text-ink-dim">Chargement du modèle…</div>
      ) : !template ? (
        <div className="panel p-4 text-sm text-ink-dim">
          Aucun modèle configuré pour « {docTypeLabel(type)} ». Configure-le d'abord dans{" "}
          <button onClick={() => nav("/documents/modeles")} className="text-cyan-bright hover:underline">Modèles de documents</button>.
        </div>
      ) : (
        <>
          <div className="panel p-4 space-y-3">
            <input className="input" placeholder="Titre du document" value={titre} onChange={(e) => setTitre(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="label">Joueur (optionnel)</label>
                <AutocompleteInput options={players.map((p) => `${p.prenom} ${p.nom}`)} value={playerLabel} onChange={setPlayerLabel} placeholder="Choisir un joueur…" />
              </div>
              <div>
                <label className="label">Club (optionnel)</label>
                <AutocompleteInput options={clubs.map((c) => c.nom)} value={clubLabel} onChange={setClubLabel} placeholder="Choisir un club…" />
              </div>
            </div>
            {champs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {champs.map((c) => (
                  <div key={c.cle}>
                    <label className="label">{c.label}</label>
                    {c.type === "textarea" ? (
                      <textarea className="input min-h-[70px]" value={champValues[c.cle] ?? ""} onChange={(e) => setChampValues({ ...champValues, [c.cle]: e.target.value })} />
                    ) : (
                      <input className="input" type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"} value={champValues[c.cle] ?? ""} onChange={(e) => setChampValues({ ...champValues, [c.cle]: e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
            )}
            <button onClick={generateParagraphes} className="btn btn-primary"><Wand2 className="w-4 h-4" />Générer les paragraphes</button>
          </div>

          {paragraphes && (
            <div className="panel p-4 space-y-3">
              <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Aperçu — modifiable avant export</h3>
              {paragraphes.map((p, i) => (
                <div key={i} className="bg-bg-1 border border-line rounded-lg p-3 space-y-2">
                  <input className="input font-semibold" value={p.titre} onChange={(e) => updateParagraphe(i, "titre", e.target.value)} />
                  <textarea className="input min-h-[100px]" value={p.contenu} onChange={(e) => updateParagraphe(i, "contenu", e.target.value)} />
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => save("brouillon")} disabled={busy} className="btn btn-outline"><Save className="w-4 h-4" />Enregistrer comme brouillon</button>
                <button onClick={() => save("finalise")} disabled={busy} className="btn btn-primary"><Download className="w-4 h-4" />Finaliser &amp; exporter PDF</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
