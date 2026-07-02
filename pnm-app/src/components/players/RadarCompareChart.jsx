import { useState } from "react";
import { calcAge } from "../../lib/utils";

// Radar de comparaison — superpose les stats/profil de chaque joueur.
// Chaque critère cochable ajoute/retire une branche (axe) du graphique ;
// chaque joueur garde sa couleur : ligne pleine + surface en transparence,
// la même couleur que son texte dans le tableau de comparaison.
const CRITERIA = [
  { key: "matchs", label: "Matchs", group: "Stats de jeu", get: (p, st) => Number(st?.matchs) || 0 },
  { key: "buts", label: "Buts", group: "Stats de jeu", get: (p, st) => Number(st?.buts) || 0 },
  { key: "passes", label: "Passes", group: "Stats de jeu", get: (p, st) => Number(st?.passes) || 0 },
  { key: "minutes_jouees", label: "Minutes jouées", group: "Stats de jeu", get: (p, st) => Number(st?.minutes_jouees) || 0 },
  { key: "age", label: "Âge", group: "Profil & valeur", get: (p) => calcAge(p.date_naissance) || 0 },
  { key: "taille_cm", label: "Taille", group: "Profil & valeur", get: (p) => Number(p.taille_cm) || 0 },
  { key: "poids_kg", label: "Poids", group: "Profil & valeur", get: (p) => Number(p.poids_kg) || 0 },
  { key: "valeur_estimee_eur", label: "Valeur estimée", group: "Profil & valeur", get: (p) => Number(p.valeur_estimee_eur) || 0 },
];
const DEFAULT_KEYS = ["matchs", "buts", "passes", "minutes_jouees"];
const MIN_AXES = 3;
const GROUPS = ["Stats de jeu", "Profil & valeur"];

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function axisPoint(cx, cy, r, i, n) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export default function RadarCompareChart({ players, statsByPlayer, colors }) {
  const [selected, setSelected] = useState(DEFAULT_KEYS);
  const axes = CRITERIA.filter((c) => selected.includes(c.key));

  function toggle(key) {
    setSelected((sel) => {
      if (sel.includes(key)) {
        if (sel.length <= MIN_AXES) return sel;
        return sel.filter((k) => k !== key);
      }
      return [...sel, key];
    });
  }

  const W = 360, H = 320, cx = W / 2, cy = H / 2 - 6, R = 108;
  const n = axes.length;
  const gridLevels = [1, 0.75, 0.5, 0.25];

  const raw = players.map((p) => axes.map((ax) => ax.get(p, statsByPlayer[p.id])));
  const maxByAxis = axes.map((_, ai) => Math.max(1, ...raw.map((r) => r[ai])));
  const hasAnyData = raw.some((vals) => vals.some((v) => v > 0));

  const polysByPlayer = raw.map((vals) =>
    vals.map((v, ai) => axisPoint(cx, cy, R * (v / maxByAxis[ai]), ai, n))
  );

  return (
    <div className="panel p-5">
      <h3 className="text-sm uppercase tracking-wider text-cyan-bright mb-1">Radar de comparaison</h3>
      {!hasAnyData && (
        <p className="text-xs text-ink-muted mb-2">Aucune donnée renseignée pour les critères sélectionnés — le radar reste vide.</p>
      )}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="flex flex-col items-center shrink-0">
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="max-w-full">
            {gridLevels.map((f) => (
              <polygon
                key={f}
                points={axes.map((_, i) => axisPoint(cx, cy, R * f, i, n).join(",")).join(" ")}
                fill="none"
                stroke="#285a78"
                strokeWidth="1"
              />
            ))}
            {axes.map((ax, i) => {
              const [x, y] = axisPoint(cx, cy, R, i, n);
              const [lx, ly] = axisPoint(cx, cy, R + 24, i, n);
              return (
                <g key={ax.key}>
                  <line x1={cx} y1={cy} x2={x} y2={y} stroke="#285a78" strokeWidth="1" />
                  <text x={lx} y={ly} fill="#8aa9bd" fontSize="10" textAnchor="middle" dominantBaseline="middle">
                    {ax.label.toUpperCase()}
                  </text>
                </g>
              );
            })}
            {polysByPlayer.map((poly, pi) => (
              <polygon
                key={players[pi].id}
                points={poly.map((pt) => pt.join(",")).join(" ")}
                fill={hexToRgba(colors[pi], 0.25)}
                stroke={colors[pi]}
                strokeWidth="2"
              />
            ))}
            {polysByPlayer.map((poly, pi) =>
              poly.map(([x, y], ai) => (
                <circle key={`${pi}-${ai}`} cx={x} cy={y} r="3" fill={colors[pi]} />
              ))
            )}
          </svg>
          <div className="flex flex-wrap justify-center gap-4 mt-1">
            {players.map((p, i) => (
              <span key={p.id} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: colors[i] }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[i] }} />
                {p.prenom} {p.nom}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full md:w-52 shrink-0 space-y-4">
          {GROUPS.map((group) => (
            <div key={group}>
              <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1.5">{group}</div>
              <div className="space-y-1">
                {CRITERIA.filter((c) => c.group === group).map((c) => {
                  const checked = selected.includes(c.key);
                  const lockedOn = checked && selected.length <= MIN_AXES;
                  return (
                    <label key={c.key} className={`flex items-center gap-2 text-sm cursor-pointer ${lockedOn ? "opacity-60" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={lockedOn}
                        onChange={() => toggle(c.key)}
                      />
                      <span className="text-ink-dim">{c.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-ink-muted">{MIN_AXES} critères minimum requis.</p>
        </div>
      </div>
    </div>
  );
}
