import type { CaseStatus, Category, CategoryId, Handling, MessageMoment, SupportCase, ValidationStatus } from './types';

/**
 * Grandes catégories affichées en cartes sur « Traiter une demande ».
 * PROVISOIRES : la liste définitive sera fixée par l'analyse de l'historique Freshdesk.
 */
export const categories: Category[] = [
  { id: 'acces-connexion', label: 'Accès & connexion', icon: '🔑', hint: 'Pas reçu ses accès, ne peut pas se connecter, nouvel écosystème' },
  { id: 'paiement-statut', label: 'Paiement & statut membre', icon: '💳', hint: 'Prélèvement, défaut de paiement, statut à vérifier' },
  { id: 'formation-whop', label: 'Formation / Whop', icon: '🎓', hint: 'Accès Whop, invoice 0 USD, visionnage des vidéos' },
  { id: 'communaute-circle', label: 'Communauté / Circle', icon: '💬', hint: 'Circle, niveau Advanced, espaces de la communauté' },
  { id: 'factures-documents', label: 'Factures & documents', icon: '🧾', hint: 'Facture, devis, attestation' },
  { id: 'compte-membre', label: 'Compte membre', icon: '👤', hint: 'Identification, partage d’accès, informations du compte' },
  { id: 'technique', label: 'Problème technique', icon: '🛠️', hint: 'Bug, vidéo qui ne se lit pas, plateforme' },
  { id: 'autre', label: 'Autre demande', icon: '📨', hint: 'Hors sujet, demandes non répertoriées' },
];

export const categoryLabel = (id: CategoryId): string => categories.find((c) => c.id === id)?.label ?? id;
export const getCategory = (id?: string) => categories.find((c) => c.id === id);

export const handlingInfo: Record<Handling, { icon: string; label: string; short: string; description: string }> = {
  sav: { icon: '🟢', label: 'SAV — tu peux traiter directement', short: 'SAV direct', description: 'Tu as tout ce qu’il faut pour répondre et clôturer.' },
  escalade: { icon: '🟠', label: 'À REMONTER — intervention d’une autre personne nécessaire', short: 'À remonter', description: 'Tu collectes les informations, tu transmets, tu suis, puis tu confirmes au membre.' },
  'ne-pas-traiter': { icon: '🔴', label: 'NE PAS TRAITER DIRECTEMENT', short: 'Ne pas traiter', description: 'Ne réponds pas sur le fond : transmets immédiatement.' },
};

export const validationInfo: Record<ValidationStatus, { label: string; description: string }> = {
  valide: { label: 'Validé', description: 'Procédure documentée par ECC.' },
  'a-valider': { label: 'À valider', description: 'À confirmer humainement avant d’être considéré comme officiel.' },
  demo: { label: 'Démo', description: 'Exemple fictif pour construire l’interface.' },
};

export const momentLabel: Record<MessageMoment, string> = {
  reponse: 'Réponse au membre',
  pendant: 'Pendant le traitement',
  resolution: 'Une fois le problème résolu',
};

export const statusInfo: Record<CaseStatus, { icon: string; label: string; description: string }> = {
  'sav-direct': { icon: '🟢', label: 'SAV DIRECT', description: 'Tu traites toi-même, du début à la fin.' },
  'a-remonter': { icon: '🟠', label: 'À REMONTER', description: 'Une autre personne doit intervenir : tu transmets, tu suis, tu confirmes au membre.' },
  'a-valider': { icon: '⚠️', label: 'À VALIDER', description: 'Procédure observée mais pas encore validée officiellement par ECC.' },
  'ne-pas-traiter': { icon: '🔴', label: 'NE PAS TRAITER', description: 'Ne réponds pas sur le fond : transmets.' },
};

/** Statut principal d'un cas. */
export function caseStatus(c: Pick<SupportCase, 'validation' | 'handling'>): CaseStatus {
  if (c.validation === 'a-valider' || !c.handling) return 'a-valider';
  if (c.handling === 'ne-pas-traiter') return 'ne-pas-traiter';
  return c.handling === 'escalade' ? 'a-remonter' : 'sav-direct';
}
