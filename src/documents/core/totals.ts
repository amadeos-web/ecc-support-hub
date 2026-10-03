/**
 * Calcul HT / TVA / TTC — réutilisable pour factures et devis.
 *
 * Mode "HT"  : HT = prix × quantité ; TVA = HT × taux (par taux) ; TTC = HT + TVA
 * Mode "TTC" : TTC = prix × quantité ; HT = TTC / (1 + taux) (par taux) ; TVA = TTC − HT
 *
 * La TVA est calculée par taux sur le total du taux (pas ligne à ligne), puis répartie
 * sur les lignes par la méthode du plus fort reste : chaque ligne diffère d'au plus
 * 1 centime de sa valeur exacte, et la somme des lignes est toujours égale aux totaux.
 */
import { roundDiv, type Cents, type RateBp } from './money';

export type PriceMode = 'HT' | 'TTC';

export interface LineInput {
  description: string;
  /** Quantité en millièmes (1 → 1000n). */
  quantityMilli: bigint;
  /** Prix unitaire saisi, HT ou TTC selon le mode. */
  unitPriceCents: Cents;
  rateBp: RateBp;
}

export interface ComputedLine extends LineInput {
  unitHT: Cents;
  totalHT: Cents;
  totalTVA: Cents;
  totalTTC: Cents;
}

export interface VatGroup {
  rateBp: RateBp;
  baseHT: Cents;
  tva: Cents;
  ttc: Cents;
}

export interface Totals {
  lines: ComputedLine[];
  groups: VatGroup[];
  totalHT: Cents;
  totalTVA: Cents;
  totalTTC: Cents;
}

const BP = 10000n;

/**
 * Répartit `target` centimes entre des parts exactes num[i] / den : chaque part reçoit
 * floor(num/den), puis les centimes restants vont aux plus forts restes.
 */
function allocate(nums: bigint[], den: bigint, target: bigint): bigint[] {
  const parts = nums.map((n) => n / den);
  let rest = target - parts.reduce((a, b) => a + b, 0n);
  const order = nums.map((n, i) => ({ i, r: n % den })).sort((a, b) => (a.r === b.r ? a.i - b.i : a.r > b.r ? -1 : 1));
  for (const { i } of order) {
    if (rest <= 0n) break;
    parts[i] += 1n;
    rest -= 1n;
  }
  return parts;
}

export function computeTotals(inputs: LineInput[], mode: PriceMode): Totals {
  const lines: ComputedLine[] = inputs.map((l) => {
    const amount = roundDiv(l.unitPriceCents * l.quantityMilli, 1000n);
    const rate = BigInt(l.rateBp);
    return mode === 'HT'
      ? { ...l, unitHT: l.unitPriceCents, totalHT: amount, totalTVA: 0n, totalTTC: 0n }
      : { ...l, unitHT: roundDiv(l.unitPriceCents * BP, BP + rate), totalHT: 0n, totalTVA: 0n, totalTTC: amount };
  });

  const rates = [...new Set(lines.map((l) => l.rateBp))].sort((a, b) => a - b);
  const groups: VatGroup[] = rates.map((rateBp) => {
    const rate = BigInt(rateBp);
    const groupLines = lines.filter((l) => l.rateBp === rateBp);
    if (mode === 'HT') {
      const baseHT = groupLines.reduce((s, l) => s + l.totalHT, 0n);
      const tva = roundDiv(baseHT * rate, BP);
      allocate(groupLines.map((l) => l.totalHT * rate), BP, tva).forEach((v, i) => {
        groupLines[i].totalTVA = v;
        groupLines[i].totalTTC = groupLines[i].totalHT + v;
      });
      return { rateBp, baseHT, tva, ttc: baseHT + tva };
    }
    const ttc = groupLines.reduce((s, l) => s + l.totalTTC, 0n);
    const baseHT = roundDiv(ttc * BP, BP + rate);
    allocate(groupLines.map((l) => l.totalTTC * BP), BP + rate, baseHT).forEach((v, i) => {
      groupLines[i].totalHT = v;
      groupLines[i].totalTVA = groupLines[i].totalTTC - v;
    });
    return { rateBp, baseHT, tva: ttc - baseHT, ttc };
  });

  return {
    lines,
    groups,
    totalHT: groups.reduce((s, g) => s + g.baseHT, 0n),
    totalTVA: groups.reduce((s, g) => s + g.tva, 0n),
    totalTTC: groups.reduce((s, g) => s + g.ttc, 0n),
  };
}
