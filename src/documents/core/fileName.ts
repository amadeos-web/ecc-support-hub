/** Nom de fichier sûr : sans accents, espaces ni caractères spéciaux. */
export function slugify(input: string, { lower = false } = {}): string {
  const s = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return lower ? s.toLowerCase() : s;
}

export type DocumentKind = 'Facture' | 'Devis' | 'Attestation';

/** Facture_ECC_ECC-2026-0001_jean-dupont.pdf */
export function buildDocumentFileName(kind: DocumentKind, numero: string, clientName: string): string {
  const num = slugify(numero) || 'sans-numero';
  const client = slugify(clientName, { lower: true }) || 'client';
  return `${kind}_ECC_${num}_${client}.pdf`;
}
