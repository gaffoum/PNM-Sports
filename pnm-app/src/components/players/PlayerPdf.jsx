import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { calcAge, formatDateFr, formatMoney } from "../../lib/utils";

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#0a2540", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1ab8e0", paddingBottom: 8, marginBottom: 16 },
  brand: { fontSize: 18, fontWeight: 700, letterSpacing: 2, color: "#0f3b52" },
  sub: { fontSize: 7, letterSpacing: 3, color: "#1ab8e0" },
  hero: { flexDirection: "row", gap: 16, alignItems: "center", marginBottom: 20 },
  photo: { width: 80, height: 80, borderRadius: 40, border: "1px solid #ccc" },
  name: { fontSize: 22, fontWeight: 700 },
  meta: { fontSize: 9, color: "#557388", marginTop: 2 },
  badge: { fontSize: 8, padding: "2 6", borderRadius: 8, marginTop: 4, alignSelf: "flex-start" },
  badgeJoueur: { backgroundColor: "#1ab8e022", color: "#0e8cb0" },
  badgeProspect: { backgroundColor: "#f59e0b22", color: "#b45309" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: "#1ab8e0", marginBottom: 6, textTransform: "uppercase" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "50%", marginBottom: 4 },
  cellLabel: { fontSize: 7, color: "#557388", textTransform: "uppercase", letterSpacing: 1 },
  cellValue: { fontSize: 10 },
  statsTable: { borderTop: "1px solid #e5e7eb" },
  statsRow: { flexDirection: "row", borderBottom: "1px solid #e5e7eb", padding: "4 0" },
  statsCol: { flex: 1, fontSize: 9 },
  statsHead: { fontSize: 8, color: "#557388", textTransform: "uppercase" },
  notes: { fontSize: 9, lineHeight: 1.4, color: "#0a2540" },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, textAlign: "center", fontSize: 7, color: "#8aa9bd", borderTop: "1px solid #e5e7eb", paddingTop: 4 },
});

function Cell({ label, value }) {
  return (
    <View style={s.cell}>
      <Text style={s.cellLabel}>{label}</Text>
      <Text style={s.cellValue}>{value ?? "—"}</Text>
    </View>
  );
}

export default function PlayerPdf({ player, stats = [] }) {
  const age = calcAge(player.date_naissance);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>PNM SPORTS</Text>
            <Text style={s.sub}>FICHE JOUEUR</Text>
          </View>
          <Text style={s.meta}>Édité le {formatDateFr(new Date())}</Text>
        </View>
        <View style={s.hero}>
          {player.photo_url ? <Image src={player.photo_url} style={s.photo} /> : <View style={s.photo} />}
          <View>
            <Text style={s.name}>{player.prenom} {player.nom}</Text>
            <Text style={s.meta}>{player.poste ?? "—"} · {player.nationalite ?? "—"} · {age ?? "—"} ans</Text>
            <Text style={[s.badge, player.statut === "joueur" ? s.badgeJoueur : s.badgeProspect]}>
              {player.statut === "joueur" ? "Joueur signé" : "Prospect"}
            </Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Identité &amp; profil</Text>
          <View style={s.grid}>
            <Cell label="Date de naissance" value={formatDateFr(player.date_naissance)} />
            <Cell label="Nationalité" value={player.nationalite} />
            <Cell label="Poste" value={player.poste} />
            <Cell label="Pied fort" value={player.pied_fort} />
            <Cell label="Taille" value={player.taille_cm ? `${player.taille_cm} cm` : null} />
            <Cell label="Poids" value={player.poids_kg ? `${player.poids_kg} kg` : null} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Carrière</Text>
          <View style={s.grid}>
            <Cell label="Club actuel" value={player.club_actuel} />
            <Cell label="Club précédent" value={player.club_precedent} />
            <Cell label="Fin de contrat" value={formatDateFr(player.fin_contrat)} />
            <Cell label="Valeur estimée" value={formatMoney(player.valeur_estimee_eur)} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Coordonnées</Text>
          <View style={s.grid}>
            <Cell label="Téléphone" value={player.telephone} />
            <Cell label="Email" value={player.email} />
            <Cell label="Agent référent" value={player.agent ? `${player.agent.prenom} ${player.agent.nom}` : null} />
          </View>
        </View>

        {stats.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Statistiques</Text>
            <View style={s.statsTable}>
              <View style={s.statsRow}>
                <Text style={[s.statsCol, s.statsHead]}>Saison</Text>
                <Text style={[s.statsCol, s.statsHead]}>Matchs</Text>
                <Text style={[s.statsCol, s.statsHead]}>Buts</Text>
                <Text style={[s.statsCol, s.statsHead]}>Passes</Text>
                <Text style={[s.statsCol, s.statsHead]}>Minutes</Text>
              </View>
              {stats.map((st) => (
                <View key={st.id} style={s.statsRow}>
                  <Text style={s.statsCol}>{st.saison}</Text>
                  <Text style={s.statsCol}>{st.matchs}</Text>
                  <Text style={s.statsCol}>{st.buts}</Text>
                  <Text style={s.statsCol}>{st.passes}</Text>
                  <Text style={s.statsCol}>{st.minutes_jouees}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {player.notes && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Notes</Text>
            <Text style={s.notes}>{player.notes}</Text>
          </View>
        )}

        <Text style={s.footer}>PNM Sports — Document confidentiel — Usage interne uniquement</Text>
      </Page>
    </Document>
  );
}
