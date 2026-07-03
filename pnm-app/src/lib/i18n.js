import { useCallback, useEffect, useState } from "react";
import { BRAND } from "../config/brand";

// Dictionnaire minimal FR/EN pour les pages publiques (brique
// "Multilingue"). Volontairement limité aux pages vitrine/blog — l'espace
// agents reste en français uniquement.
const DICT = {
  fr: {
    vitrine_title: "Nos joueurs",
    vitrine_subtitle: `Une sélection de talents accompagnés par ${BRAND.name}.`,
    vitrine_empty: "Aucun joueur publié pour le moment.",
    vitrine_no_club: "Sans club",
    blog_title: "Actualités",
    blog_subtitle: `Les dernières nouvelles de ${BRAND.name}.`,
    blog_empty: "Aucun article publié pour le moment.",
    blog_back: "Retour aux actualités",
    footer_rights: "Tous droits réservés.",
  },
  en: {
    vitrine_title: "Our players",
    vitrine_subtitle: `A selection of talents represented by ${BRAND.name}.`,
    vitrine_empty: "No players published yet.",
    vitrine_no_club: "Free agent",
    blog_title: "News",
    blog_subtitle: `The latest news from ${BRAND.name}.`,
    blog_empty: "No articles published yet.",
    blog_back: "Back to news",
    footer_rights: "All rights reserved.",
  },
};

export function useLang() {
  const [lang, setLangState] = useState(() => localStorage.getItem("pnm_lang") || "fr");

  useEffect(() => {
    localStorage.setItem("pnm_lang", lang);
  }, [lang]);

  const setLang = useCallback((l) => setLangState(DICT[l] ? l : "fr"), []);
  const t = useCallback((key) => DICT[lang]?.[key] ?? DICT.fr[key] ?? key, [lang]);

  return { lang, setLang, t };
}
