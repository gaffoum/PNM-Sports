import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (pwd.length < 6) return toast.error("6 caractères minimum");
    if (pwd !== pwd2) return toast.error("Mots de passe différents");
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) return toast.error(error.message);
    toast.success("Mot de passe mis à jour");
    nav("/dashboard");
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={submit} className="panel p-8 w-full max-w-md space-y-4">
        <h1 className="text-2xl">Réinitialiser le mot de passe</h1>
        {!ready && <p className="text-sm text-ink-dim">Vérifie ton email et clique sur le lien pour reset.</p>}
        <div><label className="label">Nouveau</label><input type="password" className="input" value={pwd} onChange={(e) => setPwd(e.target.value)} /></div>
        <div><label className="label">Confirmer</label><input type="password" className="input" value={pwd2} onChange={(e) => setPwd2(e.target.value)} /></div>
        <button className="btn btn-primary w-full" disabled={!ready}><KeyRound className="w-4 h-4" />Valider</button>
      </form>
    </div>
  );
}
