import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, LogOut } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";

export default function ForcePasswordChange() {
  const { agent, signOut } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("8 caractères minimum.");
    if (pw !== pw2) return toast.error("Les mots de passe ne correspondent pas.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: pw,
      data: { must_change_password: false },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Mot de passe mis à jour. Bienvenue !");
    // La session est mise à jour (USER_UPDATED) → le verrou se lève automatiquement.
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 bg-bg-0">
      <div className="panel p-7 max-w-md w-full space-y-4">
        <div className="flex items-center gap-2 text-cyan-bright">
          <KeyRound className="w-5 h-5" />
          <h1 className="text-xl">Définissez votre mot de passe</h1>
        </div>
        <p className="text-sm text-ink-dim">
          Bonjour {agent?.prenom}, pour votre première connexion vous devez choisir un nouveau mot de passe personnel.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Confirmer</label>
            <input type="password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Enregistrement…" : "Valider et continuer"}
          </button>
        </form>
        <button onClick={signOut} className="btn btn-ghost text-xs w-full">
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
