import { SCOUTING_AXES } from "../../lib/scouting";

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

// Radar « réel » (brique data_radar_reel) : 6 axes fixes, échelle 1-10,
// alimenté par la dernière évaluation de scouting interne.
export default function PlayerRadarChart({ scores, color = "#7ce3ff" }) {
  const W = 300, H = 270, cx = W / 2, cy = H / 2 - 4, R = 92;
  const n = SCOUTING_AXES.length;
  const gridLevels = [1, 0.75, 0.5, 0.25];

  const values = SCOUTING_AXES.map((ax) => Number(scores?.[ax.key]) || 0);
  const points = values.map((v, i) => axisPoint(cx, cy, R * (v / 10), i, n));

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="max-w-full">
      {gridLevels.map((f) => (
        <polygon
          key={f}
          points={SCOUTING_AXES.map((_, i) => axisPoint(cx, cy, R * f, i, n).join(",")).join(" ")}
          fill="none"
          stroke="#285a78"
          strokeWidth="1"
        />
      ))}
      {SCOUTING_AXES.map((ax, i) => {
        const [x, y] = axisPoint(cx, cy, R, i, n);
        const [lx, ly] = axisPoint(cx, cy, R + 22, i, n);
        return (
          <g key={ax.key}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#285a78" strokeWidth="1" />
            <text x={lx} y={ly} fill="#8aa9bd" fontSize="10" textAnchor="middle" dominantBaseline="middle">
              {ax.label.toUpperCase()}
            </text>
          </g>
        );
      })}
      <polygon
        points={points.map((p) => p.join(",")).join(" ")}
        fill={hexToRgba(color, 0.25)}
        stroke={color}
        strokeWidth="2"
      />
      {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={color} />)}
    </svg>
  );
}
