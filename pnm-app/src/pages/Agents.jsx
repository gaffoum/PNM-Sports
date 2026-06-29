import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Save, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { PERMISSIONS } from "../lib/permissions";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", role: "agent" });
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("nom");
    if (error) toast.error(error.message);
    else setAgents(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function patch(id, changes) {
    setAgents((a) => a.map((x) => (x.id === id ? { ...x, ...changes } : x)));
  }
  function togglePerm(id, key) {
    setAgents((a) => a.map((x) => x.id === id
      ? { ...x, permissions: { ...(x.permissions || {}), [key]: !x.permissions?.[key] } }
      : x));
  }
  async function save(ag) {
    const { error } = await supabase
      .from("agents")
      .update({ role: ag.role, actif: ag.actif, permissions: ag.permissions ?? {} })
      .eq("id", ag.id);
    if (error) return toast.error(error.message);
    toast.success(`${ag.prenom} ${ag.nom} mis à jour`);
  }

  async function createAgent(e) {
    e.preventDefault();
    if (!form.email || !form.prenom || !form.nom) return;
    setCreating(true);
    try {
      const { error } = await supabase.functions.invoke("admin-create-agent", { body: form });
      if (error) throw error;
      toast.success("Agent créé — un e-mail d'invitation a été envoyé.");
      setForm({ prenom: "", nom: "", email: "", role: "agent" });
      load();
    } catch {
      toast.error("Création indisponible : la fonction serveur « admin-create-agent » n'est pas encore déployée (voir supabase/functions).");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl">Agents &amp; droits</h1>
        <p className="text-ink-dim text-sm">Gérer les accès des agents et leurs permissions.</p>
      </header>

      {/* Ajouter un agent */}
      <form onSubmit={createAgent} className="panel p-5 space-y-3">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Ajouter un agent
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="input" placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          <input className="input" placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="agent">Agent</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={creating}>
            <UserPlus className="w-4 h-4" />{creating ? "Création…" : "Créer l'agent"}
          </button>
        </div>
        <p className="text-[11px] text-ink-muted">
          La création envoie une invitation par e-mail (mot de passe défini par l'agent). Nécessite la fonction
          serveur <code>admin-create-agent</code> déployée sur Supabase.
        </p>
      </form>

      {/* Liste des agents */}
      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="space-y-3">
          {agents.map((ag) => {
            const isAdmin = ag.role === "admin";
            return (
              <div key={ag.id} className="panel p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {ag.prenom} {ag.nom}
                      {!ag.actif && <span className="badge badge-prospect">désactivé</span>}
                    </div>
                    <div className="text-xs text-ink-dim">{ag.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="input w-auto py-1.5" value={ag.role} onChange={(e) => patch(ag.id, { role: e.target.value })}>
                      <option value="agent">Agent</option>
                      <option value="admin">Administrateur</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-ink-dim">
                      <input type="checkbox" checked={ag.actif} onChange={(e) => patch(ag.id, { actif: e.target.checked })} />
                      Actif
                    </label>
                    <button onClick={() => save(ag)} className="btn btn-primary px-3"><Save className="w-4 h-4" />Enregistrer</button>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-muted mb-2">Droits</div>
                  {isAdmin ? (
                    <div className="text-sm text-cyan-bright flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Administrateur — tous les droits
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {PERMISSIONS.map((p) => (
                        <label key={p.key} className="flex items-start gap-2 text-sm cursor-pointer" title={p.desc}>
                          <input type="checkbox" className="mt-0.5" checked={!!ag.permissions?.[p.key]} onChange={() => togglePerm(ag.id, p.key)} />
                          <span className="text-ink-dim">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
