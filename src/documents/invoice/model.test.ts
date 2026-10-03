import { describe, expect, it } from 'vitest';
import { buildInvoice, emptyClient, emptyInvoiceForm, exampleInvoiceForm, type InvoiceForm } from './model';
import { defaultIssuerProfile } from '../../data/issuerProfile';
import { testIssuer } from './testFixtures';


const ready = (f: Partial<InvoiceForm> = {}): InvoiceForm => ({ ...exampleInvoiceForm(), number: 'ECC0174', paymentConfirmed: true, ...f });

describe('facture : champs obligatoires et règles', () => {
  it('formulaire vide : erreurs claires, pas de PDF possible', () => {
    const r = buildInvoice(emptyInvoiceForm(), testIssuer);
    expect(r.isValid).toBe(false);
    expect(r.errors).toMatchObject({
      'client.identity': 'Client : société ou prénom + nom requis',
      'client.address': 'Adresse du client requise',
      number: 'Numéro de facture requis',
      'lines.0.unitPrice': 'Montant requis',
      'lines.0.vatRate': 'Taux de TVA à choisir',
      paymentConfirmed: 'Confirme que le règlement intégral du client a bien été reçu',
    });
  });
  it('description par défaut pré-remplie, taux de TVA jamais pré-rempli', () => {
    const l = emptyInvoiceForm().lines[0];
    expect(l.description).toBe('Formation d’accompagnement Ecommerce Capital Club');
    expect(l.vatRate).toBe('');
  });
  it('génération impossible sans la confirmation du règlement intégral', () => {
    expect(buildInvoice(ready({ paymentConfirmed: false }), testIssuer).isValid).toBe(false);
    expect(buildInvoice(ready(), testIssuer).isValid).toBe(true);
  });
  it('client société seule (SAS MAAS) accepté', () => {
    const client = { ...emptyClient(), company: 'SAS MAAS', address: '145 rue Jeanne Maillotte', postalCode: '59110', city: 'La Madeleine', country: 'France' };
    expect(buildInvoice(ready({ client }), testIssuer).errors).toEqual({});
  });
  it('émetteur par défaut : Business Brothers LIMITED, sans aucune autre mention inventée', () => {
    const r = buildInvoice(ready(), defaultIssuerProfile);
    expect(r.errors).toEqual({});
    expect(defaultIssuerProfile.name).toBe('Business Brothers LIMITED');
    expect(defaultIssuerProfile.address).toBe('2301, 23/F BAYFIELD BLDG 99\nHENNESSY RD WAN CHAI\nHONG KONG');
    expect([defaultIssuerProfile.companyNumber, defaultIssuerProfile.vatNumber, defaultIssuerProfile.email, defaultIssuerProfile.postalCode]).toEqual(['', '', '', '']);
  });
  it('émetteur : raison sociale, adresse ou valeur entre crochets bloquent la génération', () => {
    expect(buildInvoice(ready(), { ...testIssuer, name: '' }).errors['issuer.name']).toMatch(/manquant/);
    expect(buildInvoice(ready(), { ...testIssuer, address: '' }).errors['issuer.address']).toMatch(/manquant/);
    expect(buildInvoice(ready(), { ...testIssuer, name: '[Raison sociale]' }).errors['issuer.name']).toMatch(/personnaliser/);
  });
  it('émetteur : les mentions facultatives vides n’empêchent pas la génération', () => {
    expect(buildInvoice(ready(), { ...testIssuer, vatNumber: '', companyNumber: '' }).errors).toEqual({});
  });
  it('émetteur : « non applicable » explicite accepté (ex. société sans code postal ni TVA)', () => {
    const hk = { ...testIssuer, postalCode: '', vatNumber: '', notApplicable: { postalCode: true, vatNumber: true } };
    expect(buildInvoice(ready(), hk).errors).toEqual({});
  });
  it('TVA 0 % et 21 % sur 1 997 € TTC', () => {
    const at = (rate: string) => buildInvoice(ready({ lines: [{ ...exampleInvoiceForm().lines[0], vatRate: rate }] }), testIssuer).draft.totals;
    expect(at('0')).toMatchObject({ totalHT: 199700n, totalTVA: 0n, totalTTC: 199700n });
    expect(at('21')).toMatchObject({ totalHT: 165041n, totalTVA: 34659n, totalTTC: 199700n });
  });
  it('les lignes valides sont calculées en direct même si la facture est incomplète', () => {
    const f = emptyInvoiceForm();
    f.lines = [{ ...f.lines[0], unitPrice: '100', vatRate: '21' }];
    const r = buildInvoice({ ...f, priceMode: 'HT' }, testIssuer);
    expect(r.isValid).toBe(false);
    expect(r.draft.totals.totalTTC).toBe(12100n);
  });
});
