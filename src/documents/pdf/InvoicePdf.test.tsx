import { describe, expect, it } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { renderToBuffer } from '@react-pdf/renderer';
import { registerPdfFonts } from './fonts';
import { InvoicePdf } from './InvoicePdf';
import { buildInvoice, emptyClient, exampleInvoiceForm, newLine, type InvoiceForm } from '../invoice/model';
import { testIssuer } from '../invoice/testFixtures';

const dir = path.resolve(__dirname, 'fonts');
registerPdfFonts({
  'EB Garamond': { 400: path.join(dir, 'EBGaramond_400Regular.ttf'), 500: path.join(dir, 'EBGaramond_500Medium.ttf') },
  'Didact Gothic': { 400: path.join(dir, 'DidactGothic_400Regular.ttf') },
  Inter: { 400: path.join(dir, 'Inter_400Regular.ttf') },
});

const maas = { ...emptyClient(), company: 'SAS MAAS', address: '145 rue Jeanne Maillotte', postalCode: '59110', city: 'La Madeleine', country: 'France', companyNumber: '00000000000000', vatNumber: 'FR00000000000' };

async function render(form: InvoiceForm, out?: string) {
  const { draft, isValid, errors } = buildInvoice(form, testIssuer);
  expect(errors).toEqual({});
  expect(isValid).toBe(true);
  const buf = await renderToBuffer(<InvoicePdf data={draft} />);
  expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
  const raw = buf.toString('latin1');
  expect(raw).toMatch(/\/MediaBox \[0 0 595\.2\d* 841\.8\d*\]/); // A4
  if (out && process.env.PDF_OUT_DIR) await fs.writeFile(path.join(process.env.PDF_OUT_DIR, out), buf);
  return { raw, pages: (raw.match(/\/Type \/Page\b/g) ?? []).length };
}

const base = (lines: InvoiceForm['lines'], client = maas): InvoiceForm => ({ ...exampleInvoiceForm(), client, number: 'ECC0174', paymentConfirmed: true, lines });

describe('génération PDF (modèle ECC)', () => {
  it('TVA 0 % — 1 997 €', async () => {
    const { pages } = await render(base([{ ...newLine(), unitPrice: '1997', vatRate: '0' }]), 'tva0.pdf');
    expect(pages).toBe(1);
  });
  it('TVA 21 % — 1 997 € TTC', async () => {
    await render(base([{ ...newLine(), unitPrice: '1 997', vatRate: '21' }]), 'tva21.pdf');
  });
  it('plusieurs lignes, adresse longue, accents, € et quantités', async () => {
    const client = { ...maas, address: 'Résidence « Les Hauts de Flandre », bâtiment C, escalier 4, appartement 128, 145 rue Jeanne Maillotte prolongée' };
    const { pages } = await render(
      base(
        [
          { ...newLine(), unitPrice: '1997', vatRate: '21' },
          { ...newLine('Séance de coaching individuelle — suivi hebdomadaire'), unitPrice: '150', vatRate: '21', quantity: '3' },
          { ...newLine('Accès communauté privée Ecommerce Capital Club (12 mois) avec mises à jour, replays et documents téléchargeables'), unitPrice: '49,90', vatRate: '6' },
        ],
        client,
      ),
      'multi.pdf',
    );
    expect(pages).toBeGreaterThanOrEqual(1);
  });
  it('beaucoup de lignes → plusieurs pages sans crash', async () => {
    const lines = Array.from({ length: 14 }, (_, i) => ({ ...newLine(`Prestation ${i + 1}`), unitPrice: '100', vatRate: '0' }));
    const { pages } = await render(base(lines), 'long.pdf');
    expect(pages).toBeGreaterThanOrEqual(2);
  });
}, 60_000);
