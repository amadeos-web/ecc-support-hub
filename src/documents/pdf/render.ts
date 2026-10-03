/**
 * Génération PDF (chargée à la demande pour ne pas alourdir l'application).
 * 100 % local : @react-pdf/renderer produit le fichier dans le navigateur.
 */
import { createElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import type { InvoiceData } from '../invoice/model';
import { InvoicePdf } from './InvoicePdf';
import { AttestationPdf, QuotePdf } from './OtherPdfs';
import type { AttestationModel, QuoteModel } from '../models';
import type { IssuerProfile } from '../core/issuer';
import { registerBrowserFonts } from './browserFonts';

export async function renderInvoicePdfBlob(data: InvoiceData): Promise<Blob> {
  registerBrowserFonts();
  // InvoicePdf renvoie un <Document> ; le cast satisfait la signature de pdf().
  return pdf(createElement(InvoicePdf, { data }) as Parameters<typeof pdf>[0]).toBlob();
}

export async function renderQuotePdfBlob(m: QuoteModel, issuer: IssuerProfile): Promise<Blob> {
  registerBrowserFonts();
  return pdf(createElement(QuotePdf, { m, issuer }) as Parameters<typeof pdf>[0]).toBlob();
}

export async function renderAttestationPdfBlob(m: AttestationModel, issuer: IssuerProfile): Promise<Blob> {
  registerBrowserFonts();
  return pdf(createElement(AttestationPdf, { m, issuer }) as Parameters<typeof pdf>[0]).toBlob();
}
