/**
 * Montants en CENTIMES entiers (bigint) et taux en POINTS DE BASE (2100 = 21 %).
 * Aucun calcul monétaire ne passe par des nombres à virgule flottante.
 */

export type Cents = bigint;
/** Taux de TVA en centièmes de pour cent : 21 % → 2100, 5,5 % → 550. */
export type RateBp = number;

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const clean = (s: string) => s.replace(/[\s  €]/g, '').replace(',', '.');

/** "1 997,00" / "1997.5" / "1997" → centimes. 2 décimales maximum. */
export function parseAmount(input: string): ParseResult<Cents> {
  const s = clean(input);
  if (s === '') return { ok: false, error: 'Montant requis' };
  if (/^\d+\.\d{3,}$/.test(s)) return { ok: false, error: '2 décimales maximum' };
  const m = s.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return { ok: false, error: 'Montant invalide (ex. 1997,00)' };
  return { ok: true, value: BigInt(m[1]) * 100n + BigInt((m[2] ?? '').padEnd(2, '0')) };
}

/** Quantité → millièmes (1,5 → 1500). Strictement positive, 3 décimales maximum. */
export function parseQuantity(input: string): ParseResult<bigint> {
  const s = clean(input);
  if (s === '') return { ok: false, error: 'Quantité requise' };
  const m = s.match(/^(\d+)(?:\.(\d{1,3}))?$/);
  if (!m) return { ok: false, error: 'Quantité invalide' };
  const v = BigInt(m[1]) * 1000n + BigInt((m[2] ?? '').padEnd(3, '0'));
  if (v <= 0n) return { ok: false, error: 'La quantité doit être supérieure à 0' };
  return { ok: true, value: v };
}

/** "21" / "5,5" → points de base. Entre 0 et 100 %, 2 décimales maximum. */
export function parseRate(input: string): ParseResult<RateBp> {
  const s = clean(input).replace('%', '');
  if (s === '') return { ok: false, error: 'Taux de TVA à choisir' };
  const m = s.match(/^(\d{1,3})(?:\.(\d{1,2}))?$/);
  if (!m) return { ok: false, error: 'Taux invalide (ex. 21)' };
  const bp = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  if (bp > 10000) return { ok: false, error: 'Le taux doit être compris entre 0 et 100 %' };
  return { ok: true, value: bp };
}

/** Division entière arrondie au plus proche (0,5 → vers le haut). n ≥ 0, d > 0. */
export function roundDiv(n: bigint, d: bigint): bigint {
  if (n < 0n) return -roundDiv(-n, d);
  return (2n * n + d) / (2n * d);
}

const CURRENCY_SYMBOL: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', CAD: '$ CA' };
const NBSP = ' ';

const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

/** 165041n, "EUR" → "1 650,41 €" (espaces insécables, compatibles PDF). */
export function formatMoney(cents: Cents, currency: string): string {
  const neg = cents < 0n;
  const abs = neg ? -cents : cents;
  const int = groupThousands((abs / 100n).toString());
  const dec = (abs % 100n).toString().padStart(2, '0');
  return `${neg ? '-' : ''}${int},${dec}${NBSP}${CURRENCY_SYMBOL[currency] ?? currency}`;
}

/** Comme formatMoney, sans « ,00 » pour les montants ronds : 199700n → "1 997 €" (style du modèle ECC). */
export function formatMoneyCompact(cents: Cents, currency: string): string {
  const full = formatMoney(cents, currency);
  return cents % 100n === 0n ? full.replace(',00', '') : full;
}

/** 2100 → "21 %", 550 → "5,5 %", 0 → "0 %". */
export function formatRate(bp: RateBp): string {
  return `${formatRateNumber(bp)}${NBSP}%`;
}

/** 2100 → "21", 550 → "5,5", 0 → "0". */
export function formatRateNumber(bp: RateBp): string {
  const int = Math.floor(bp / 100);
  const dec = String(bp % 100).padStart(2, '0').replace(/0+$/, '');
  return `${int}${dec ? `,${dec}` : ''}`;
}

/** 1000n → "1", 1500n → "1,5". */
export function formatQuantity(milli: bigint): string {
  const int = (milli / 1000n).toString();
  const dec = (milli % 1000n).toString().padStart(3, '0').replace(/0+$/, '');
  return dec ? `${int},${dec}` : int;
}
