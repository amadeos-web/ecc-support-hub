import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { AttestationModel, QuoteModel } from '../models';
import type { IssuerProfile } from '../core/issuer';
import { issuerValue } from '../core/issuer';
import { addDays, formatDate, formatMoney, lineTotalHT, totalsFromLines } from '../../lib/documentCalc';
import { attestationTemplate as A, quoteTemplate as Q } from '../../data/otherDocsTemplate';
import { attestationParagraphs } from '../otherDocs';
import { EccBands, EccFooter, EccGrandTotal, EccHeader, EccParties, EccSummary, EccTable, Rule, brandName, footerText, issuerLines, resolveLogo } from './blocks';
import { pdfStyles as s, LAYOUT } from './theme';

/** Les espaces insécables de l'Intl ne sont pas dans les polices embarquées. */
const money = (v: number, cur: string) => formatMoney(v, cur).replace(/[\u202f\u00a0]/g, ' ');

/** Devis : même modèle visuel que la facture (en-tête, parties, tableau, totaux, logo ECC). */
export function QuotePdf({ m, issuer }: { m: QuoteModel; issuer: IssuerProfile }) {
  const totals = totalsFromLines(m.lignes);
  const lines = m.lignes.filter((l) => l.label.trim());
  const validUntil = m.dateDevis ? formatDate(addDays(m.dateDevis, m.validiteJours || 0)) : '';
  const recipient = [m.societe, `${m.prenom} ${m.nom}`, m.adresse, m.pays, m.email, m.numeroTva.trim() && `TVA : ${m.numeroTva.trim()}`].map((l) => (l || '').trim()).filter(Boolean);
  const rows = lines.map((l) => ({
    description: l.quantity === 1 ? l.label : `${l.label} (× ${l.quantity})`,
    price: money(l.unitPriceHT, m.devise),
    amount: money(lineTotalHT(l), m.devise),
  }));
  const summary = [
    { label: Q.totalHT, value: money(totals.ht, m.devise) },
    ...totals.byRate.map((r) => ({ label: `TVA ${r.rate} %`, value: money(r.tva, m.devise) })),
  ];
  const mention = [validUntil && `${Q.validUntil} ${validUntil}`, m.notes.trim()].filter(Boolean).join('\n');
  return (
    <Document title={`Devis ${m.numeroDevis}`} author={brandName(issuer)} creator="ECC Support Hub" producer="ECC Support Hub" language="fr-FR">
      <Page size="A4" style={s.page}>
        <EccBands />
        <EccHeader title={m.numeroDevis.trim() ? `${Q.title} #${m.numeroDevis.trim()}` : Q.title} logo={resolveLogo(issuer.logoDataUrl)} />
        <Rule />
        <EccParties
          recipient={{ label: Q.recipientLabel, lines: recipient }}
          issuer={{ label: Q.issuerLabel, lines: issuerLines(issuer) }}
          aside={m.dateDevis ? <Text style={s.issuedOn}>{`${Q.dateLabel} ${formatDate(m.dateDevis)}`}</Text> : <Text style={s.issuedOn}> </Text>}
        />
        <Rule />
        <EccTable columns={Q.columns} rows={rows} />
        <EccSummary rows={summary} after={<EccGrandTotal text={`${Q.grandTotal} : ${money(totals.ttc, m.devise)}`} mention={mention || undefined} />} />
        <Text style={{ fontSize: 10.5, letterSpacing: 0.3, marginTop: 36, paddingLeft: LAYOUT.inset }}>{Q.signature}</Text>
        <EccFooter text={footerText(issuer)} />
      </Page>
    </Document>
  );
}

/** Attestation de suivi : même identité visuelle, texte repris de l'aperçu. */
export function AttestationPdf({ m, issuer }: { m: AttestationModel; issuer: IssuerProfile }) {
  const t = attestationParagraphs(m, issuerValue(issuer, 'name') || brandName(issuer));
  const para = { fontSize: 12.5, letterSpacing: 0.35, marginBottom: 18, paddingLeft: LAYOUT.inset } as const;
  return (
    <Document title={`Attestation ${m.prenom} ${m.nom}`} author={brandName(issuer)} creator="ECC Support Hub" producer="ECC Support Hub" language="fr-FR">
      <Page size="A4" style={s.page}>
        <EccBands />
        <EccHeader title={A.title} logo={resolveLogo(issuer.logoDataUrl)} />
        <Rule />
        <View style={{ paddingLeft: LAYOUT.inset, paddingTop: 22, paddingBottom: 18 }}>
          <Text style={s.label}>{A.heading.toUpperCase()}</Text>
        </View>
        <Text style={para}>{t.intro}</Text>
        <View style={{ marginBottom: 6 }}>
          {t.details.map((d) => (
            <Text key={d} style={{ ...para, marginBottom: 6 }}>
              {d}
            </Text>
          ))}
        </View>
        <Text style={{ ...para, marginTop: 14 }}>{t.closing}</Text>
        <Text style={{ ...para, marginTop: 28 }}>{t.madeOn}</Text>
        <EccFooter text={footerText(issuer)} />
      </Page>
    </Document>
  );
}
