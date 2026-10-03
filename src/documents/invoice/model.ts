/** Données du formulaire facture (valeurs saisies, en texte) et conversion en facture calculée. */
import { parseAmount, parseQuantity, parseRate } from '../core/money';
import { computeTotals, type LineInput, type PriceMode, type Totals } from '../core/totals';
import { isValidISODate, todayISO } from '../core/dates';
import { isValidEmail, requireText, type FieldErrors } from '../core/validation';
import { validateInvoiceNumber } from '../core/numbering';
import { issuerErrors, type IssuerProfile } from '../core/issuer';
import { invoiceTemplate } from '../../data/invoiceTemplate';

export const INVOICE_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD'] as const;
export type InvoiceCurrency = (typeof INVOICE_CURRENCIES)[number];

/** Libellé imprimé devant l'identifiant d'entreprise du client — choisi par l'utilisateur. */
export const COMPANY_ID_LABELS = ['Siret', "N° d'entreprise", 'BCE', 'Registre'] as const;

export interface ClientForm {
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  companyIdLabel: string;
  companyNumber: string;
  vatNumber: string;
  email: string;
}

export interface LineForm {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
}

export interface InvoiceForm {
  client: ClientForm;
  number: string;
  /** Date d'émission = date d'envoi au client (« Délivré le »), pas la date d'achat. */
  issueDate: string;
  currency: InvoiceCurrency;
  /** Mention libre imprimée sous les totaux (ex. mention TVA exigée par la comptabilité). */
  vatMention: string;
  /** Jamais imprimée ni enregistrée. */
  internalNote: string;
  priceMode: PriceMode;
  lines: LineForm[];
  /** Case « règlement intégral reçu » : obligatoire pour générer le PDF. */
  paymentConfirmed: boolean;
}

let seq = 0;
export const newLine = (description: string = invoiceTemplate.defaultDescription): LineForm => ({
  id: `ligne-${++seq}`,
  description,
  quantity: '1',
  unitPrice: '',
  vatRate: '',
});

export const emptyClient = (): ClientForm => ({
  firstName: '',
  lastName: '',
  company: '',
  address: '',
  postalCode: '',
  city: '',
  country: '',
  companyIdLabel: 'Siret',
  companyNumber: '',
  vatNumber: '',
  email: '',
});

export const emptyInvoiceForm = (): InvoiceForm => ({
  client: emptyClient(),
  number: '',
  issueDate: todayISO(),
  currency: 'EUR',
  vatMention: '',
  internalNote: '',
  priceMode: 'TTC',
  lines: [newLine()],
  paymentConfirmed: false,
});

/** Exemple fictif (bouton « Remplir un exemple »). */
export const exampleInvoiceForm = (): InvoiceForm => ({
  ...emptyInvoiceForm(),
  client: { ...emptyClient(), firstName: 'Jean', lastName: 'Dupont', address: '12 rue de l’Exemple', postalCode: '1000', city: 'Bruxelles', country: 'Belgique' },
  lines: [{ ...newLine(), unitPrice: '1997', vatRate: '0' }],
});

export const clientDisplayName = (c: ClientForm) => [c.firstName, c.lastName].map((s) => s.trim()).filter(Boolean).join(' ');

/** Nom utilisé pour le fichier : société, sinon prénom + nom. */
export const clientFileName = (c: ClientForm) => c.company.trim() || clientDisplayName(c);

/** Facture prête à être rendue (aperçu / PDF). */
export interface InvoiceData {
  issuer: IssuerProfile;
  client: ClientForm;
  number: string;
  issueDate: string;
  currency: InvoiceCurrency;
  vatMention: string;
  priceMode: PriceMode;
  totals: Totals;
}

export interface BuildResult {
  /** Toujours disponible (aperçu brouillon), même incomplet. */
  draft: InvoiceData;
  errors: FieldErrors;
  isValid: boolean;
}

export function buildInvoice(form: InvoiceForm, issuer: IssuerProfile): BuildResult {
  const errors: FieldErrors = { ...issuerErrors(issuer) };

  const c = form.client;
  const hasPerson = c.firstName.trim() !== '' || c.lastName.trim() !== '';
  if (!c.company.trim() && !hasPerson) errors['client.identity'] = 'Client : société ou prénom + nom requis';
  if (hasPerson && !c.company.trim()) {
    requireText(errors, 'client.firstName', c.firstName, 'Prénom du client requis');
    requireText(errors, 'client.lastName', c.lastName, 'Nom du client requis');
  }
  requireText(errors, 'client.address', c.address, 'Adresse du client requise');
  requireText(errors, 'client.city', c.city, 'Ville du client requise');
  requireText(errors, 'client.country', c.country, 'Pays du client requis');
  if (c.email.trim() && !isValidEmail(c.email)) errors['client.email'] = 'Email du client invalide';

  const numErr = validateInvoiceNumber(form.number);
  if (numErr) errors.number = numErr;
  if (!isValidISODate(form.issueDate)) errors.issueDate = "Date d'émission requise";

  const inputs: LineInput[] = [];
  form.lines.forEach((l, i) => {
    const n = form.lines.length > 1 ? ` (ligne ${i + 1})` : '';
    requireText(errors, `lines.${i}.description`, l.description, `Description requise${n}`);
    const q = parseQuantity(l.quantity);
    const p = parseAmount(l.unitPrice);
    const r = parseRate(l.vatRate);
    if (!q.ok) errors[`lines.${i}.quantity`] = `${q.error}${n}`;
    if (!p.ok) errors[`lines.${i}.unitPrice`] = `${p.error}${n}`;
    if (!r.ok) errors[`lines.${i}.vatRate`] = `${r.error}${n}`;
    // Les lignes chiffrables alimentent le calcul en direct, même si le reste est incomplet.
    if (q.ok && p.ok && r.ok) inputs.push({ description: l.description.trim(), quantityMilli: q.value, unitPriceCents: p.value, rateBp: r.value });
  });
  if (form.lines.length === 0) errors.lines = 'Au moins une ligne est requise';

  if (!form.paymentConfirmed) errors.paymentConfirmed = 'Confirme que le règlement intégral du client a bien été reçu';

  const draft: InvoiceData = {
    issuer,
    client: c,
    number: form.number.trim(),
    issueDate: form.issueDate,
    currency: form.currency,
    vatMention: form.vatMention.trim(),
    priceMode: form.priceMode,
    totals: computeTotals(inputs, form.priceMode),
  };
  return { draft, errors, isValid: Object.keys(errors).length === 0 };
}
