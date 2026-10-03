import { Document, Page, Text } from '@react-pdf/renderer';
import type { InvoiceData } from '../invoice/model';
import { clientDisplayName } from '../invoice/model';
import { formatDateFR } from '../core/dates';
import { formatMoneyCompact, formatQuantity, formatRateNumber } from '../core/money';
import { invoiceTemplate as T } from '../../data/invoiceTemplate';
import { EccBands, EccFooter, EccGrandTotal, EccHeader, EccParties, EccSummary, EccTable, Rule, brandName, footerText, issuerLines, resolveLogo } from './blocks';
import { pdfStyles as s } from './theme';

/**
 * Facture au format du modèle ECC / BB. Le même composant sert à l'aperçu de
 * l'application et au fichier téléchargé : ce que l'on voit est ce que l'on obtient.
 */
export function InvoicePdf({ data }: { data: InvoiceData }) {
  const c = data.client;
  const t = data.totals;
  const cur = data.currency;
  const money = (v: bigint) => formatMoneyCompact(v, cur);
  const hasVat = t.groups.some((g) => g.rateBp > 0);

  const recipient = [
    c.company,
    clientDisplayName(c),
    c.address,
    [c.postalCode, c.city].map((x) => x.trim()).filter(Boolean).join(' '),
    c.country,
    c.companyNumber.trim() && `${c.companyIdLabel || 'Siret'} : ${c.companyNumber.trim()}`,
    c.vatNumber.trim() && `N TVA : ${c.vatNumber.trim()}`,
  ]
    .map((l) => (l || '').trim())
    .filter(Boolean);

  const rows = t.lines.map((l) => ({
    description: l.quantityMilli === 1000n ? l.description : `${l.description} (× ${formatQuantity(l.quantityMilli)})`,
    price: money(l.unitHT),
    amount: money(l.totalHT),
  }));

  const groups = t.groups.length ? t.groups : [{ rateBp: 0, baseHT: 0n, tva: 0n, ttc: 0n }];
  const summary = [
    { label: hasVat ? T.summary.totalWithVat : T.summary.total, value: money(t.totalHT) },
    ...groups.flatMap((g) => [
      { label: T.summary.vatRate, value: formatRateNumber(g.rateBp) },
      { label: T.summary.vatAmount, value: g.tva === 0n ? '0' : money(g.tva) },
    ]),
  ];

  return (
    <Document title={`Facture ${data.number}`} author={brandName(data.issuer)} creator="ECC Support Hub" producer="ECC Support Hub" language="fr-FR">
      <Page size="A4" style={s.page}>
        <EccBands />
        <EccHeader title={`${T.title} #${data.number || '—'}`} logo={resolveLogo(data.issuer.logoDataUrl)} />
        <Rule />
        <EccParties
          recipient={{ label: T.recipientLabel, lines: recipient }}
          issuer={{ label: T.issuerLabel, lines: issuerLines(data.issuer) }}
          aside={<Text style={s.issuedOn}>{`${T.issuedOnLabel} ${formatDateFR(data.issueDate) || '—'}`}</Text>}
        />
        <Rule />
        <EccTable columns={T.columns} rows={rows} />
        <EccSummary
          rows={summary}
          after={<EccGrandTotal text={`${T.grandTotalLabel} : ${money(t.totalTTC)}`} mention={data.vatMention || undefined} />}
        />
        <EccFooter text={footerText(data.issuer)} />
      </Page>
    </Document>
  );
}
