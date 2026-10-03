/**
 * Blocs du modèle de document ECC, réutilisables pour la facture et plus tard le devis /
 * l'attestation (titre, colonnes et libellés passés en paramètres).
 */
import { Image, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import { issuerValue, type IssuerProfile } from '../core/issuer';
import { invoiceBrand } from '../../data/invoiceBrand';
import { pdfStyles as s } from './theme';

const clean = (lines: (string | false | undefined | null)[]) => lines.map((l) => (l || '').trim()).filter(Boolean);

/** Logo : asset officiel (invoiceBrand) > logo importé dans le profil > cadre neutre « LOGO ». */
export function resolveLogo(profileLogo?: string): string | null {
  return invoiceBrand.logo.src || profileLogo || null;
}

export function EccHeader({ title, logo }: { title: string; logo: string | null }) {
  return (
    <View style={s.header}>
      <Text style={s.title}>{title}</Text>
      {logo ? (
        <Image src={logo} style={s.logo} />
      ) : invoiceBrand.logo.showPlaceholder ? (
        <View style={s.logoPlaceholder}>
          <Text style={s.logoPlaceholderText}>LOGO</Text>
        </View>
      ) : (
        <View />
      )}
    </View>
  );
}

/** Bandeaux haut et bas de page, aplat ou texture officielle (invoiceBrand.band). */
export function EccBands() {
  const tex = invoiceBrand.band.texture;
  return (
    <>
      {invoiceBrand.band.showTop && <View style={s.bandTop} fixed>{tex ? <Image src={tex} style={s.bandTexture} /> : null}</View>}
      <View style={s.bandBottom} fixed>
        {tex ? <Image src={tex} style={s.bandTexture} /> : null}
      </View>
    </>
  );
}

export function Rule() {
  return <View style={s.rule} />;
}

function PartyLines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <Text key={i} style={s.partyLine}>
          {l}
        </Text>
      ))}
    </>
  );
}

export function EccParties({ recipient, issuer, aside }: { recipient: { label: string; lines: string[] }; issuer: { label: string; lines: string[] }; aside: ReactNode }) {
  return (
    <View style={s.parties}>
      <View style={s.partyRecipient}>
        <Text style={s.label}>{recipient.label}</Text>
        <PartyLines lines={recipient.lines} />
      </View>
      <View style={s.partyIssuer}>
        <Text style={s.label}>{issuer.label}</Text>
        <PartyLines lines={issuer.lines} />
      </View>
      <View style={s.partyDate}>{aside}</View>
    </View>
  );
}

/** Lignes du bloc EMETTEUR : uniquement les champs renseignés (placeholders et « non applicable » exclus). */
export function issuerLines(p: IssuerProfile): string[] {
  const v = (k: Parameters<typeof issuerValue>[1]) => issuerValue(p, k);
  return clean([
    v('name'),
    v('address'),
    [v('postalCode'), v('city')].filter(Boolean).join(' '),
    v('country'),
    v('companyNumber') && `N° d'entreprise : ${v('companyNumber')}`,
    v('vatNumber') && `N° TVA : ${v('vatNumber')}`,
    p.email.trim(),
  ]);
}

export interface TableRow {
  description: string;
  price: string;
  amount: string;
}

export function EccTable({ columns, rows }: { columns: { description: string; price: string; amount: string }; rows: TableRow[] }) {
  return (
    <View>
      <View style={s.tableHead} fixed>
        <Text style={[s.th, s.colDesc]}>{columns.description}</Text>
        <Text style={[s.th, s.colPrice]}>{columns.price}</Text>
        <Text style={[s.th, s.colAmount, s.thAmount]}>{columns.amount}</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={i % 2 === 0 ? [s.row, s.banded] : s.row} wrap={false}>
          <Text style={[s.cell, s.colDesc]}>{r.description}</Text>
          <Text style={[s.cell, s.colPrice, s.cellPrice]}>{r.price}</Text>
          <Text style={[s.cell, s.colAmount]}>{r.amount}</Text>
        </View>
      ))}
    </View>
  );
}

/** Récapitulatif ; `after` (total final) reste toujours sur la même page que la dernière rangée. */
export function EccSummary({ rows, after }: { rows: { label: string; value: string }[]; after?: ReactNode }) {
  // Au-delà de 3 rangées (plusieurs taux de TVA), rangées plus compactes.
  const compact = rows.length > 3;
  const row = (r: { label: string; value: string }, i: number) => (
    <View key={i} style={[s.sumRow, ...(compact ? [s.sumRowCompact] : []), ...(i % 2 === 1 ? [s.banded] : [])]} wrap={false}>
      <View style={{ flex: 1 }} />
      <Text style={s.sumLabel}>{r.label}</Text>
      <Text style={s.sumValue}>{r.value}</Text>
    </View>
  );
  return (
    <View>
      {rows.slice(0, -1).map(row)}
      <View wrap={false}>
        {rows.length > 0 && row(rows[rows.length - 1], rows.length - 1)}
        {after}
      </View>
    </View>
  );
}

export function EccFooter({ text }: { text: string }) {
  return (
    <View style={s.footerContent} fixed>
      <Text style={s.footerText}>{text}</Text>
      <Text style={s.pageNum} render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : ' ')} />
    </View>
  );
}

/** Nom de marque : invoiceBrand > profil émetteur > raison sociale. */
export const brandName = (p: IssuerProfile) => invoiceBrand.brandName.trim() || p.brandName.trim() || issuerValue(p, 'name');
export const footerText = (p: IssuerProfile) => invoiceBrand.footerText.trim() || brandName(p);

/** TOTAL MONTANT PERÇU, avec respiration et filet fin au-dessus. */
export function EccGrandTotal({ text, mention }: { text: string; mention?: string }) {
  return (
    <View style={s.grandTotalWrap}>
      {invoiceBrand.grandTotal.rule && <View style={s.grandTotalRule} />}
      <Text style={s.grandTotal}>{text}</Text>
      {mention ? <Text style={s.mention}>{mention}</Text> : null}
    </View>
  );
}
