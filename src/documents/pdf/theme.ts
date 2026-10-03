import { StyleSheet } from '@react-pdf/renderer';
import { invoiceBrand as B } from '../../data/invoiceBrand';
import { PDF_FALLBACK } from './fonts';

/**
 * Feuille de style du modèle de document ECC, entièrement dérivée de invoiceBrand.
 * Dimensions calées sur le modèle historique (page A4 : 595 × 842 pt).
 * NB : aucun lineHeight (bug @react-pdf 4.9 : interligne démultiplié, pied de page masqué).
 */
const SERIF = [B.primaryFont, PDF_FALLBACK];
const SANS = [B.secondaryFont, PDF_FALLBACK];
const INK = B.documentAccent;

export const LAYOUT = {
  /** Marges du modèle : filets de 34 pt à 553 pt ; texte en retrait de 7 pt. */
  marginLeft: 34,
  marginRight: 42,
  inset: 7,
  bandTop: 30,
  bandBottom: 44,
  colPrice: 74,
  colAmount: 131,
  colSumValue: 92,
};

export const pdfStyles = StyleSheet.create({
  page: { fontFamily: SANS, fontSize: 11, color: INK, paddingTop: 41, paddingBottom: 72, paddingLeft: LAYOUT.marginLeft, paddingRight: LAYOUT.marginRight },

  /* Bandeaux de marque (haut / bas) */
  bandTop: { position: 'absolute', top: 0, left: 0, right: 0, height: LAYOUT.bandTop, backgroundColor: B.band.color },
  bandBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: LAYOUT.bandBottom, backgroundColor: B.band.color },
  bandTexture: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, objectFit: 'cover' },
  footerContent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: LAYOUT.bandBottom, flexDirection: 'row', alignItems: 'flex-start', paddingTop: 12, paddingLeft: LAYOUT.marginLeft + LAYOUT.inset, paddingRight: LAYOUT.marginRight },
  footerText: { flex: 1, fontSize: 10, letterSpacing: 0.55, color: INK },
  pageNum: { fontSize: 7.5, color: B.mutedColor },

  /* En-tête */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 50, paddingLeft: LAYOUT.inset, marginBottom: 20.5 },
  title: { fontFamily: SERIF, fontWeight: 400, fontSize: 22.2, letterSpacing: B.titleTracking, color: INK },
  logo: { maxHeight: B.logo.maxHeight, maxWidth: B.logo.maxWidth, objectFit: 'contain' },
  logoPlaceholder: { width: B.logo.maxWidth, height: B.logo.maxHeight, borderWidth: 0.6, borderColor: '#D2D2D2', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  logoPlaceholderText: { fontFamily: SANS, fontSize: 7, letterSpacing: 2.4, color: '#B0B0B0' },
  rule: { height: B.dividerStyle.width, backgroundColor: B.dividerStyle.color },

  /* Coordonnées */
  parties: { flexDirection: 'row', paddingLeft: LAYOUT.inset, paddingTop: 5, paddingBottom: 26 },
  partyRecipient: { width: 213, paddingRight: 12 },
  partyIssuer: { flex: 1, paddingRight: 10 },
  partyDate: { width: 124, alignItems: 'flex-end' },
  label: { fontFamily: SERIF, fontWeight: 500, fontSize: 11.8, letterSpacing: B.labelTracking, color: INK, marginBottom: 5 },
  partyLine: { fontSize: 11, letterSpacing: 0.4, marginBottom: 2.2 },
  issuedOn: { fontSize: 11, letterSpacing: 0.4, marginTop: 2 },

  /* Tableau */
  tableHead: { flexDirection: 'row', alignItems: 'center', paddingLeft: LAYOUT.inset, paddingRight: 4, marginTop: 14, marginBottom: 29 },
  th: { fontFamily: SERIF, fontWeight: 400, fontSize: 10.5, letterSpacing: 2.3, color: INK },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 61, paddingLeft: LAYOUT.inset, paddingRight: 4, paddingVertical: 12 },
  banded: { backgroundColor: B.rowBand },
  colDesc: { flex: 1, paddingRight: 4 },
  colPrice: { width: LAYOUT.colPrice, textAlign: 'center' },
  colAmount: { width: LAYOUT.colAmount, textAlign: 'right', paddingRight: 6 },
  thAmount: { paddingRight: 0 },
  cell: { fontSize: 12, letterSpacing: 0.3, color: INK },
  cellPrice: {},

  /* Récapitulatif */
  sumRow: { flexDirection: 'row', alignItems: 'center', minHeight: 68, paddingLeft: LAYOUT.inset, paddingRight: 4 },
  sumRowCompact: { minHeight: 42 },
  sumLabel: { width: 140, textAlign: 'right', color: B.mutedColor, fontSize: 12.5, letterSpacing: 0.4 },
  sumValue: { width: LAYOUT.colSumValue, textAlign: 'right', paddingRight: 6, fontSize: 12, letterSpacing: 0.3 },

  /* Total perçu : élément fort du document */
  grandTotalWrap: { alignItems: 'flex-end', marginTop: 0, paddingRight: 8 },
  grandTotalRule: { width: 250, height: B.dividerStyle.width, backgroundColor: B.dividerStyle.color, marginBottom: 14 },
  grandTotal: { fontFamily: SERIF, fontWeight: 400, fontSize: B.grandTotal.size, letterSpacing: B.grandTotal.tracking, color: INK, textAlign: 'right' },
  mention: { fontSize: 8.5, color: '#7A7A7A', textAlign: 'right', marginTop: 12 },
});
