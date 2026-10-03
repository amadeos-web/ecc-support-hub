/** Profil émetteur : configuration centrale, modifiable avant chaque génération et enregistrable localement. */
import type { KeyValueStorage } from './storage';

export interface IssuerProfile {
  /** Raison sociale (bloc EMETTEUR). */
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  companyNumber: string;
  vatNumber: string;
  /** Optionnel. */
  email: string;
  /** Nom de marque affiché en pied de page (ex. « Business Brothers »). Par défaut : la raison sociale. */
  brandName: string;
  /** Logo optionnel (PNG/JPEG en data URL), affiché en haut à droite. */
  logoDataUrl: string;
  /** Préfixe des numéros de facture : ECC → ECC0174. */
  invoicePrefix: string;
  /**
   * Champs volontairement marqués « non applicable » (ex. société sans code postal ou
   * sans numéro de TVA). Un champ vide non coché bloque la génération.
   */
  notApplicable: Partial<Record<OptionalIssuerField, boolean>>;
}

export type OptionalIssuerField = 'postalCode' | 'companyNumber' | 'vatNumber';

export const ISSUER_REQUIRED: { key: Exclude<keyof IssuerProfile, 'notApplicable'>; label: string; canBeNA?: boolean }[] = [
  { key: 'name', label: 'Raison sociale' },
  { key: 'address', label: 'Adresse' },
  { key: 'postalCode', label: 'Code postal', canBeNA: true },
  { key: 'city', label: 'Ville' },
  { key: 'country', label: 'Pays' },
  { key: 'companyNumber', label: "Numéro d'entreprise", canBeNA: true },
  { key: 'vatNumber', label: 'Numéro de TVA', canBeNA: true },
];

/** Une valeur entre crochets = placeholder non personnalisé. */
export const isPlaceholder = (v: string) => /^\s*\[.*\]\s*$/.test(v);

/** Valeur imprimable (vide si placeholder ou non applicable). */
export function issuerValue(p: IssuerProfile, key: Exclude<keyof IssuerProfile, 'notApplicable'>): string {
  const v = (p[key] ?? '').trim();
  if (isPlaceholder(v)) return '';
  if ((key === 'postalCode' || key === 'companyNumber' || key === 'vatNumber') && p.notApplicable?.[key]) return '';
  return v;
}

/** Erreurs bloquantes du profil émetteur. */
export function issuerErrors(p: IssuerProfile): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const { key, label, canBeNA } of ISSUER_REQUIRED) {
    const v = (p[key] ?? '').trim();
    const na = canBeNA && p.notApplicable?.[key as OptionalIssuerField];
    if (na) continue;
    if (!v) errors[`issuer.${key}`] = `Émetteur : ${label} manquant${canBeNA ? ' (ou cocher « non applicable »)' : ''}`;
    else if (isPlaceholder(v)) errors[`issuer.${key}`] = `Émetteur : ${label} à personnaliser (valeur de démonstration)`;
  }
  if (p.email.trim() && isPlaceholder(p.email)) errors['issuer.email'] = 'Émetteur : email à personnaliser ou à vider';
  return errors;
}

const KEY = 'ecc-hub:emetteur';

export function loadIssuerProfile(storage: KeyValueStorage, defaults: IssuerProfile): { profile: IssuerProfile; saved: boolean } {
  try {
    const raw = storage.get(KEY);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<IssuerProfile>;
      return { profile: { ...defaults, ...stored, notApplicable: { ...defaults.notApplicable, ...stored.notApplicable } }, saved: true };
    }
  } catch {
    /* profil corrompu : valeurs par défaut */
  }
  return { profile: { ...defaults, notApplicable: { ...defaults.notApplicable } }, saved: false };
}

export const saveIssuerProfile = (storage: KeyValueStorage, p: IssuerProfile) => storage.set(KEY, JSON.stringify(p));
export const ISSUER_STORAGE_KEY = KEY;
