import { Check } from "lucide-react";
import { STATUTS, CRITERE_SUGGESTIONS, POSTE_SUGGESTIONS } from "../../lib/clubNeeds";
import AutocompleteInput from "../common/AutocompleteInput";
import TagInput from "../common/TagInput";

export default function ClubNeedForm({ form, setForm, clubNames, disableClub, submitLabel, onSubmit, onCancel, busy }) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {!disableClub && (
          <AutocompleteInput
            placeholder="Club…"
            options={clubNames}
            value={form.clubNom}
            onChange={(v) => setForm({ ...form, clubNom: v })}
          />
        )}
        <AutocompleteInput
          placeholder="Poste recherché"
          options={POSTE_SUGGESTIONS}
          value={form.poste}
          onChange={(v) => setForm({ ...form, poste: v })}
          className={disableClub ? "sm:col-span-2" : ""}
        />
      </div>
      <TagInput
        placeholder="Critères (gaucher, rapide, technique…)"
        suggestions={CRITERE_SUGGESTIONS}
        value={form.criteres}
        onChange={(v) => setForm({ ...form, criteres: v })}
      />
      <textarea
        className="input min-h-[60px]"
        placeholder="Description du besoin (contexte, échéance…)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <div className="flex flex-wrap items-center gap-2">
        <select className="input w-auto" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
          {STATUTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button type="submit" disabled={busy} className="btn btn-primary px-3">
          <Check className="w-4 h-4" />{busy ? "…" : submitLabel}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="btn btn-ghost px-3">Annuler</button>}
      </div>
    </form>
  );
}
