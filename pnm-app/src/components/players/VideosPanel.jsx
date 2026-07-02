import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Check, X, Video, ExternalLink } from "lucide-react";
import { createVideo, deleteVideo } from "../../hooks/usePlayerVideos";
import { useAuth } from "../../hooks/useAuth";
import { useConfirm } from "../../contexts/ConfirmContext";
import { embedUrl } from "../../lib/playerVideos";
import { formatDateFr } from "../../lib/utils";
import ViewToggle from "../common/ViewToggle";

const EMPTY = { titre: "", url: "" };

export default function VideosPanel({ playerId, videos, onChange }) {
  const { agent } = useAuth();
  const confirm = useConfirm();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("cards");

  async function submit(e) {
    e.preventDefault();
    if (!form.titre.trim() || !form.url.trim()) return toast.error("Titre et URL requis.");
    setSaving(true);
    try {
      const created = await createVideo({ player_id: playerId, titre: form.titre.trim(), url: form.url.trim(), agent_id: agent.id });
      onChange([created, ...videos]);
      setForm(EMPTY);
      setShowAdd(false);
      toast.success("Vidéo ajoutée");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(v) {
    const ok = await confirm({ title: "Supprimer cette vidéo ?", message: v.titre, confirmLabel: "Supprimer", danger: true });
    if (!ok) return;
    try {
      await deleteVideo(v.id);
      onChange(videos.filter((x) => x.id !== v.id));
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="panel p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Galerie vidéos &amp; highlights</h3>
        <div className="flex items-center gap-2">
          {videos.length > 0 && <ViewToggle value={view} onChange={setView} />}
          {!showAdd && (
            <button onClick={() => setShowAdd(true)} className="btn btn-ghost text-xs px-2 py-1">
              <Plus className="w-3.5 h-3.5" />Ajouter
            </button>
          )}
        </div>
      </div>

      {showAdd && (
        <form onSubmit={submit} className="bg-bg-1 border border-line rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className="input" placeholder="Titre (ex. Highlights saison 2025)" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            <input className="input" placeholder="URL (YouTube, Vimeo…)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn btn-primary px-3"><Check className="w-4 h-4" />{saving ? "…" : "Ajouter"}</button>
            <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY); }} className="btn btn-ghost px-3">Annuler</button>
          </div>
        </form>
      )}

      {videos.length === 0 && <p className="text-sm text-ink-dim">Aucune vidéo ajoutée.</p>}

      {videos.length > 0 && view === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videos.map((v) => {
            const embed = embedUrl(v.url);
            return (
              <div key={v.id} className="bg-bg-1 border border-line rounded-lg overflow-hidden">
                {embed ? (
                  <div className="aspect-video">
                    <iframe src={embed} title={v.titre} className="w-full h-full" allowFullScreen />
                  </div>
                ) : (
                  <a href={v.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 aspect-video bg-bg-0 text-ink-dim hover:text-cyan-bright">
                    <Video className="w-6 h-6" />
                  </a>
                )}
                <div className="flex items-center justify-between gap-2 p-2.5">
                  <a href={v.url} target="_blank" rel="noreferrer" className="text-sm font-medium truncate flex items-center gap-1 hover:text-cyan-bright">
                    {v.titre}<ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <button onClick={() => remove(v)} className="btn btn-ghost p-1 shrink-0" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {videos.length > 0 && view === "table" && (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-ink-muted border-b border-line">
                <th className="px-2 py-2">Titre</th>
                <th className="px-2 py-2">URL</th>
                <th className="px-2 py-2">Ajoutée le</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} className="border-b border-line/60 last:border-0 hover:bg-line/10">
                  <td className="px-2 py-2 font-medium">{v.titre}</td>
                  <td className="px-2 py-2 text-ink-dim truncate max-w-[220px]">
                    <a href={v.url} target="_blank" rel="noreferrer" className="hover:text-cyan-bright inline-flex items-center gap-1">
                      {v.url}<ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>
                  <td className="px-2 py-2 text-ink-dim">{formatDateFr(v.created_at)}</td>
                  <td className="px-2 py-2 text-right">
                    <button onClick={() => remove(v)} className="btn btn-ghost p-1" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
