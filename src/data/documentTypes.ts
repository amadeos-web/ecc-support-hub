import { defaultIssuerProfile } from './issuerProfile';
import type { DocumentTypeDef } from './types';

export const documentTypes: DocumentTypeDef[] = [
  {
    id: 'facture',
    label: 'Invoice',
    description: 'Invoice for a payment already received.',
    keywords: ['facture', 'invoice', 'reçu', 'paiement', 'tva'],
  },
  {
    id: 'devis',
    label: 'Quote',
    description: 'Quote for a course funded by a funding body.',
    keywords: ['devis', 'quote', 'proposition', 'entreprise', 'tarif'],
  },
  {
    id: 'attestation',
    label: 'Training certificate',
    description: 'Proof that a member is taking or has taken a course.',
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
  addressLines: [...p.address.split('\n'), [p.postalCode, p.city].filter(Boolean).join(' '), p.country].map((l) => l.trim()).filter(Boolean),
  legalLines: [p.companyNumber, p.vatNumber].filter(Boolean),
  email: p.email,
  signatory: '[Nom et fonction du signataire — à compléter]',
};

export const currencies = ['EUR', 'USD', 'CHF', 'GBP', 'CAD'] as const;
export type Currency = (typeof currencies)[number];

/** Taux de TVA proposés dans les formulaires (à valider avec la comptabilité). */
export const vatRates = [0, 5.5, 10, 20] as const;

/** Valeurs imprimées sur l'attestation (français) ; libellés anglais pour l'agent. */
export const attestationStatuses = ['En cours', 'Terminée', 'Suspendue'] as const;
export const attestationStatusLabels: Record<(typeof attestationStatuses)[number], string> = {
  'En cours': 'In progress',
  Terminée: 'Completed',
  Suspendue: 'Suspended',
};
