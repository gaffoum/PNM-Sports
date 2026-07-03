import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { isFeaturePublicEnabled, getVitrineBlogPosts } from "../hooks/useVitrine";
import { useLang } from "../lib/i18n";
import { formatDateFr } from "../lib/utils";
import { BRAND } from "../config/brand";

export default function BlogPublic() {
  const { slug } = useParams();
  const { t } = useLang();
  const [enabled, setEnabled] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    (async () => {
      const ok = await isFeaturePublicEnabled("vitrine_blog");
      setEnabled(ok);
      if (ok) setPosts(await getVitrineBlogPosts());
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

  const current = slug ? posts.find((p) => p.slug === slug) : null;

  return (
    <div className="min-h-screen bg-bg-0 text-ink">
      <header className="border-b border-line px-6 h-16 flex items-center gap-2">
        <Link to="/vitrine" className="flex items-center gap-2">
          <img src={BRAND.logoPath} alt={BRAND.name} className="w-8 h-8 rounded object-contain" />
          <span className="font-display font-bold text-sm tracking-[0.18em] uppercase">{BRAND.name}</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {slug ? (
          current ? (
            <article>
              <Link to="/actualites" className="text-sm text-cyan-bright hover:underline flex items-center gap-1 mb-4"><ArrowLeft className="w-3.5 h-3.5" />{t("blog_back")}</Link>
              <h1 className="text-3xl font-display font-bold">{current.titre}</h1>
              <p className="text-ink-muted text-xs mt-1">{formatDateFr(current.published_at)}</p>
              <div className="mt-6 text-ink-dim whitespace-pre-wrap leading-relaxed">{current.contenu}</div>
            </article>
          ) : (
            <p className="text-ink-dim">Article introuvable.</p>
          )
        ) : (
          <>
            <h1 className="text-3xl font-display font-bold">{t("blog_title")}</h1>
            <p className="text-ink-dim mt-1">{t("blog_subtitle")}</p>
            {posts.length === 0 ? (
              <p className="text-ink-dim mt-8">{t("blog_empty")}</p>
            ) : (
              <div className="space-y-4 mt-8">
                {posts.map((p) => (
                  <Link key={p.id} to={`/actualites/${p.slug}`} className="panel panel-hover p-4 block">
                    <div className="font-semibold">{p.titre}</div>
                    <div className="text-xs text-ink-muted mt-0.5">{formatDateFr(p.published_at)}</div>
                    {p.extrait && <p className="text-sm text-ink-dim mt-1.5">{p.extrait}</p>}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-line py-4 text-center text-[11px] text-ink-muted">
        © {new Date().getFullYear()} {BRAND.name} — {t("footer_rights")}
      </footer>
    </div>
  );
}
