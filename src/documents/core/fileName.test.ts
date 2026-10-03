import { describe, expect, it } from 'vitest';
import { buildDocumentFileName } from './fileName';

describe('nom du fichier PDF', () => {
  it('format Facture_ECC_[numero]_[nom-client].pdf', () => {
    expect(buildDocumentFileName('Facture', 'ECC-2026-0001', 'Jean Dupont')).toBe('Facture_ECC_ECC-2026-0001_jean-dupont.pdf');
  });
  it('nettoie accents et caractères incompatibles', () => {
    expect(buildDocumentFileName('Facture', 'ECC/2026 #12', 'Élodie  O’Brien-Müller')).toBe('Facture_ECC_ECC-2026-12_elodie-o-brien-muller.pdf');
    expect(buildDocumentFileName('Facture', 'A:B*C?"<>|', 'x/y\\z')).toBe('Facture_ECC_A-B-C_x-y-z.pdf');
  });
  it('valeurs vides', () => {
    expect(buildDocumentFileName('Facture', '', '')).toBe('Facture_ECC_sans-numero_client.pdf');
  });
});
