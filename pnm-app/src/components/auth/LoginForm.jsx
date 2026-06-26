import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { LogIn, Mail, KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function LoginForm() {
  const { signIn, resetPassword } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Connecté");
      nav(from, { replace: true });
    } catch (err) {
      toast.error(err.message ?? "Échec de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResetPassword() {
    if (!email) { toast.error("Renseigne d'abord ton email"); return; }
    setResetting(true);
    try {
      await resetPassword(email);
      toast.success("Email envoyé si le compte existe");
    } catch (err) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setResetting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md panel p-8 space-y-5">
      <header className="text-center space-y-3">
        <img src="/logo-pnm.png" alt="PNM Sports" className="mx-auto h-20 w-auto select-none" draggable={false} />
        <h1 className="text-2xl">Espace agents</h1>
        <p className="text-sm text-ink-dim">Connecte-toi pour gérer joueurs et prospects.</p>
      </header>

      <div>
        <label className="label" htmlFor="email">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input pl-10"
            placeholder="agent@pnm-sports.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="password">Mot de passe</label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input pl-10"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        Se connecter
      </button>

      <div className="text-center">
        <button
          type="button"
          className="text-xs text-ink-dim hover:text-cyan-bright transition-colors disabled:opacity-50"
          onClick={onResetPassword}
          disabled={resetting}
        >
          Mot de passe oublié ?
        </button>
      </div>

      <p className="text-[11px] text-ink-muted text-center leading-relaxed">
        Accès réservé aux agents PNM. Les comptes sont créés par un administrateur.
      </p>
    </form>
  );
}
