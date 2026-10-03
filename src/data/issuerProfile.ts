import type { IssuerProfile } from '../documents/core/issuer';

/**
 * ÉMETTEUR PAR DÉFAUT : Business Brothers LIMITED (ECC / BB).
 * Source unique pour tous les documents, préremplie et verrouillée dans « Générer un document ».
 * Seules les informations validées sont renseignées : aucune autre mention légale (numéro
 * d'entreprise, TVA, téléphone…) n'est inventée. Une modification exceptionnelle se fait
 * document par document et ne remplace JAMAIS ces valeurs.
 */
export const defaultIssuerProfile: IssuerProfile = {
  name: 'Business Brothers LIMITED',
  address: '2301, 23/F BAYFIELD BLDG 99\nHENNESSY RD WAN CHAI\nHONG KONG',
  postalCode: '',
  city: '',
  country: '',
  companyNumber: '',
  vatNumber: '',
  email: '',
  brandName: '',
  logoDataUrl: '',
  invoicePrefix: 'ECC',
  notApplicable: {},
};

/** Copie indépendante du profil par défaut (un document ne modifie jamais l'original). */
export const freshIssuerProfile = (): IssuerProfile => ({ ...defaultIssuerProfile, notApplicable: { ...defaultIssuerProfile.notApplicable } });
