import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function StatsTable({ playerId, stats, onChange }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ saison: "", matchs: 0, buts: 0, passes: 0, minutes_jouees: 0 });

  async function add() {
    if (!form.saison) return;
    const { data, error } = await supabase
      .from("player_stats")
      .insert({ ...form, player_id: playerId })
      .select().single();
    if (error) { alert(error.message); return; }
    onChange([data, ...stats]);
    setForm({ saison: "", matchs: 0, buts: 0, passes: 0, minutes_jouees: 0 });
    setAdding(false);
  }

  async function del(id) {
    if (!confirm("Supprimer cette saison ?")) return;
    const { error } = await supabase.from("player_stats").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    onChange(stats.filter((s) => s.id !== id));
  }

  return (
    <div className="panel p-5 space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Statistiques par saison</h3>
        {!adding && <button onClick={() => setAdding(true)} className="btn btn-ghost text-xs"><Plus className="w-3.5 h-3.5" />Saison</button>}
      </header>
      {adding && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end border-b border-line pb-3">
          <div><label className="label">Saison</label><input className="input" placeholder="2025/2026" value={form.saison} onChange={(e) => setForm({ ...form, saison: e.target.value })} /></div>
          {["matchs", "buts", "passes", "minutes_jouees"].map((k) => (
            <div key={k}><label className="label">{k.replace("_", " ")}</label>
              <input type="number" className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} />
            </div>
          ))}
          <div className="flex gap-1"><button onClick={add} className="btn btn-primary">Ajouter</button><button onClick={() => setAdding(false)} className="btn btn-ghost">Annuler</button></div>
        </div>
      )}
      {stats.length === 0 && !adding && <p className="text-sm text-ink-dim">Aucune statistique enregistrée.</p>}
      {stats.length > 0 && (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase text-ink-muted border-b border-line">
            <th className="py-2">Saison</th><th>Matchs</th><th>Buts</th><th>Passes</th><th>Minutes</th><th></th>
          </tr></thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.id} className="border-b border-line/40">
                <td className="py-2 font-semibold">{s.saison}</td>
                <td>{s.matchs}</td><td>{s.buts}</td><td>{s.passes}</td><td>{s.minutes_jouees}</td>
                <td className="text-right"><button onClick={() => del(s.id)} className="btn btn-ghost p-1.5"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
