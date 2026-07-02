import {
  Document, Page, Text, View, StyleSheet, Image,
  Svg, Polygon, Line, Circle, Path, G, Text as SvgText,
} from "@react-pdf/renderer";
import { calcAge, formatDateFr, formatMoney } from "../../lib/utils";

// ===== Charte "Élite Dark" =====
const C = {
  bg: "#04101f",
  panel: "#0a2540",
  panelLine: "#163a57",
  cyan: "#7ce3ff",
  white: "#ffffff",
  muted: "#8cb4cd",
  dim: "#557d99",
  grid: "#285a78",
  silBg: "#0d263c",
  sil: "#1a3a56",
};

const LOGO_URL = (import.meta.env.BASE_URL || "/") + "logo-pnm.png";

const s = StyleSheet.create({
  page: { backgroundColor: C.bg, color: C.white, fontFamily: "Helvetica", fontSize: 10, paddingBottom: 44 },
  header: { backgroundColor: C.panel, paddingVertical: 16, paddingHorizontal: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  name: { fontSize: 20, fontWeight: 700, color: C.white },
  sub: { fontSize: 9, color: C.cyan, marginTop: 3, letterSpacing: 0.5 },
  logo: { width: 46, height: 46, objectFit: "contain" },

  content: { paddingHorizontal: 28, paddingTop: 16 },

  card: { backgroundColor: C.panel, borderRadius: 8, padding: 12, marginBottom: 12 },
  cardTitle: { fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: C.cyan, textAlign: "center", marginBottom: 8 },
  fieldsRow: { flexDirection: "row" },
  field: { flex: 1, alignItems: "center", paddingHorizontal: 2 },
  fLabel: { fontSize: 6.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  fValue: { fontSize: 11, fontWeight: 700, color: C.white, textAlign: "center" },

  statsHead: { flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 4 },
  statsTitle: { fontSize: 12, fontWeight: 700, color: C.cyan, letterSpacing: 1 },
  rule: { flex: 1, height: 1, backgroundColor: C.panelLine, marginLeft: 10 },
  pending: { fontSize: 7.5, color: C.dim, marginLeft: 10 },

  radarWrap: { alignItems: "center", marginTop: 4, marginBottom: 6 },
  radarNote: { fontSize: 8, color: C.dim, marginTop: 2 },

  table: { marginTop: 6 },
  tHead: { flexDirection: "row", backgroundColor: "#0a3a55", paddingVertical: 5, paddingHorizontal: 6, borderRadius: 3 },
  tRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 6, borderBottom: `1px solid ${C.panelLine}` },
  tCol: { flex: 1, fontSize: 9, color: "#d7e7f2" },
  tColH: { flex: 1, fontSize: 8, color: C.white, fontWeight: 700, textTransform: "uppercase" },

  notes: { fontSize: 9, lineHeight: 1.4, color: "#cfe2f0", backgroundColor: C.panel, borderRadius: 8, padding: 12, marginTop: 4 },
  footer: { position: "absolute", bottom: 18, left: 28, right: 28, textAlign: "center", fontSize: 7, color: C.dim, borderTop: `1px solid ${C.panelLine}`, paddingTop: 4 },

  bookTitle: { fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 14 },
  bookRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottom: `1px solid ${C.panelLine}` },
  bookLabel: { fontSize: 9, fontWeight: 700, color: C.cyan, width: 130 },
  bookValue: { fontSize: 9, color: "#d7e7f2", flex: 1 },
});

function Field({ label, value }) {
  return (
    <View style={s.field}>
      <Text style={s.fLabel}>{label}</Text>
      <Text style={s.fValue}>{value ?? "—"}</Text>
    </View>
  );
}

function Silhouette() {
  return (
    <Svg width={64} height={64}>
      <Circle cx={32} cy={32} r={31} fill={C.silBg} stroke={C.grid} strokeWidth={2} />
      <Circle cx={32} cy={26} r={9} fill={C.sil} />
      <Path d="M15 53 a17 16 0 0 1 34 0 z" fill={C.sil} />
    </Svg>
  );
}

const AXES = ["VITESSE", "TECHNIQUE", "PHYSIQUE", "MENTAL", "TACTIQUE", "PASSES"];
function poly(cx, cy, r) {
  return AXES.map((_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

const AXES_KEYS = ["vitesse", "technique", "physique", "mental", "tactique", "passes"];

function RadarPlaceholder({ evaluation }) {
  const W = 250, H = 210, cx = 125, cy = 100, R = 78;
  const hasData = !!evaluation;
  const dataPoints = hasData
    ? AXES_KEYS.map((k, i) => {
        const v = Number(evaluation[k]) || 0;
        const r = R * (v / 10);
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" ")
    : null;
  return (
    <View style={s.radarWrap}>
      <Svg width={W} height={H}>
        {[1, 0.75, 0.5, 0.25].map((f) => (
          <Polygon key={f} points={poly(cx, cy, R * f)} stroke={C.grid} strokeWidth={1} fill="none" />
        ))}
        {AXES.map((ax, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 3;
          const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
          const lx = cx + (R + 16) * Math.cos(a), ly = cy + (R + 16) * Math.sin(a);
          return (
            <G key={ax}>
              <Line x1={cx} y1={cy} x2={x} y2={y} stroke={C.grid} strokeWidth={1} />
              <SvgText x={lx} y={ly + 3} fill={C.muted} fontSize={7.5} textAnchor="middle">{ax}</SvgText>
            </G>
          );
        })}
        {hasData ? (
          <Polygon points={dataPoints} stroke={C.cyan} strokeWidth={1.5} fill="rgba(124,227,255,0.22)" />
        ) : (
          <SvgText x={cx} y={cy} fill={C.dim} fontSize={8} textAnchor="middle">Évaluation à venir</SvgText>
        )}
      </Svg>
      <Text style={s.radarNote}>
        {hasData ? "Scouting interne PNM" : "Notation en attente — scouting interne ou API BeSoccer Pro"}
      </Text>
    </View>
  );
}

function BookPage({ player, videos, docs }) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Silhouette />
          <View>
            <Text style={s.name}>{player.prenom} {player.nom}</Text>
            <Text style={s.sub}>BOOK — MÉDIAS &amp; DOCUMENTS</Text>
          </View>
        </View>
        <Image src={LOGO_URL} style={s.logo} />
      </View>
      <View style={s.content}>
        <View style={s.card}>
          <Text style={s.cardTitle}>VIDÉOS &amp; HIGHLIGHTS</Text>
          {videos.length === 0 ? (
            <Text style={s.radarNote}>Aucune vidéo ajoutée.</Text>
          ) : (
            videos.map((v) => (
              <View key={v.id} style={s.bookRow}>
                <Text style={s.bookLabel}>{v.titre}</Text>
                <Text style={s.bookValue}>{v.url}</Text>
              </View>
            ))
          )}
        </View>
        <View style={s.card}>
          <Text style={s.cardTitle}>DOCUMENTS</Text>
          {docs.length === 0 ? (
            <Text style={s.radarNote}>Aucun document ajouté.</Text>
          ) : (
            docs.map((d) => (
              <View key={d.id} style={s.bookRow}>
                <Text style={s.bookLabel}>{d.nom}</Text>
                <Text style={s.bookValue}>{d.type ?? "—"}</Text>
              </View>
            ))
          )}
        </View>
      </View>
      <Text style={s.footer}>
        PNM Sports — Document confidentiel — Usage interne uniquement · Édité le {formatDateFr(new Date())}
      </Text>
    </Page>
  );
}

export default function PlayerPdf({ player, stats = [], evaluation = null, book = false, videos = [], docs = [] }) {
  const age = calcAge(player.date_naissance);
  const careerLine = [player.club_actuel, player.poste].filter(Boolean).join("  ·  ") || "—";
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* En-tête : silhouette + nom + logo */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Silhouette />
            <View>
              <Text style={s.name}>{player.prenom} {player.nom}</Text>
              <Text style={s.sub}>{careerLine}</Text>
            </View>
          </View>
          <Image src={LOGO_URL} style={s.logo} />
        </View>

        <View style={s.content}>
          {/* Identité */}
          <View style={s.card}>
            <Text style={s.cardTitle}>IDENTITÉ</Text>
            <View style={s.fieldsRow}>
              <Field label="Naissance" value={formatDateFr(player.date_naissance)} />
              <Field label="Âge" value={age ? `${age} ans` : null} />
              <Field label="Nationalité" value={player.nationalite} />
              <Field label="Pied" value={player.pied_fort} />
              <Field label="Taille" value={player.taille_cm ? `${player.taille_cm} cm` : null} />
              <Field label="Poids" value={player.poids_kg ? `${player.poids_kg} kg` : null} />
            </View>
          </View>

          {/* Carrière */}
          <View style={s.card}>
            <Text style={s.cardTitle}>CARRIÈRE</Text>
            <View style={s.fieldsRow}>
              <Field label="Club actuel" value={player.club_actuel} />
              <Field label="Club précédent" value={player.club_precedent} />
              <Field label="Fin de contrat" value={formatDateFr(player.fin_contrat)} />
              <Field label="Valeur estimée" value={formatMoney(player.valeur_estimee_eur)} />
            </View>
          </View>

          {/* Coordonnées */}
          <View style={s.card}>
            <Text style={s.cardTitle}>COORDONNÉES</Text>
            <View style={s.fieldsRow}>
              <Field label="Téléphone" value={player.telephone} />
              <Field label="Email" value={player.email} />
              <Field label="Agent référent" value={player.agent ? `${player.agent.prenom} ${player.agent.nom}` : null} />
            </View>
          </View>

          {/* Stats : radar (placeholder) + tableau saisons */}
          <View style={s.statsHead}>
            <Text style={s.statsTitle}>STATS</Text>
            <View style={s.rule} />
          </View>

          <RadarPlaceholder evaluation={evaluation} />

          {stats.length > 0 ? (
            <View style={s.table}>
              <View style={s.tHead}>
                <Text style={s.tColH}>Saison</Text>
                <Text style={s.tColH}>Matchs</Text>
                <Text style={s.tColH}>Buts</Text>
                <Text style={s.tColH}>Passes</Text>
                <Text style={s.tColH}>Minutes</Text>
              </View>
              {stats.map((st) => (
                <View key={st.id} style={s.tRow}>
                  <Text style={s.tCol}>{st.saison}</Text>
                  <Text style={s.tCol}>{st.matchs}</Text>
                  <Text style={s.tCol}>{st.buts}</Text>
                  <Text style={s.tCol}>{st.passes}</Text>
                  <Text style={s.tCol}>{st.minutes_jouees}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={s.radarNote}>Aucune statistique saisie.</Text>
          )}

          {player.notes && (
            <Text style={s.notes}>{player.notes}</Text>
          )}
        </View>

        <Text style={s.footer}>
          PNM Sports — Document confidentiel — Usage interne uniquement · Édité le {formatDateFr(new Date())}
        </Text>
      </Page>
      {book && <BookPage player={player} videos={videos} docs={docs} />}
    </Document>
  );
}
