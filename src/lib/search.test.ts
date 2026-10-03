import { describe, expect, it } from 'vitest';
import { normalize } from './search';

describe('normalisation de la recherche', () => {
  it('ignore les accents et la casse', () => {
    expect(normalize('Accès FACTURÉ')).toBe('acces facture');
  });
});
