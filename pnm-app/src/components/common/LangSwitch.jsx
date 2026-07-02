// Sélecteur FR/EN compact, réutilisé sur les pages publiques (vitrine)
// et dans la barre latérale de l'espace agents (brique vitrine_multilingue).
export default function LangSwitch({ lang, setLang, className = "" }) {
  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      <button onClick={() => setLang("fr")} className={`px-2 py-1 rounded ${lang === "fr" ? "bg-cyan-bright/15 text-cyan-bright" : "text-ink-muted hover:text-ink"}`}>FR</button>
      <button onClick={() => setLang("en")} className={`px-2 py-1 rounded ${lang === "en" ? "bg-cyan-bright/15 text-cyan-bright" : "text-ink-muted hover:text-ink"}`}>EN</button>
    </div>
  );
}
