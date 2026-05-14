import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";

const schema = z.object({
  nom: z.string().min(1, "Requis"),
  prenom: z.string().min(1, "Requis"),
  date_naissance: z.string().optional().or(z.literal("")),
  nationalite: z.string().optional().or(z.literal("")),
  poste: z.string().optional().or(z.literal("")),
  pied_fort: z.enum(["gauche", "droit", "ambidextre"]).optional().or(z.literal("")),
  taille_cm: z.coerce.number().int().positive().max(259).optional().or(z.literal("")),
  poids_kg: z.coerce.number().positive().max(199).optional().or(z.literal("")),
  club_actuel: z.string().optional().or(z.literal("")),
  club_precedent: z.string().optional().or(z.literal("")),
  fin_contrat: z.string().optional().or(z.literal("")),
  valeur_estimee_eur: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
  telephone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  statut: z.enum(["joueur", "prospect"]),
  agent_referent: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  consentement_rgpd: z.boolean().optional(),
});

function cleanForDB(values) {
  const out = {};
  for (const [k, v] of Object.entries(values)) {
    if (v === "" || v === undefined) out[k] = null;
    else out[k] = v;
  }
  if (out.consentement_rgpd === true) out.consentement_rgpd_date = new Date().toISOString();
  return out;
}

export default function PlayerForm({ player, onCancel, onSaved }) {
  const { agent, isAdmin } = useAuth();
  const [agents, setAgents] = useState([]);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      statut: "prospect",
      agent_referent: agent?.id ?? "",
      consentement_rgpd: false,
      ...player,
      date_naissance: player?.date_naissance ?? "",
      fin_contrat: player?.fin_contrat ?? "",
    },
  });

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("agents").select("id, nom, prenom").order("nom").then(({ data }) => setAgents(data ?? []));
  }, [isAdmin]);

  useEffect(() => {
    if (player) reset({
      ...player,
      date_naissance: player.date_naissance ?? "",
      fin_contrat: player.fin_contrat ?? "",
    });
  }, [player, reset]);

  async function onSubmit(values) {
    setSaving(true);
    try {
      const payload = cleanForDB(values);
      if (player?.id) {
        const { data, error } = await supabase.from("players").update(payload).eq("id", player.id).select().single();
        if (error) throw error;
        onSaved(data, "update");
      } else {
        if (!payload.agent_referent) payload.agent_referent = agent.id;
        const { data, error } = await supabase.from("players").insert(payload).select().single();
        if (error) throw error;
        onSaved(data, "create");
      }
    } catch (e) {
      alert("Erreur : " + e.message);
    } finally {
      setSaving(false);
    }
  }

  function Field({ name, label, type = "text", as = "input", children, ...rest }) {
    const E = as;
    return (
      <div>
        <label className="label" htmlFor={name}>{label}</label>
        <E id={name} type={type} className="input" {...register(name)} {...rest}>{children}</E>
        {errors[name] && <p className="text-[11px] text-red-300 mt-1">{errors[name].message}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="panel p-5 space-y-4">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Identité</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field name="prenom" label="Prénom *" />
          <Field name="nom" label="Nom *" />
          <Field name="date_naissance" label="Date de naissance" type="date" />
          <Field name="nationalite" label="Nationalité" />
          <Field name="statut" label="Statut *" as="select">
            <option value="prospect">Prospect</option>
            <option value="joueur">Joueur signé</option>
          </Field>
          {isAdmin ? (
            <Field name="agent_referent" label="Agent référent" as="select">
              <option value="">— aucun —</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
            </Field>
          ) : (
            <div>
              <label className="label">Agent référent</label>
              <input className="input" value={`${agent?.prenom} ${agent?.nom}`} disabled />
            </div>
          )}
        </div>
      </section>

      <section className="panel p-5 space-y-4">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Profil sportif</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field name="poste" label="Poste" />
          <Field name="pied_fort" label="Pied fort" as="select">
            <option value="">—</option>
            <option value="gauche">Gauche</option>
            <option value="droit">Droit</option>
            <option value="ambidextre">Ambidextre</option>
          </Field>
          <Field name="taille_cm" label="Taille (cm)" type="number" />
          <Field name="poids_kg" label="Poids (kg)" type="number" step="0.1" />
        </div>
      </section>

      <section className="panel p-5 space-y-4">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Carrière</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="club_actuel" label="Club actuel" />
          <Field name="club_precedent" label="Club précédent" />
          <Field name="fin_contrat" label="Fin de contrat" type="date" />
          <Field name="valeur_estimee_eur" label="Valeur estimée (€)" type="number" />
        </div>
      </section>

      <section className="panel p-5 space-y-4">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Coordonnées</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="telephone" label="Téléphone" />
          <Field name="email" label="Email" type="email" />
        </div>
      </section>

      <section className="panel p-5 space-y-4">
        <h3 className="text-sm uppercase tracking-wider text-cyan-bright">Notes internes (Markdown)</h3>
        <textarea className="input min-h-[140px] font-mono text-xs" {...register("notes")} placeholder="**Forces** : ..." />
      </section>

      <section className="panel p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1" {...register("consentement_rgpd")} />
          <span className="text-sm text-ink-dim">
            Le joueur (ou son représentant légal) a donné son <b>consentement RGPD</b> pour le stockage et le traitement
            de ses données personnelles par PNM Sports. Il peut demander à tout moment l'accès, la rectification ou la suppression.
          </span>
        </label>
      </section>

      <div className="flex justify-end gap-2 sticky bottom-4">
        <button type="button" onClick={onCancel} className="btn btn-ghost"><X className="w-4 h-4" />Annuler</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save className="w-4 h-4" />{saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
