import type { CaseStatus, Category, CategoryId, Handling, MessageMoment, SupportCase, ValidationStatus } from './types';

/**
 * Grandes catégories affichées en cartes sur « Traiter une demande ».
 * PROVISOIRES : la liste définitive sera fixée par l'analyse de l'historique Freshdesk.
 */
export const categories: Category[] = [
  { id: 'acces-connexion', filterLabel: 'Access', label: 'Access & login', icon: '🔑', hint: 'Has not received access, cannot log in, new ecosystem' },
  { id: 'paiement-statut', filterLabel: 'Payment', label: 'Payment & member status', icon: '💳', hint: 'Direct debit, missed payment, status to check' },
  { id: 'formation-whop', filterLabel: 'Course / Whop', label: 'Course / Whop', icon: '🎓', hint: 'Whop access, 0 USD invoice, watching videos' },
  { id: 'communaute-circle', filterLabel: 'Circle', label: 'Community / Circle', icon: '💬', hint: 'Circle, Advanced level, community spaces' },
  { id: 'factures-documents', filterLabel: 'Documents', label: 'Invoices & documents', icon: '🧾', hint: 'Invoice, quote, certificate' },
  { id: 'compte-membre', filterLabel: 'Account', label: 'Member account', icon: '👤', hint: 'Identification, access sharing, account details' },
  { id: 'technique', filterLabel: 'Technical', label: 'Technical problem', icon: '🛠', hint: 'Bug, video that does not play, platform' },
  { id: 'autre', filterLabel: 'Other', label: 'Other requests', icon: '✉️', hint: 'Off-topic, requests not listed' },
];

export const categoryLabel = (id: CategoryId): string => categories.find((c) => c.id === id)?.label ?? id;
export const getCategory = (id?: string) => categories.find((c) => c.id === id);

export const handlingInfo: Record<Handling, { icon: string; label: string; short: string; description: string }> = {
  sav: { icon: '🟢', label: 'SUPPORT — you can handle it directly', short: 'Direct support', description: 'You have everything you need to reply and close.' },
  escalade: { icon: '🟠', label: 'ESCALATE — someone else needs to step in', short: 'Escalate', description: 'You collect the information, forward it, follow up, then confirm to the member.' },
  'ne-pas-traiter': { icon: '🔴', label: 'DO NOT HANDLE DIRECTLY', short: 'Do not handle', description: 'Do not reply on the substance: forward it right away.' },
};

export const validationInfo: Record<ValidationStatus, { label: string; description: string }> = {
  valide: { label: 'Validated', description: 'Procedure documented by ECC.' },
  'a-valider': { label: 'To validate', description: 'Must be confirmed by a person before it is considered official.' },
  demo: { label: 'Demo', description: 'Fictional example used to build the interface.' },
};

export const momentLabel: Record<MessageMoment, string> = {
  reponse: 'Reply to the member',
  pendant: 'While handling',
  resolution: 'Once the problem is solved',
};

export const statusInfo: Record<CaseStatus, { icon: string; label: string; description: string }> = {
  'sav-direct': { icon: '🟢', label: 'DIRECT SUPPORT', description: 'You handle it yourself, from start to finish.' },
  'a-remonter': { icon: '🟠', label: 'ESCALATE', description: 'Someone else needs to step in: you forward, follow up and confirm to the member.' },
  'a-valider': { icon: '⚠️', label: 'TO VALIDATE', description: 'Procedure observed but not yet officially validated by ECC.' },
  'ne-pas-traiter': { icon: '🔴', label: 'DO NOT HANDLE', description: 'Do not reply on the substance: forward it.' },
};

/** Statut principal d'un cas. */
export function caseStatus(c: Pick<SupportCase, 'validation' | 'handling'>): CaseStatus {
  if (c.validation === 'a-valider' || !c.handling) return 'a-valider';
  if (c.handling === 'ne-pas-traiter') return 'ne-pas-traiter';
  return c.handling === 'escalade' ? 'a-remonter' : 'sav-direct';
}
