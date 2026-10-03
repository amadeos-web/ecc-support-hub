import { describe, expect, it } from 'vitest';
import { searchCases } from './caseSearch';
import { supportCases } from '../data';

const ids = (q: string) => searchCases(supportCases, q).map((c) => c.id);

describe('recherche des cas (Traiter une demande)', () => {
  it('trouve par mot-clé même si le titre est différent', () => {
    expect(ids('circle')).toContain('cas-acces-v2-non-recu');
    expect(ids('whop')).toContain('cas-whop-payant-v1');
    expect(ids('paiement')).toContain('cas-defaut-paiement');
    expect(ids('vidéo')).toContain('cas-lecture-videos');
    expect(ids('email')).toContain('cas-acces-actif-mauvais-compte');
    expect(ids('telephone')).toContain('cas-video-telephone');
    expect(ids('facture')[0]).toBe('cas-facture');
    expect(ids('remboursement')).toContain('cas-remboursement');
  });
  it('les cas dont le titre correspond passent en premier', () => {
    expect(ids('prélèvement')[0]).toBe('cas-date-prelevement');
    expect(ids('pas accès formation').slice(0, 2).sort()).toEqual(['cas-acces-v2-non-recu', 'cas-whop-payant-v1']);
  });
  it('requête vide = tous les cas', () => {
    expect(ids('')).toHaveLength(supportCases.length);
  });
});
