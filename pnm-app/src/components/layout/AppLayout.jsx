import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserPlus, LogOut, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

function NavItem({ to, icon: Icon, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive ? "bg-cyan-bright/10 text-cyan-bright" : "text-ink-dim hover:text-ink hover:bg-line/30"
        }`
      }
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
    </NavLink>
  );
}

export default function AppLayout() {
  const { agent, signOut } = useAuth();
  const nav = useNavigate();

  async function handleSignOut() {
    await signOut();
    nav("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-bg-1/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-teal-mid grid place-items-center font-display font-bold text-bg-0 text-sm">
              P
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-sm tracking-[0.18em]">PNM SPORTS</div>
              <div className="text-[9px] tracking-[0.3em] text-cyan-bright">ESPACE AGENTS</div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <NavItem to="/dashboard" icon={LayoutDashboard} end>Tableau de bord</NavItem>
            <NavItem to="/players" icon={Users}>Joueurs</NavItem>
            <NavItem to="/players/new" icon={UserPlus}>Ajouter</NavItem>
          </nav>
          <div className="flex items-center gap-2">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-xs font-semibold">{agent?.prenom} {agent?.nom}</div>
              <div className="text-[10px] text-ink-muted uppercase tracking-wider">
                <span className={`badge ${agent?.role === "admin" ? "badge-admin" : "badge-agent"}`}>{agent?.role}</span>
              </div>
            </div>
            <button onClick={() => nav("/profile")} className="btn btn-ghost px-2" title="Mon profil">
              <User className="w-4 h-4" />
            </button>
            <button onClick={handleSignOut} className="btn btn-ghost px-2" title="Déconnexion">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-line py-4 text-center text-[11px] text-ink-muted">
        © {new Date().getFullYear()} PNM Sports — Espace agents
      </footer>
    </div>
  );
}
