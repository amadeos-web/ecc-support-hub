/** Devis simplifié : ce que l'agent saisit, et la validation (première erreur affichée sous le champ). */
import { parseAmount, parseRate } from '../core/money';
import { computeTotals, type Totals } from '../core/totals';
import { emptyVat, type VatState } from '../../components/VatOption';
import { isValidISODate, todayISO } from '../core/dates';
import { quoteTemplate as Q } from '../../data/quoteTemplate';

export interface BankDetails {
  holder: string;
  iban: string;
  bic: string;
  bank: string;
}

export interface SimpleQuote extends VatState {
  issueDate: string;
  /** Bloc destinataire tel qu'imprimé : nom en première ligne, puis le reste (né le, adresse, email…). */
  recipient: string;
  /** Bloc organisme financeur : nom en première ligne, puis l'adresse. */
  funder: string;
  issuer: string;
  description: string;
  amount: string;
  bank: BankDetails;
}

export const emptyQuote = (): SimpleQuote => ({
  issueDate: todayISO(),
  recipient: '',
  funder: '',
  issuer: Q.defaultIssuer,
  description: Q.defaultDescription,
  amount: '',
  bank: { ...Q.defaultBank },
  ...emptyVat(),
});

export const blockLines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

export type QuoteField = 'issueDate' | 'recipient' | 'funder' | 'issuer' | 'description' | 'amount' | 'vatRate';

export const QUOTE_FIELD_ORDER: QuoteField[] = ['issueDate', 'recipient', 'funder', 'issuer', 'description', 'amount', 'vatRate'];

export function quoteErrors(q: SimpleQuote): Partial<Record<QuoteField, string>> {
  const e: Partial<Record<QuoteField, string>> = {};
  if (!isValidISODate(q.issueDate)) e.issueDate = 'Enter the date.';
  if (!blockLines(q.recipient).length) e.recipient = 'Enter the recipient (name, then details).';
  if (!blockLines(q.funder).length) e.funder = 'Enter the funding body (name, then address).';
  if (!blockLines(q.issuer).length) e.issuer = 'Enter the issuer.';
  if (!q.description.trim()) e.description = 'Enter the description.';
  const a = parseAmount(q.amount);
  if (!a.ok) e.amount = a.error;
  else if (a.value <= 0n) e.amount = 'Enter the amount.';
  if (q.vatOn) {
    const r = parseRate(q.vatRate);
    if (!r.ok) e.vatRate = r.error;
  }
  return e;
}

/** Montant en centimes (0 si invalide) : sert à l'aperçu en direct. */
export const quoteAmountCents = (q: SimpleQuote): bigint => {
  const a = parseAmount(q.amount);
  return a.ok ? a.value : 0n;
};

/** Totaux du devis (une ligne) : TVA 0 % sans l'option, sinon taux et mode TTC / HT choisis. */
export function quoteTotals(q: SimpleQuote): Totals {
  const r = q.vatOn ? parseRate(q.vatRate) : null;
  const rateBp = r && r.ok ? r.value : 0;
  return computeTotals([{ description: q.description, quantityMilli: 1000n, unitPriceCents: quoteAmountCents(q), rateBp }], q.vatOn ? q.vatMode : 'TTC');
}
