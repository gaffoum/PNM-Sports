import { useRef, useState } from "react";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { formatDateFr } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

export default function DocumentsList({ playerId, documents, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { agent } = useAuth();

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${playerId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("player-documents").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: row, error } = await supabase.from("player_documents").insert({
        player_id: playerId,
        nom: file.name,
        type: file.type || null,
        storage_path: path,
        taille_bytes: file.size,
        uploaded_by: agent?.id,
      }).select().single();
      if (error) throw error;
      onChange([row, ...documents]);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function downloadDoc(d) {
    const { data, error } = await supabase.storage.from("player-documents").createSignedUrl(d.storage_path, 300);
    if (error) { alert(error.message); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function del(d) {
    if (!confirm(`Supprimer "${d.nom}" ?`)) return;
    await supabase.storage.from("player-documents").remove([d.storage_path]);
    const { error } = await supabase.from("player_documents").delete().eq("id", d.id);
    if (error) { alert(error.message); return; }
    onChange(documents.filter((x) => x.id !== d.id));
  }

  return (
    <div className="panel p-5 space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Documents</h3>
        <button onClick={() => inputRef.current?.click()} className="btn btn-ghost text-xs" disabled={uploading}>
          <Upload className="w-3.5 h-3.5" />{uploading ? "Upload…" : "Téléverser"}
        </button>
        <input ref={inputRef} type="file" hidden onChange={upload} />
      </header>
      {documents.length === 0 && <p className="text-sm text-ink-dim">Aucun document.</p>}
      <ul className="divide-y divide-line">
        {documents.map((d) => (
          <li key={d.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-ink-dim flex-shrink-0" />
              <span className="truncate">{d.nom}</span>
              <span className="text-[10px] text-ink-muted whitespace-nowrap">· {formatDateFr(d.uploaded_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => downloadDoc(d)} className="btn btn-ghost p-1.5" title="Télécharger"><Download className="w-3.5 h-3.5" /></button>
              <button onClick={() => del(d)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
