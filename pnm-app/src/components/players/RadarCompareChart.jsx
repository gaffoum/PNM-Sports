// Radar de comparaison — superpose les stats de jeu de chaque joueur.
// Chaque joueur a sa couleur : ligne pleine + surface remplie en transparence,
// la même couleur que son texte dans le tableau de comparaison (cohérence visuelle).
const AXES = [
  { key: "matchs", label: "MATCHS" },
  { key: "buts", label: "BUTS" },
  { key: "passes", label: "PASSES" },
  { key: "minutes_jouees", label: "MINUTES" },
];

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
  const W = 360, H = 320, cx = W / 2, cy = H / 2 - 6, R = 108;
  const n = AXES.length;
  const gridLevels = [1, 0.75, 0.5, 0.25];

  const raw = players.map((p) => AXES.map((ax) => Number(statsByPlayer[p.id]?.[ax.key]) || 0));
  const maxByAxis = AXES.map((_, ai) => Math.max(1, ...raw.map((r) => r[ai])));
  const hasAnyData = raw.some((vals) => vals.some((v) => v > 0));

  const polysByPlayer = raw.map((vals) =>
    vals.map((v, ai) => axisPoint(cx, cy, R * (v / maxByAxis[ai]), ai, n))
  );

  return (
    <div className="panel p-5">
      <h3 className="text-sm uppercase tracking-wider text-cyan-bright mb-1">Radar — stats de jeu (dernière saison)</h3>
      {!hasAnyData && (
        <p className="text-xs text-ink-muted mb-2">Aucune statistique de saison renseignée pour ces joueurs — le radar reste vide.</p>
      )}
      <div className="flex flex-col items-center">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="max-w-full">
          {gridLevels.map((f) => (
            <polygon
              key={f}
              points={AXES.map((_, i) => axisPoint(cx, cy, R * f, i, n).join(",")).join(" ")}
              fill="none"
              stroke="#285a78"
              strokeWidth="1"
            />
          ))}
          {AXES.map((ax, i) => {
            const [x, y] = axisPoint(cx, cy, R, i, n);
            const [lx, ly] = axisPoint(cx, cy, R + 24, i, n);
            return (
              <g key={ax.key}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke="#285a78" strokeWidth="1" />
                <text x={lx} y={ly} fill="#8aa9bd" fontSize="10" textAnchor="middle" dominantBaseline="middle">
                  {ax.label}
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
    </div>
  );
}
