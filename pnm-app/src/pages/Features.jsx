import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ToggleLeft, ToggleRight, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { useFeatures } from "../hooks/useFeatures";
import { PACKS, packLabel } from "../lib/features";

export default function Features() {
  const { agent } = useAuth();
  const { refreshFeatures } = useFeatures();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("features").select("*").order("pack").order("label");
    if (error) toast.error(error.message);
    else setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggle(row) {
    setBusy(row.key);
    const enabled = !row.enabled;
    const patch = enabled
      ? { enabled, enabled_at: new Date().toISOString(), enabled_by: agent.id }
      : { enabled, enabled_at: null, enabled_by: null };
    const { error } = await supabase.from("features").update(patch).eq("key", row.key);
    setBusy(null);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => (r.key === row.key ? { ...r, ...patch } : r)));
    refreshFeatures();
    toast.success(`${row.label} : ${enabled ? "activée" : "désactivée"}`);
  }

  const grouped = PACKS
    .map((p) => ({ ...p, items: rows.filter((r) => r.pack === p.key) }))
    .filter((p) => p.items.length > 0);
  const orphans = rows.filter((r) => !PACKS.some((p) => p.key === r.pack));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl">Briques & évolutions</h1>
        <p className="text-ink-dim text-sm">
          Fonctionnalités développées en avance de vente. Active une brique une fois le devis correspondant accepté —
          elle devient disponible immédiatement, sans déploiement.
        </p>
      </header>

      {loading ? (
        <div className="text-ink-dim">Chargement…</div>
      ) : rows.length === 0 ? (
        <div className="panel p-5 text-sm text-ink-dim">
          Aucune brique enregistrée. Applique la migration <code>0005_features.sql</code> sur Supabase.
        </div>
      ) : (
        <div className="space-y-5">
          {[...grouped, ...(orphans.length ? [{ key: "_", label: "Autres", items: orphans }] : [])].map((pack) => (
            <div key={pack.key} className="panel p-5">
              <h3 className="text-sm uppercase tracking-wider text-cyan-bright flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" /> {packLabel(pack.key)}
              </h3>
              <ul className="divide-y divide-line">
                {pack.items.map((row) => (
                  <li key={row.key} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{row.label}</div>
                      <div className="text-[11px] text-ink-muted">
                        {row.enabled
                          ? `Activée${row.enabled_at ? " le " + new Date(row.enabled_at).toLocaleDateString("fr-FR") : ""}`
                          : "Désactivée — masquée côté agents"}
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(row)}
                      disabled={busy === row.key}
                      className={`btn px-3 ${row.enabled ? "btn-primary" : "btn-outline"}`}
                      title={row.enabled ? "Désactiver" : "Activer"}
                    >
                      {row.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {row.enabled ? "Activée" : "Inactive"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
