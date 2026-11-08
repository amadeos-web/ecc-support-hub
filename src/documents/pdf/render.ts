/**
 * Génération PDF (chargée à la demande pour ne pas alourdir l'application).
 * 100 % local : @react-pdf/renderer produit le fichier dans le navigateur.
 */
import { createElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import type { InvoiceData } from '../invoice/model';
import { InvoicePdf, type InvoicePdfVariant } from './InvoicePdf';
import { QuotePdf } from './OtherPdfs';
import type { SimpleQuote } from '../quote/model';
import { registerBrowserFonts } from './browserFonts';

export async function renderInvoicePdfBlob(data: InvoiceData): Promise<Blob> {
  registerBrowserFonts();
  // InvoicePdf renvoie un <Document> ; le cast satisfait la signature de pdf().
  return pdf(createElement(InvoicePdf, { data }) as Parameters<typeof pdf>[0]).toBlob();
}

export async function renderQuotePdfBlob(q: SimpleQuote): Promise<Blob> {
  registerBrowserFonts();
  return pdf(createElement(QuotePdf, { q }) as Parameters<typeof pdf>[0]).toBlob();
}

export async function renderAttestationPdfBlob(data: InvoiceData, variant: InvoicePdfVariant): Promise<Blob> {
  registerBrowserFonts();
  return pdf(createElement(InvoicePdf, { data, variant }) as Parameters<typeof pdf>[0]).toBlob();
}
