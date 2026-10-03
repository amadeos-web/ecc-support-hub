import { defaultIssuerProfile } from './issuerProfile';
import type { DocumentTypeDef } from './types';

export const documentTypes: DocumentTypeDef[] = [
  {
    id: 'facture',
    label: 'Facture',
    description: 'Facture correspondant à un paiement déjà reçu.',
    keywords: ['facture', 'invoice', 'reçu', 'paiement', 'tva'],
  },
  {
    id: 'devis',
    label: 'Devis',
    description: 'Proposition chiffrée avec lignes de prestations, TVA et durée de validité.',
    keywords: ['devis', 'quote', 'proposition', 'entreprise', 'tarif'],
  },
  {
    id: 'attestation',
    label: 'Attestation de suivi de formation',
    description: "Justificatif attestant qu'un membre suit ou a suivi une formation.",
    keywords: ['attestation', 'certificat', 'suivi', 'justificatif'],
  },
];

/**
 * Émetteur des devis / attestations (aperçu HTML), dérivé du profil central
 * `issuerProfile.ts` — une seule source pour les informations ECC.
 */
const p = defaultIssuerProfile;
export const issuer = {
  name: p.name,
  addressLines: [p.address, `${p.postalCode} ${p.city}, ${p.country}`],
  legalLines: [p.companyNumber, p.vatNumber],
  email: p.email,
  signatory: '[Nom et fonction du signataire — à compléter]',
};

export const currencies = ['EUR', 'USD', 'CHF', 'GBP', 'CAD'] as const;
export type Currency = (typeof currencies)[number];

/** Taux de TVA proposés dans les formulaires (à valider avec la comptabilité). */
export const vatRates = [0, 5.5, 10, 20] as const;

export const attestationStatuses = ['En cours', 'Terminée', 'Suspendue'] as const;
