import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, UserPlus, LogOut, User, LayoutGrid, ShieldCheck, Sparkles, Building2, ClipboardList, CalendarClock, GitMerge, Euro, ShieldAlert, ScrollText, Wallet, FileBarChart, Newspaper, FileText, Scale, BookMarked, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useFeatures } from "../../hooks/useFeatures";
import { useLanguage } from "../../hooks/useLanguage";
import { isOwner } from "../../lib/ownership";
import NotificationBell from "./NotificationBell";
import LangSwitch from "../common/LangSwitch";

function NavItem({ to, icon: Icon, children, end, onClick, sub }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg text-sm transition-colors ${sub ? "pl-9 pr-3 py-2 text-[13px]" : "px-3 py-2.5"} ${
          isActive ? "bg-cyan-bright/10 text-cyan-bright" : "text-ink-dim hover:text-ink hover:bg-line/30"
        }`
      }
    >
      <Icon className={sub ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4 shrink-0"} />
      <span>{children}</span>
    </NavLink>
  );
}

function NavGroup({ to, icon: Icon, children, label, onNavigate }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  const [open, setOpen] = useState(isActive);

  return (
    <div>
      <div className={`flex items-center rounded-lg text-sm transition-colors ${isActive ? "bg-cyan-bright/10" : "hover:bg-line/30"}`}>
        <NavLink
          to={to}
          onClick={onNavigate}
          className={`flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0 ${isActive ? "text-cyan-bright" : "text-ink-dim hover:text-ink"}`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{label}</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`px-2.5 py-2.5 shrink-0 ${isActive ? "text-cyan-bright" : "text-ink-dim hover:text-ink"}`}
          title={open ? "Réduire" : "Développer"}
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div className={`grid transition-all duration-200 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function SidebarContent({ agent, isAdmin, hasFeature, onNavigate, onSignOut, goProfile }) {
  const { t, lang, setLang } = useLanguage();
  const hasMultilingue = hasFeature("vitrine_multilingue");
  return (
    <div className="flex flex-col h-full">
      {/* Marque */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-line shrink-0">
        <img src={`${import.meta.env.BASE_URL}logo-pnm.png`} alt="PNM Sports" className="w-9 h-9 rounded-lg object-contain" />
        <div className="leading-tight">
          <div className="font-display font-bold text-sm tracking-[0.18em]">PNM SPORTS</div>
          <div className="text-[9px] tracking-[0.3em] text-cyan-bright">ESPACE AGENTS</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {hasMultilingue && <LangSwitch lang={lang} setLang={setLang} />}
          {hasFeature("comm_notifications") && <NotificationBell />}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NavItem to="/dashboard" icon={LayoutDashboard} end onClick={onNavigate}>{t("nav.dashboard")}</NavItem>
        <NavGroup to="/players" icon={Users} label={t("nav.players")} onNavigate={onNavigate}>
          <NavItem to="/players/new" icon={UserPlus} onClick={onNavigate} sub>{t("nav.players_add")}</NavItem>
        </NavGroup>
        <NavItem to="/recrutement" icon={LayoutGrid} onClick={onNavigate}>{t("nav.recruitment")}</NavItem>
        {hasFeature("placement_clubs") && <NavItem to="/clubs" icon={Building2} onClick={onNavigate}>{t("nav.clubs")}</NavItem>}
        {hasFeature("placement_besoins_clubs") && <NavItem to="/besoins-clubs" icon={ClipboardList} onClick={onNavigate}>{t("nav.club_needs")}</NavItem>}
        {hasFeature("placement_agenda") && <NavItem to="/agenda" icon={CalendarClock} onClick={onNavigate}>{t("nav.agenda")}</NavItem>}
        {hasFeature("placement_pipeline") && <NavItem to="/pipeline" icon={GitMerge} onClick={onNavigate}>{t("nav.pipeline")}</NavItem>}
        {hasFeature("placement_commissions") && <NavItem to="/commissions" icon={Euro} onClick={onNavigate}>{t("nav.commissions")}</NavItem>}
        {hasFeature("pilotage_portefeuille") && <NavItem to="/portefeuille" icon={Wallet} onClick={onNavigate}>{t("nav.portfolio")}</NavItem>}
        {hasFeature("media_generateur_documents") && <NavItem to="/documents" icon={FileText} onClick={onNavigate}>{t("nav.documents")}</NavItem>}
        {hasFeature("data_assistant_juridique") && (
          isAdmin ? (
            <NavGroup to="/assistant-juridique" icon={Scale} label={t("nav.legal_assistant")} onNavigate={onNavigate}>
              <NavItem to="/assistant-juridique/sources" icon={BookMarked} onClick={onNavigate} sub>{t("nav.legal_sources")}</NavItem>
            </NavGroup>
          ) : (
            <NavItem to="/assistant-juridique" icon={Scale} onClick={onNavigate}>{t("nav.legal_assistant")}</NavItem>
          )
        )}
        {isAdmin && <NavItem to="/agents" icon={ShieldCheck} onClick={onNavigate}>{t("nav.agents")}</NavItem>}
        {isAdmin && hasFeature("secu_audit") && <NavItem to="/audit" icon={ShieldAlert} onClick={onNavigate}>{t("nav.audit")}</NavItem>}
        {isAdmin && hasFeature("secu_rgpd") && <NavItem to="/rgpd" icon={ScrollText} onClick={onNavigate}>{t("nav.rgpd")}</NavItem>}
        {isAdmin && hasFeature("pilotage_rapports") && <NavItem to="/rapports" icon={FileBarChart} onClick={onNavigate}>{t("nav.reports")}</NavItem>}
        {isAdmin && hasFeature("vitrine_blog") && <NavItem to="/blog" icon={Newspaper} onClick={onNavigate}>{t("nav.blog")}</NavItem>}
        {isOwner(agent) && <NavItem to="/features" icon={Sparkles} onClick={onNavigate}>{t("nav.features")}</NavItem>}
      </nav>

      {/* Utilisateur + actions */}
      <div className="border-t border-line p-3 shrink-0">
        <button
          onClick={() => { goProfile(); onNavigate?.(); }}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-line/30 transition-colors text-left"
          title={t("nav.profile")}
        >
          <span className="w-9 h-9 rounded-full bg-bg-1 border border-line grid place-items-center text-cyan-bright shrink-0">
            <User className="w-4 h-4" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-xs font-semibold truncate">{agent?.prenom} {agent?.nom}</span>
            <span className={`badge mt-0.5 ${agent?.role === "admin" ? "badge-admin" : "badge-agent"}`}>{agent?.role}</span>
          </span>
        </button>
        <button onClick={onSignOut} className="btn btn-ghost w-full justify-start mt-1 px-2">
          <LogOut className="w-4 h-4" />{t("nav.signout")}
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { agent, isAdmin, signOut } = useAuth();
  const { hasFeature } = useFeatures();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    setMobileOpen(false);
    await signOut();
    nav("/login", { replace: true });
  }

  const sidebar = (
    <SidebarContent
      agent={agent}
      isAdmin={isAdmin}
      hasFeature={hasFeature}
      onNavigate={() => setMobileOpen(false)}
      onSignOut={handleSignOut}
      goProfile={() => nav("/profile")}
    />
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Barre latérale fixe (desktop) */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-line bg-bg-1/70 backdrop-blur fixed inset-y-0 left-0 z-30">
        {sidebar}
      </aside>

      {/* En-tête mobile */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 border-b border-line bg-bg-1/80 backdrop-blur">
        <button onClick={() => setMobileOpen(true)} className="btn btn-ghost px-2" title="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <img src={`${import.meta.env.BASE_URL}logo-pnm.png`} alt="PNM Sports" className="w-7 h-7 rounded object-contain" />
        <span className="font-display font-bold text-sm tracking-[0.18em]">PNM SPORTS</span>
        {hasFeature("comm_notifications") && (
          <div className="ml-auto">
            <NotificationBell />
          </div>
        )}
      </header>

      {/* Tiroir mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-bg-1 border-r border-line shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="btn btn-ghost px-2 absolute top-3 right-2 z-10" title="Fermer">
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Contenu */}
      <div className="flex-1 min-w-0 md:ml-60 flex flex-col min-h-screen">
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-8">
          <Outlet />
        </main>
        <footer className="border-t border-line py-4 text-center text-[11px] text-ink-muted">
          © {new Date().getFullYear()} PNM Sports — Espace agents
        </footer>
      </div>
    </div>
  );
}
