import { describe, expect, it } from 'vitest';
import { addDays, totalsFromLines, totalsFromTTC } from './documentCalc';

describe('calculs HT / TVA / TTC', () => {
  it('déduit HT et TVA depuis un TTC à 20 %', () => {
    expect(totalsFromTTC(120, 20)).toEqual({ ht: 100, tva: 20, ttc: 120 });
  });
  it('gère une TVA à 0 %', () => {
    expect(totalsFromTTC(497, 0)).toEqual({ ht: 497, tva: 0, ttc: 497 });
  });
  it('arrondit au centime et garde HT + TVA = TTC', () => {
    const t = totalsFromTTC(497, 20);
    expect(t.ht).toBe(414.17);
    expect(t.tva).toBe(82.83);
    expect(t.ht + t.tva).toBeCloseTo(497, 2);
  });
  it('totalise les lignes de devis par taux', () => {
    const t = totalsFromLines([
      { id: 'a', label: 'A', quantity: 2, unitPriceHT: 50, vatRate: 20 },
      { id: 'b', label: 'B', quantity: 1, unitPriceHT: 100, vatRate: 0 },
    ]);
    expect(t).toMatchObject({ ht: 200, tva: 20, ttc: 220 });
    expect(t.byRate).toHaveLength(2);
  });
  it('calcule une date de validité', () => {
    expect(addDays('2026-10-02', 30)).toBe('2026-11-01');
  });
});
