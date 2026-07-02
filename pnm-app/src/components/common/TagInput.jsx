import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// Champ à tags avec auto-complétion — texte libre autorisé (les
// suggestions ne sont qu'une aide, pas une liste fermée).
export default function TagInput({ value = [], onChange, suggestions = [], placeholder, className = "" }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const q = text.trim().toLowerCase();
  const matches = suggestions
    .filter((s) => !value.includes(s))
    .filter((s) => (q ? s.toLowerCase().includes(q) : true))
    .slice(0, 8);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function addTag(tag) {
    const t = tag.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setText("");
    setOpen(false);
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag));
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (text.trim()) addTag(text);
    } else if (e.key === "Backspace" && !text && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <div className="input flex flex-wrap items-center gap-1.5 min-h-[42px] py-1.5">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-cyan-bright/10 text-cyan-bright border border-cyan-bright/30 rounded-full px-2 py-0.5 text-xs">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm placeholder:text-ink-muted"
          placeholder={value.length === 0 ? placeholder : ""}
          value={text}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && matches.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-panel rounded-card border border-line-strong shadow-2xl py-1">
          {matches.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(s)}
                className="w-full text-left px-3 py-1.5 text-sm text-ink-dim hover:bg-line/30 hover:text-ink transition-colors"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
