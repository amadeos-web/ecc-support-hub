import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { blockLines, quoteTotals, type SimpleQuote } from '../quote/model';
import { formatMoneyCompact, formatRateNumber } from '../core/money';
import { formatDateFR } from '../core/dates';
import { quoteTemplate as Q } from '../../data/quoteTemplate';
import { EccBands, EccGrandTotal, Rule, resolveLogo } from './blocks';
import { pdfStyles as s, LAYOUT } from './theme';

/**
 * Devis « prise en charge » (modèle ECC fourni) : même identité visuelle que la facture —
 * bandeaux, titre serif espacé, logo, filets, tableau, total fort — avec organisme financeur,
 * mention de prise en charge et coordonnées bancaires.
 */
export function QuotePdf({ q }: { q: SimpleQuote }) {
  const t = quoteTotals(q);
  const money = (c: bigint) => formatMoneyCompact(c, 'EUR');
  const hasVat = t.totalTVA > 0n;
  const ht = money(t.totalHT);
  const amount = money(t.totalTTC);
  const recipient = blockLines(q.recipient);
  const funder = blockLines(q.funder);
  const issuerL = blockLines(q.issuer);
  const fill = (t: string, map: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? '');
  const muted = { color: '#8A8A8A' } as const;
  const box = { backgroundColor: '#F4F4F4', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 11 } as const;
  return (
    <Document title={`Devis ${recipient[0] ?? ''}`} author={Q.footerLeft} creator="ECC Support Hub" producer="ECC Support Hub" language="fr-FR">
      <Page size="A4" style={s.page}>
        <EccBands />
        <View style={[s.header, { marginBottom: 14 }]}>
          <View>
            <Text style={s.title}>{Q.title}</Text>
            <Text style={{ fontFamily: s.title.fontFamily, fontSize: 9.5, letterSpacing: 2.6, marginTop: 8 }}>{Q.subtitle}</Text>
          </View>
          {resolveLogo() ? <Image src={resolveLogo()!} style={s.logo} /> : <View />}
        </View>
        <Rule />
        <View style={[s.parties, { paddingBottom: 16 }]}>
          <View style={[s.partyRecipient, { width: 182 }]}>
            <Text style={s.label}>{Q.recipientLabel}</Text>
            {recipient.map((l, k) => (
              <Text key={k} style={s.partyLine}>{l}</Text>
            ))}
          </View>
          <View style={s.partyIssuer}>
            <Text style={s.label}>{Q.funderLabel}</Text>
            {funder.map((l, k) => (
              <Text key={k} style={s.partyLine}>{l}</Text>
            ))}
          </View>
          <View style={[s.partyDate, { width: 112 }]}>
            <Text style={s.issuedOn}>{`${Q.issuedOnLabel} ${formatDateFR(q.issueDate) || '—'}`}</Text>
          </View>
        </View>
        <Rule />
        <View style={{ flexDirection: 'row', paddingLeft: LAYOUT.inset, paddingVertical: 12 }}>
          <Text style={[s.label, muted, { fontSize: 10, width: 86, marginBottom: 0 }]}>{Q.issuerLabel}</Text>
          <View style={{ flex: 1 }}>
            {issuerL.map((l, k) => (
              <Text key={k} style={[s.partyLine, { fontSize: 10 }]}>{l}</Text>
            ))}
          </View>
        </View>
        <Rule />
        <View style={[s.tableHead, { marginTop: 12, marginBottom: 12 }]}>
          <Text style={[s.th, s.colDesc]}>{Q.columns.description}</Text>
          <Text style={[s.th, s.colPrice]}>{Q.columns.price}</Text>
          <Text style={[s.th, s.colAmount, s.thAmount]}>{Q.columns.amount}</Text>
        </View>
        <View style={[s.row, s.banded, { minHeight: 46 }]}>
          <Text style={[s.cell, s.colDesc]}>{q.description.trim()}</Text>
          <Text style={[s.cell, s.colPrice]}>{ht}</Text>
          <Text style={[s.cell, s.colAmount]}>{ht}</Text>
        </View>
        {(hasVat
          ? [
              [Q.totalHTLabel, ht],
              [Q.vatRateLabel, formatRateNumber(t.groups[0].rateBp)],
              [Q.vatAmountLabel, money(t.totalTVA)],
            ]
          : [[Q.totalLabel, amount]]
        ).map(([label, value], k) => (
          <View key={label} style={[s.sumRow, { minHeight: hasVat ? 30 : 40 }, ...(k === 1 ? [s.banded] : [])]}>
            <View style={{ flex: 1 }} />
            <Text style={s.sumLabel}>{label}</Text>
            <Text style={s.sumValue}>{value}</Text>
          </View>
        ))}
        <View style={[box, { marginTop: 4 }]} wrap={false}>
          <Text style={{ fontFamily: s.title.fontFamily, fontSize: 10.5, letterSpacing: 0.6, marginBottom: 4 }}>{Q.fundingTitle}</Text>
          <Text style={{ fontSize: 9.5, letterSpacing: 0.3 }}>{fill(Q.fundingText, { montant: amount, financeur: funder[0] ?? '—' })}</Text>
        </View>
        {!hasVat && <Text style={[{ fontSize: 8.5, marginTop: 10, paddingLeft: LAYOUT.inset }, muted]}>{Q.vatMention}</Text>}
        <View style={{ marginTop: 14 }} wrap={false}>
          <EccGrandTotal text={`${Q.grandTotalLabel} : ${amount}`} />
        </View>
        <View style={[box, { marginTop: 14 }]} wrap={false}>
          <Text style={{ fontFamily: s.title.fontFamily, fontSize: 9.5, letterSpacing: 1.4, marginBottom: 7 }}>{Q.bankTitle}</Text>
          {([
            [Q.bankLabels.holder, q.bank.holder],
            [Q.bankLabels.iban, q.bank.iban],
            [Q.bankLabels.bic, q.bank.bic],
            [Q.bankLabels.bank, q.bank.bank],
          ] as const).map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={[{ width: 92, fontSize: 8, letterSpacing: 1.2, paddingTop: 1 }, muted]}>{k}</Text>
              <Text style={{ flex: 1, fontSize: 9.5, letterSpacing: 0.3 }}>{v.trim()}</Text>
            </View>
          ))}
        </View>
        <View style={s.footerContent} fixed>
          <Text style={s.footerText}>{Q.footerLeft}</Text>
          <Text style={[{ fontSize: 8, letterSpacing: 0.4 }, muted]}>{fill(Q.footerRight, { beneficiaire: recipient[0] ?? '—' })}</Text>
        </View>
      </Page>
    </Document>
  );
}

