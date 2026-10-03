import { Font } from '@react-pdf/renderer';

/**
 * Polices disponibles pour les documents PDF (fichiers locaux dans ./fonts, licences OFL).
 * Le choix des polices se fait dans src/data/invoiceBrand.ts.
 */
export type PdfFontName = 'EB Garamond' | 'Didact Gothic' | 'Inter';

export interface FontFiles {
  /** Chemin (tests) ou URL (navigateur) de chaque fichier, par police et graisse. */
  'EB Garamond': { 400: string; 500: string };
  'Didact Gothic': { 400: string };
  Inter: { 400: string };
}

/** Police de secours (couverture Unicode étendue) ajoutée derrière chaque police. */
export const PDF_FALLBACK: PdfFontName = 'Inter';

let registered = false;

export function registerPdfFonts(files: FontFiles) {
  if (registered) return;
  for (const [family, weights] of Object.entries(files) as [PdfFontName, Record<string, string>][]) {
    Font.register({ family, fonts: Object.entries(weights).map(([w, src]) => ({ src, fontWeight: Number(w) })) });
  }
  // Pas de césure automatique (règles anglaises) ; les mots très longs (emails, URL,
  // références) sont découpés pour ne jamais déborder de leur colonne.
  Font.registerHyphenationCallback((word) => (word.length > 24 ? word.match(/.{1,12}/g) ?? [word] : [word]));
  registered = true;
}
