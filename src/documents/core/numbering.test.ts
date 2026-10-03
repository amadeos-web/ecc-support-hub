import { describe, expect, it } from 'vitest';
import { createLocalNumberStore, formatInvoiceNumber, parseInvoiceNumber, proposeInvoiceNumber, validateInvoiceNumber } from './numbering';

const memory = () => {
  const m = new Map<string, string>();
  return { get: (k: string) => m.get(k) ?? null, set: (k: string, v: string) => (m.set(k, v), true) };
};

describe('numérotation (format ECC0174)', () => {
  it('formate et lit les numéros', () => {
    expect(formatInvoiceNumber('ECC', 174)).toBe('ECC0174');
    expect(formatInvoiceNumber('bb', 7)).toBe('BB0007');
    expect(parseInvoiceNumber('BB0173')).toEqual({ prefix: 'BB', seq: 173 });
    expect(parseInvoiceNumber('ECC-0174')).toEqual({ prefix: 'ECC', seq: 174 });
    expect(parseInvoiceNumber('n’importe quoi')).toBeNull();
  });
  it('la séquence continue d’un préfixe à l’autre (BB0173 → ECC0174)', () => {
    const store = createLocalNumberStore(memory());
    expect(proposeInvoiceNumber(store, 'ECC')).toBe('ECC0001');
    store.setReference('BB0173');
    expect(proposeInvoiceNumber(store, 'ECC')).toBe('ECC0174');
    expect(proposeInvoiceNumber(store, 'BB')).toBe('BB0174');
    // une proposition n'est pas « utilisée » tant que le PDF n'est pas généré
    expect(proposeInvoiceNumber(store, 'ECC')).toBe('ECC0174');
    store.markUsed('ECC0174');
    expect(store.isUsed('ECC0174')).toBe(true);
    expect(proposeInvoiceNumber(store, 'ECC')).toBe('ECC0175');
  });
  it('refuse un numéro vide ou invalide', () => {
    expect(validateInvoiceNumber('')).toMatch(/Renseigne le numéro/);
    expect(validateInvoiceNumber('   ')).toMatch(/Renseigne le numéro/);
    expect(validateInvoiceNumber('ECC 0174')).not.toBeNull();
    expect(validateInvoiceNumber('ECC0174')).toBeNull();
  });
});
