import type { IssuerProfile } from '../documents/core/issuer';

/**
 * PROFIL ÉMETTEUR PAR DÉFAUT — PLACEHOLDERS.
 * Aucune société (BB, ECC…) n'est codée en dur : les coordonnées de facturation internes
 * pouvant évoluer, elles sont saisies dans Documents → Facture → Émetteur (et
 * enregistrables dans le navigateur). Tant qu'une valeur reste entre [crochets] ou vide,
 * la génération du PDF est bloquée.
 */
export const defaultIssuerProfile: IssuerProfile = {
  name: '[Raison sociale]',
  address: '[Adresse]',
  postalCode: '[Code postal]',
  city: '[Ville]',
  country: '[Pays]',
  companyNumber: "[Numéro d'entreprise]",
  vatNumber: '[Numéro de TVA]',
  email: '',
  brandName: '',
  logoDataUrl: '',
  invoicePrefix: 'ECC',
  notApplicable: {},
};
