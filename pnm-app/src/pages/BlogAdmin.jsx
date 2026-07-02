import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Newspaper, ExternalLink } from "lucide-react";
import { listAllPosts, createPost, updatePost, deletePost } from "../hooks/useBlogPosts";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../contexts/ConfirmContext";
import { formatDateFr } from "../lib/utils";

const EMPTY_FORM = { titre: "", slug: "", extrait: "", contenu: "" };

export default function BlogAdmin() {
  const { agent } = useAuth();
  const confirm = useConfirm();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    try {
      setPosts(await listAllPosts());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function submitCreate(e) {
    e.preventDefault();
    if (!form.titre.trim() || !form.contenu.trim()) return toast.error("Titre et contenu requis.");
    setCreating(true);
    try {
      const created = await createPost({
        titre: form.titre.trim(),
        slug: form.slug.trim() || undefined,
        extrait: form.extrait.trim() || null,
        contenu: form.contenu.trim(),
        agent_id: agent.id,
      });
      setPosts((ps) => [created, ...ps]);
      setForm(EMPTY_FORM);
      setShowAdd(false);
      toast.success("Article créé (brouillon)");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditForm({ titre: p.titre, slug: p.slug, extrait: p.extrait ?? "", contenu: p.contenu });
  }

  async function saveEdit(p) {
    try {
      const updated = await updatePost(p.id, {
        titre: editForm.titre.trim(),
        slug: editForm.slug.trim(),
        extrait: editForm.extrait.trim() || null,
        contenu: editForm.contenu.trim(),
      });
      setPosts((ps) => ps.map((x) => (x.id === p.id ? updated : x)));
      setEditingId(null);
      toast.success("Article mis à jour");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function togglePublish(p) {
    try {
      const updated = await updatePost(p.id, {
        publie: !p.publie,
        published_at: !p.publie ? new Date().toISOString() : p.published_at,
      });
      setPosts((ps) => ps.map((x) => (x.id === p.id ? updated : x)));
      toast.success(updated.publie ? "Article publié" : "Article dépublié");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remove(p) {
    const ok = await confirm({ title: "Supprimer cet article ?", message: p.titre, confirmLabel: "Supprimer", danger: true });
    if (!ok) return;
    try {
      await deletePost(p.id);
      setPosts((ps) => ps.filter((x) => x.id !== p.id));
      toast.success("Article supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl flex items-center gap-2"><Newspaper className="w-7 h-7 text-cyan-bright" />Blog &amp; actualités</h1>
          <p className="text-ink-dim text-sm">Articles publiés sur l'espace public /actualites.</p>
        </div>
        <button onClick={() => setShowAdd((v) => !v)} className="btn btn-primary"><Plus className="w-4 h-4" />Nouvel article</button>
      </header>

      {showAdd && (
        <form onSubmit={submitCreate} className="panel p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className="input" placeholder="Titre" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            <input className="input" placeholder="Slug (auto si vide)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <input className="input" placeholder="Extrait (résumé court)" value={form.extrait} onChange={(e) => setForm({ ...form, extrait: e.target.value })} />
          <textarea className="input min-h-[160px]" placeholder="Contenu…" value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="btn btn-primary px-3">{creating ? "…" : "Créer"}</button>
            <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }} className="btn btn-ghost px-3">Annuler</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="space-y-3">
          {posts.length === 0 && <p className="text-ink-dim">Aucun article.</p>}
          {posts.map((p) => (
            <div key={p.id} className="panel p-4">
              {editingId === p.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input className="input" value={editForm.titre} onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })} />
                    <input className="input" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
                  </div>
                  <input className="input" placeholder="Extrait" value={editForm.extrait} onChange={(e) => setEditForm({ ...editForm, extrait: e.target.value })} />
                  <textarea className="input min-h-[160px]" value={editForm.contenu} onChange={(e) => setEditForm({ ...editForm, contenu: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(p)} className="btn btn-primary px-2 py-1"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="btn btn-ghost px-2 py-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{p.titre}</span>
                      <span className={`badge ${p.publie ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300"}`}>{p.publie ? "Publié" : "Brouillon"}</span>
                      {p.publie && (
                        <a href={`/actualites/${p.slug}`} target="_blank" rel="noreferrer" className="text-ink-muted hover:text-cyan-bright"><ExternalLink className="w-3.5 h-3.5" /></a>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-muted">/{p.slug} {p.published_at && <>· {formatDateFr(p.published_at)}</>}</div>
                    {p.extrait && <p className="text-sm text-ink-dim">{p.extrait}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => togglePublish(p)} className="btn btn-ghost text-xs px-2 py-1">{p.publie ? "Dépublier" : "Publier"}</button>
                    <button onClick={() => startEdit(p)} className="btn btn-ghost p-1.5" title="Modifier"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(p)} className="btn btn-ghost p-1.5" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
