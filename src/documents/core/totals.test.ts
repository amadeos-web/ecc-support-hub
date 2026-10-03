import { describe, expect, it } from 'vitest';
import { computeTotals, type LineInput } from './totals';
import { formatMoney, parseAmount, parseQuantity, parseRate } from './money';

const line = (price: string, rate: string, qty = '1', description = 'Formation ECC'): LineInput => {
  const p = parseAmount(price), r = parseRate(rate), q = parseQuantity(qty);
  if (!p.ok || !r.ok || !q.ok) throw new Error('entrée invalide');
  return { description, unitPriceCents: p.value, rateBp: r.value, quantityMilli: q.value };
};
const eur = (c: bigint) => formatMoney(c, 'EUR').replace(/ /g, ' ');

describe('calculs HT / TVA / TTC', () => {
  it('Test 1 — HT 100 € à 21 % → TVA 21 €, TTC 121 €', () => {
    const t = computeTotals([line('100', '21')], 'HT');
    expect(t.totalHT).toBe(10000n);
    expect(t.totalTVA).toBe(2100n);
    expect(t.totalTTC).toBe(12100n);
  });

  it('Test 2 — TTC 1 997 € à 21 % → HT 1 650,41 €, TVA 346,59 €, TTC 1 997 €', () => {
    const t = computeTotals([line('1 997,00', '21')], 'TTC');
    expect(t.totalHT).toBe(165041n);
    expect(t.totalTVA).toBe(34659n);
    expect(t.totalTTC).toBe(199700n);
    expect([eur(t.totalHT), eur(t.totalTVA), eur(t.totalTTC)]).toEqual(['1 650,41 €', '346,59 €', '1 997,00 €']);
  });

  it('Test 3 — TVA 0 % (HT = TTC) dans les deux modes', () => {
    for (const mode of ['HT', 'TTC'] as const) {
      const t = computeTotals([line('497', '0')], mode);
      expect(t).toMatchObject({ totalHT: 49700n, totalTVA: 0n, totalTTC: 49700n });
    }
  });

  it('Test 4 — quantité > 1', () => {
    const ht = computeTotals([line('90', '21', '3')], 'HT');
    expect(ht).toMatchObject({ totalHT: 27000n, totalTVA: 5670n, totalTTC: 32670n });
    const ttc = computeTotals([line('121', '21', '2')], 'TTC');
    expect(ttc).toMatchObject({ totalHT: 20000n, totalTVA: 4200n, totalTTC: 24200n });
    expect(ttc.lines[0].unitHT).toBe(10000n);
  });

  it('Test 5 — montants avec décimales, sans erreur de virgule flottante', () => {
    // 0,1 + 0,2 en flottant = 0,30000000000000004
    const t = computeTotals([line('0,10', '0'), line('0,20', '0')], 'HT');
    expect(t.totalHT).toBe(30n);
    // 19,99 × 3 à 5,5 % : HT 59,97 ; TVA 3,298… → 3,30 ; TTC 63,27
    expect(computeTotals([line('19,99', '5,5', '3')], 'HT')).toMatchObject({ totalHT: 5997n, totalTVA: 330n, totalTTC: 6327n });
    // 1,005 n'est pas accepté (3 décimales), 1,01 oui
    expect(parseAmount('1,005').ok).toBe(false);
    expect(computeTotals([line('1,01', '20')], 'TTC')).toMatchObject({ totalHT: 84n, totalTVA: 17n, totalTTC: 101n });
  });

  it('plusieurs lignes et plusieurs taux : la somme des lignes égale toujours les totaux', () => {
    const t = computeTotals([line('333,33', '21'), line('333,33', '21'), line('333,34', '21'), line('50', '6')], 'TTC');
    expect(t.totalTTC).toBe(105000n);
    expect(t.groups.map((g) => g.rateBp)).toEqual([600, 2100]);
    expect(t.lines.reduce((s, l) => s + l.totalHT, 0n)).toBe(t.totalHT);
    expect(t.lines.reduce((s, l) => s + l.totalTVA, 0n)).toBe(t.totalTVA);
    expect(t.lines.reduce((s, l) => s + l.totalTTC, 0n)).toBe(t.totalTTC);
  });

  it('arrondis répartis : aucune ligne ne s’écarte de plus d’un centime', () => {
    const t = computeTotals(Array.from({ length: 18 }, () => line('10,50', '6')), 'TTC');
    expect(t.totalHT).toBe(17830n);
    const hts = t.lines.map((l) => l.totalHT);
    expect(hts.every((v) => v === 990n || v === 991n)).toBe(true);
    expect(hts.reduce((a, b) => a + b, 0n)).toBe(17830n);
  });

  it('aucune ligne → totaux à zéro', () => {
    expect(computeTotals([], 'HT')).toMatchObject({ totalHT: 0n, totalTVA: 0n, totalTTC: 0n, groups: [] });
  });
});

describe('saisie des montants', () => {
  it('accepte espaces, virgule, symbole €', () => {
    expect(parseAmount(' 1 997,50 € ')).toEqual({ ok: true, value: 199750n });
    expect(parseAmount('1997.5')).toEqual({ ok: true, value: 199750n });
  });
  it('refuse les saisies invalides', () => {
    expect(parseAmount('').ok).toBe(false);
    expect(parseAmount('abc').ok).toBe(false);
    expect(parseAmount('-5').ok).toBe(false);
    expect(parseQuantity('0').ok).toBe(false);
    expect(parseRate('101').ok).toBe(false);
    expect(parseRate('').ok).toBe(false);
  });
  it('formate en français', () => {
    expect(eur(123456789n)).toBe('1 234 567,89 €');
    expect(formatMoney(5n, 'USD').replace(/ /g, ' ')).toBe('0,05 $');
  });
});
