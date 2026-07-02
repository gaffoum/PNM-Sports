import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { formatDateFr } from "../../lib/utils";

const LOGO_URL = (import.meta.env.BASE_URL || "/") + "logo-pnm.png";

// Style sobre "papier" (noir sur blanc) — un document légal se lit et
// s'imprime différemment d'une fiche joueur marketing.
const s = StyleSheet.create({
  page: { backgroundColor: "#ffffff", color: "#111827", fontFamily: "Helvetica", fontSize: 10.5, padding: 44, lineHeight: 1.5 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24, borderBottom: "1px solid #d1d5db", paddingBottom: 12 },
  logo: { width: 34, height: 34, objectFit: "contain" },
  headTitle: { fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 9, color: "#6b7280", marginBottom: 20 },
  paraTitle: { fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 4, textTransform: "uppercase" },
  paraText: { fontSize: 10.5, color: "#1f2937", textAlign: "justify" },
  footer: { position: "absolute", bottom: 24, left: 44, right: 44, textAlign: "center", fontSize: 8, color: "#9ca3af", borderTop: "1px solid #e5e7eb", paddingTop: 6 },
});

export default function GeneratedDocumentPdf({ titre, paragraphes = [] }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.headTitle}>PNM Sports</Text>
          <Image src={LOGO_URL} style={s.logo} />
        </View>
        <Text style={s.title}>{titre}</Text>
        <Text style={s.meta}>Édité le {formatDateFr(new Date())}</Text>
        {paragraphes.map((p, i) => (
          <View key={i} wrap>
            <Text style={s.paraTitle}>{p.titre}</Text>
            <Text style={s.paraText}>{p.contenu}</Text>
          </View>
        ))}
        <Text style={s.footer} fixed>
          PNM Sports — Document confidentiel · Édité le {formatDateFr(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
