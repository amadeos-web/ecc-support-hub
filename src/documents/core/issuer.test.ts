import { describe, expect, it } from 'vitest';
import { defaultIssuerProfile, freshIssuerProfile } from '../../data/issuerProfile';
import { issuerLines } from '../pdf/blocks';

describe('émetteur par défaut', () => {
  it('s’imprime sur trois lignes d’adresse, sans autre mention', () => {
    expect(issuerLines(defaultIssuerProfile)).toEqual(['Business Brothers LIMITED', '2301, 23/F BAYFIELD BLDG 99', 'HENNESSY RD WAN CHAI', 'HONG KONG']);
  });
  it('une modification exceptionnelle ne touche jamais les valeurs par défaut', () => {
    const doc = freshIssuerProfile();
    doc.name = 'Autre société';
    doc.notApplicable.vatNumber = true;
    expect(defaultIssuerProfile.name).toBe('Business Brothers LIMITED');
    expect(freshIssuerProfile()).toEqual(defaultIssuerProfile);
  });
});
