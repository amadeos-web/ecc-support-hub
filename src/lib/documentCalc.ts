/** Calculs HT / TVA / TTC. Tous les montants sont arrondis au centime. */

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface Totals {
  ht: number;
  tva: number;
  ttc: number;
}

/** À partir d'un montant TTC payé (cas facture). */
export function totalsFromTTC(ttc: number, vatRate: number): Totals {
  const safeTtc = Number.isFinite(ttc) ? ttc : 0;
  const ht = round2(safeTtc / (1 + vatRate / 100));
  return { ht, tva: round2(safeTtc - ht), ttc: round2(safeTtc) };
}

export interface QuoteLine {
  id: string;
  label: string;
  quantity: number;
  unitPriceHT: number;
  vatRate: number;
}

export function lineTotalHT(line: QuoteLine): number {
  return round2((line.quantity || 0) * (line.unitPriceHT || 0));
}

/** Totaux d'un devis : somme des lignes HT, TVA par ligne. */
export function totalsFromLines(lines: QuoteLine[]): Totals & { byRate: { rate: number; base: number; tva: number }[] } {
  const byRateMap = new Map<number, number>();
  for (const l of lines) byRateMap.set(l.vatRate, (byRateMap.get(l.vatRate) ?? 0) + lineTotalHT(l));
  const byRate = [...byRateMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, base]) => ({ rate, base: round2(base), tva: round2((base * rate) / 100) }));
  const ht = round2(byRate.reduce((s, r) => s + r.base, 0));
  const tva = round2(byRate.reduce((s, r) => s + r.tva, 0));
  return { ht, tva, ttc: round2(ht + tva), byRate };
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** "2026-10-02" → "02/10/2026" ; chaîne vide si invalide. */
export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR');
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayISO = () => toISODate(new Date());
