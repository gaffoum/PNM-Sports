import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isFeaturePublicEnabled, getVitrineJoueurs } from "../hooks/useVitrine";
import { useLang } from "../lib/i18n";
import { calcAge } from "../lib/utils";

function LangSwitch({ lang, setLang }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button onClick={() => setLang("fr")} className={`px-2 py-1 rounded ${lang === "fr" ? "bg-cyan-bright/15 text-cyan-bright" : "text-ink-muted hover:text-ink"}`}>FR</button>
      <button onClick={() => setLang("en")} className={`px-2 py-1 rounded ${lang === "en" ? "bg-cyan-bright/15 text-cyan-bright" : "text-ink-muted hover:text-ink"}`}>EN</button>
    </div>
  );
}

export default function VitrinePublic() {
  const { lang, setLang, t } = useLang();
  const [enabled, setEnabled] = useState(null);
  const [multilingue, setMultilingue] = useState(false);
  const [blog, setBlog] = useState(false);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    (async () => {
      const [pubOk, ml, bl] = await Promise.all([
        isFeaturePublicEnabled("vitrine_public_joueurs"),
        isFeaturePublicEnabled("vitrine_multilingue"),
        isFeaturePublicEnabled("vitrine_blog"),
      ]);
      setEnabled(pubOk);
      setMultilingue(ml);
      setBlog(bl);
      if (pubOk) setPlayers(await getVitrineJoueurs());
    })();
  }, []);

  if (enabled === null) return <div className="min-h-screen bg-bg-0" />;
  if (!enabled) {
    return (
      <div className="min-h-screen bg-bg-0 text-ink grid place-items-center px-4">
        <div className="text-center">
          <p className="text-ink-dim">Page indisponible.</p>
          <Link to="/" className="text-cyan-bright hover:underline text-sm mt-2 inline-block">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-0 text-ink">
      <header className="border-b border-line px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}logo-pnm.png`} alt="PNM Sports" className="w-8 h-8 rounded object-contain" />
          <span className="font-display font-bold text-sm tracking-[0.18em]">PNM SPORTS</span>
        </Link>
        <div className="flex items-center gap-4">
          {blog && <Link to="/actualites" className="text-sm text-ink-dim hover:text-cyan-bright">{t("blog_title")}</Link>}
          {multilingue && <LangSwitch lang={lang} setLang={setLang} />}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-display font-bold">{t("vitrine_title")}</h1>
        <p className="text-ink-dim mt-1">{t("vitrine_subtitle")}</p>

        {players.length === 0 ? (
          <p className="text-ink-dim mt-8">{t("vitrine_empty")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {players.map((p) => {
              const age = calcAge(p.date_naissance);
              return (
                <div key={p.id} className="panel p-4 flex items-center gap-3">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-16 h-16 rounded-full object-cover border border-line-strong" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-bg-1 border border-line grid place-items-center font-display text-lg text-ink-dim">
                      {(p.prenom?.[0] ?? "") + (p.nom?.[0] ?? "")}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.prenom} {p.nom}</div>
                    <div className="text-xs text-ink-dim mt-0.5">{p.poste ?? "—"} {age ? `· ${age} ans` : ""}</div>
                    <div className="text-xs text-ink-muted mt-0.5 truncate">{p.club_actuel || t("vitrine_no_club")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-line py-4 text-center text-[11px] text-ink-muted">
        © {new Date().getFullYear()} PNM Sports — {t("footer_rights")}
      </footer>
    </div>
  );
}
