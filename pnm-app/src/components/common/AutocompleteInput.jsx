import { useEffect, useRef, useState } from "react";

// Auto-complétion stylée au design du site — remplace <datalist> (rendu
// natif clair du navigateur, incohérent et peu fiable pour le filtrage).
// Filtre les options en direct à la frappe, navigation clavier, clic hors
// zone pour fermer. Texte libre autorisé (pas de sélection forcée dans la liste).
export default function AutocompleteInput({ value, onChange, options, placeholder, className = "", maxSuggestions = 8 }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  const q = (value || "").trim().toLowerCase();
  const matches = (q ? options.filter((o) => o.toLowerCase().includes(q)) : options).slice(0, maxSuggestions);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(v) {
    onChange(v);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); select(matches[highlight]); }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="text"
        autoComplete="off"
        className={`input ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto panel border border-line-strong shadow-2xl py-1">
          {matches.map((o, i) => (
            <li key={o}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(o)}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  i === highlight ? "bg-cyan-bright/10 text-cyan-bright" : "text-ink-dim hover:bg-line/30"
                }`}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
