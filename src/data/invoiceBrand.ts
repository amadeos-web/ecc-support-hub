/**
 * DIRECTION ARTISTIQUE DE LA FACTURE — configuration centrale.
 *
 * Tout l'aspect visuel du PDF (et donc de l'aperçu, qui EST le PDF) se règle ici, sans
 * toucher au moteur de facture. Les éléments de marque officiels ECC (logo, texture)
 * ne sont pas encore fournis : des placeholders neutres sont utilisés.
 * Voir src/assets/brand/README.md pour brancher les fichiers officiels.
 */
import type { PdfFontName } from '../documents/pdf/fonts';

export interface InvoiceBrand {
  /** Nom de marque (pied de page, métadonnées PDF). Vide = nom de marque du profil émetteur, sinon raison sociale. */
  brandName: string;
  /** Texte du pied de page. Vide = brandName. */
  footerText: string;
  logo: {
    /** Logo officiel (URL d'un fichier de src/assets/brand). Prioritaire sur le logo importé dans le profil émetteur. */
    src: string | null;
    /** Sans logo : cadre neutre « LOGO » clairement identifiable (jamais de faux logo). */
    showPlaceholder: boolean;
    maxWidth: number;
    maxHeight: number;
  };
  /** Serif éditoriale : titre, labels, en-têtes de colonnes, total. */
  primaryFont: PdfFontName;
  /** Police de lecture : coordonnées, lignes, montants. */
  secondaryFont: PdfFontName;
  /** Interlettrage en points. */
  titleTracking: number;
  labelTracking: number;
  /** Couleur principale du texte (noir profond). */
  documentAccent: string;
  /** Libellés secondaires (Total, TVA…). */
  mutedColor: string;
  /** Lignes horizontales. */
  dividerStyle: { color: string; width: number };
  /** Fond des rangées mises en valeur (prestation, TVA). */
  rowBand: string;
  /** Bandeaux haut et bas de page (signature visuelle de la marque). */
  band: {
    color: string;
    /** Texture officielle (image très claire). null = aplat gris très clair. */
    texture: string | null;
    showTop: boolean;
  };
  /** Mise en valeur du « TOTAL MONTANT PERÇU ». */
  grandTotal: { size: number; tracking: number; rule: boolean };
}

/** Logo officiel ECC (fichier fourni : src/assets/ecc-logo-noir.png). */
import eccLogo from '../assets/ecc-logo-noir.png';

export const invoiceBrand: InvoiceBrand = {
  brandName: '',
  footerText: '',
  logo: { src: eccLogo, showPlaceholder: false, maxWidth: 66, maxHeight: 66 },
  primaryFont: 'EB Garamond',
  secondaryFont: 'Didact Gothic',
  titleTracking: 4.6,
  labelTracking: 1.5,
  documentAccent: '#0E0E0E',
  mutedColor: '#A8A8A8',
  dividerStyle: { color: '#E3E3E3', width: 0.6 },
  rowBand: '#F6F6F6',
  band: { color: '#F9F9F8', texture: null, showTop: true },
  grandTotal: { size: 15, tracking: 2.8, rule: false },
};
