import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Save, ShieldCheck, Search, Trash2, KeyRound } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../contexts/ConfirmContext";
import { PERMISSIONS } from "../lib/permissions";
import { isOwner } from "../lib/ownership";

export default function Agents() {
  const { agent: me } = useAuth();
  const confirm = useConfirm();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", role: "agent", password: "" });
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [pwdOpenId, setPwdOpenId] = useState(null);
  const [pwdValue, setPwdValue] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

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

  async function deleteAgent(ag) {
    if (isOwner(ag) && !isOwner(me)) {
      return toast.error("Le compte propriétaire ne peut être supprimé que par lui-même.");
    }
    const ok = await confirm({
      title: "Supprimer cet agent ?",
      message: `${ag.prenom} ${ag.nom} (${ag.email})\nCette action est irréversible.`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    const { data, error } = await supabase.functions.invoke("admin-delete-agent", { body: { id: ag.id } });
    if (error || data?.error) {
      return toast.error(data?.error || "Suppression impossible (fonction « admin-delete-agent » déployée ?).");
    }
    toast.success(`${ag.prenom} ${ag.nom} supprimé.`);
    setAgents((a) => a.filter((x) => x.id !== ag.id));
  }

  function togglePwdRow(id) {
    setPwdOpenId((cur) => (cur === id ? null : id));
    setPwdValue("");
  }

  async function setPassword(ag) {
    if (pwdValue.length < 8) return toast.error("Mot de passe : 8 caractères minimum.");
    const ok = await confirm({
      title: "Redéfinir ce mot de passe ?",
      message: `${ag.prenom} ${ag.nom} (${ag.email})\nL'agent devra le changer à sa prochaine connexion.`,
      confirmLabel: "Redéfinir",
      danger: true,
    });
    if (!ok) return;
    setPwdBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-set-password", {
      body: { id: ag.id, password: pwdValue },
    });
    setPwdBusy(false);
    if (error || data?.error) {
      return toast.error(data?.error || "Action impossible (fonction « admin-set-password » déployée ?).");
    }
    toast.success(`Mot de passe redéfini pour ${ag.prenom} ${ag.nom}.`);
    setPwdOpenId(null);
    setPwdValue("");
  }

  async function createAgent(e) {
    e.preventDefault();
    if (!form.email || !form.prenom || !form.nom) return;
    if (form.password.length < 8) return toast.error("Mot de passe initial : 8 caractères minimum.");
    setCreating(true);
    try {
      const { error } = await supabase.functions.invoke("admin-create-agent", { body: form });
      if (error) throw error;
      toast.success("Agent créé. Communiquez-lui son mot de passe initial.");
      setForm({ prenom: "", nom: "", email: "", role: "agent", password: "" });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input" placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          <input className="input" placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Mot de passe initial (8 car. min.)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
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
          Aucun e-mail n'est envoyé : tu définis un <b>mot de passe initial</b> et tu le communiques à l'agent.
          À sa <b>première connexion</b>, il devra le changer. Nécessite la fonction serveur <code>admin-create-agent</code> déployée.
        </p>
      </form>

      {/* Liste des agents */}
      {!loading && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input className="input pl-10" placeholder="Rechercher un agent (nom, email)…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : (
        <div className="space-y-3">
          {agents
            .filter((a) => !isOwner(a))
            .filter((a) => `${a.prenom} ${a.nom} ${a.email}`.toLowerCase().includes(q.trim().toLowerCase()))
            .map((ag) => {
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
                    <button
                      onClick={() => togglePwdRow(ag.id)}
                      className="btn btn-outline px-3"
                      title="Redéfinir le mot de passe"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAgent(ag)}
                      className="btn btn-danger px-3"
                      title="Supprimer cet agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {pwdOpenId === ag.id && (
                  <div className="flex flex-wrap items-center gap-2 bg-bg-1 border border-line rounded-lg p-3">
                    <input
                      type="text"
                      className="input flex-1 min-w-[200px]"
                      placeholder="Nouveau mot de passe (8 car. min.)"
                      value={pwdValue}
                      onChange={(e) => setPwdValue(e.target.value)}
                      autoFocus
                    />
                    <button onClick={() => setPassword(ag)} disabled={pwdBusy} className="btn btn-primary px-3">
                      <KeyRound className="w-4 h-4" />{pwdBusy ? "…" : "Redéfinir"}
                    </button>
                    <button onClick={() => togglePwdRow(ag.id)} className="btn btn-ghost px-3">Annuler</button>
                    <p className="text-[11px] text-ink-muted w-full">
                      L'agent devra changer ce mot de passe à sa prochaine connexion.
                    </p>
                  </div>
                )}

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
