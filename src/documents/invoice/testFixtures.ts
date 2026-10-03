import { defaultIssuerProfile } from '../../data/issuerProfile';
import type { IssuerProfile } from '../core/issuer';

/** Émetteur fictif pour les tests. */
export const testIssuer: IssuerProfile = {
  ...defaultIssuerProfile,
  name: 'Société Émettrice Test',
  address: '1 rue du Test',
  postalCode: '1000',
  city: 'Bruxelles',
  country: 'Belgique',
  companyNumber: '0000.000.000',
  vatNumber: 'BE0000000000',
};
