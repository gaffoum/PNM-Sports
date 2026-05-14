import { useState } from "react";
import { toast } from "sonner";
import { Save, KeyRound } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

export default function Profile() {
  const { agent, user } = useAuth();
  const [nom, setNom] = useState(agent?.nom ?? "");
  const [prenom, setPrenom] = useState(agent?.prenom ?? "");
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");

  async function saveProfile(e) {
    e.preventDefault();
    const { error } = await supabase.from("agents").update({ nom, prenom }).eq("id", agent.id);
    if (error) toast.error(error.message);
    else toast.success("Profil enregistré");
  }

  async function updatePwd(e) {
    e.preventDefault();
    if (pwd1.length < 6) return toast.error("6 caractères minimum");
    if (pwd1 !== pwd2) return toast.error("Mots de passe différents");
    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    if (error) toast.error(error.message);
    else { toast.success("Mot de passe modifié"); setPwd1(""); setPwd2(""); }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl">Mon profil</h1>
      <form onSubmit={saveProfile} className="panel p-5 space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-cyan-bright">Informations</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Prénom</label><input className="input" value={prenom} onChange={(e) => setPrenom(e.target.value)} /></div>
          <div><label className="label">Nom</label><input className="input" value={nom} onChange={(e) => setNom(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Email</label><input className="input" value={user?.email ?? ""} disabled /></div>
          <div><label className="label">Rôle</label><input className="input" value={agent?.role ?? ""} disabled /></div>
        </div>
        <button className="btn btn-primary w-fit"><Save className="w-4 h-4" />Enregistrer</button>
      </form>

      <form onSubmit={updatePwd} className="panel p-5 space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-cyan-bright">Mot de passe</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Nouveau</label><input type="password" className="input" value={pwd1} onChange={(e) => setPwd1(e.target.value)} /></div>
          <div><label className="label">Confirmer</label><input type="password" className="input" value={pwd2} onChange={(e) => setPwd2(e.target.value)} /></div>
        </div>
        <button className="btn btn-outline w-fit"><KeyRound className="w-4 h-4" />Mettre à jour</button>
      </form>
    </div>
  );
}
