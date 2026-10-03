/**
 * Génération PDF (chargée à la demande pour ne pas alourdir l'application).
 * 100 % local : @react-pdf/renderer produit le fichier dans le navigateur.
 */
import { createElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import type { InvoiceData } from '../invoice/model';
import { InvoicePdf } from './InvoicePdf';
import { registerBrowserFonts } from './browserFonts';

export async function renderInvoicePdfBlob(data: InvoiceData): Promise<Blob> {
  registerBrowserFonts();
  // InvoicePdf renvoie un <Document> ; le cast satisfait la signature de pdf().
  return pdf(createElement(InvoicePdf, { data }) as Parameters<typeof pdf>[0]).toBlob();
}
