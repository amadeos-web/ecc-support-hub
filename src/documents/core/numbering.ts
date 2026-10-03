/**
 * Numérotation des factures — PROPOSITION uniquement (format ECC0174, BB0173…).
 * Le numéro proposé reste modifiable ; il n'est noté comme « utilisé » qu'au moment où
 * le PDF est réellement généré. La séquence continue d'un préfixe à l'autre
 * (BB0173 → ECC0174). L'historique est local à ce navigateur : ce n'est PAS une
 * séquence officielle. Pour brancher une vraie séquence persistante, fournir une autre
 * implémentation de NumberStore.
 */
import type { KeyValueStorage } from './storage';

export interface NumberStore {
  /** Plus grand numéro de séquence connu (factures générées ici + dernier numéro de référence saisi). */
  lastSequence(): number;
  isUsed(numero: string): boolean;
  markUsed(numero: string): void;
  /** Dernier numéro émis ailleurs (ex. dernière facture Canva « BB0173 »), saisi par l'utilisateur. */
  getReference(): string;
  setReference(numero: string): void;
}

export const SEQUENCE_DIGITS = 4;

export const formatInvoiceNumber = (prefix: string, seq: number) => `${prefix.trim().toUpperCase()}${String(seq).padStart(SEQUENCE_DIGITS, '0')}`;

/** "ECC0174" → { prefix: "ECC", seq: 174 } */
export function parseInvoiceNumber(numero: string): { prefix: string; seq: number } | null {
  const m = numero.trim().match(/^([A-Za-z]+)-?(\d+)$/);
  return m ? { prefix: m[1].toUpperCase(), seq: Number(m[2]) } : null;
}

export function proposeInvoiceNumber(store: NumberStore, prefix: string): string {
  return formatInvoiceNumber(prefix, store.lastSequence() + 1);
}

export function validateInvoiceNumber(numero: string): string | null {
  const s = numero.trim();
  if (!s) return 'Numéro de facture requis';
  if (s.length > 30) return '30 caractères maximum';
  if (!/^[A-Za-z0-9][A-Za-z0-9\-_/.]*$/.test(s)) return 'Numéro : lettres, chiffres et - _ / . uniquement';
  return null;
}

interface UsedEntry {
  numero: string;
  le: string;
}

/** Historique local : uniquement les numéros et la date, aucune donnée client. */
export function createLocalNumberStore(storage: KeyValueStorage, key = 'ecc-hub:factures:numeros-utilises'): NumberStore {
  const refKey = `${key}:reference`;
  const read = (): UsedEntry[] => {
    try {
      const v = JSON.parse(storage.get(key) ?? '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };
  return {
    lastSequence() {
      const seqs = read().map((e) => parseInvoiceNumber(e.numero)?.seq ?? 0);
      const ref = parseInvoiceNumber(storage.get(refKey) ?? '')?.seq ?? 0;
      return Math.max(0, ref, ...seqs);
    },
    isUsed: (numero) => read().some((e) => e.numero === numero.trim()),
    markUsed(numero) {
      const list = read();
      if (!list.some((e) => e.numero === numero.trim())) {
        list.push({ numero: numero.trim(), le: new Date().toISOString() });
        storage.set(key, JSON.stringify(list));
      }
    },
    getReference: () => storage.get(refKey) ?? '',
    setReference: (numero) => void storage.set(refKey, numero.trim()),
  };
}
