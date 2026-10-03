import type { InternalMessage } from './types';

/**
 * Messages internes (à destination d'un autre membre de l'équipe).
 * Toutes leurs variables sont obligatoires : la copie est bloquée tant qu'elles sont vides.
 */
export const internalMessages: InternalMessage[] = [
  {
    id: 'int-compta-acces',
    to: 'comptabilite',
    title: 'Vérification du statut de paiement (problème d’accès)',
    message: `Bonjour, peux-tu vérifier le statut de paiement de {{prenom}} {{nom}} stp ?
Email : {{email}}
Il/elle rencontre actuellement un problème d'accès.`,
    variables: ['prenom', 'nom', 'email'],
    validation: 'a-valider',
    note: 'Wording proposé par ECC, à améliorer.',
    source: 'instruction-ecc',
  },
];

export const getInternalMessage = (id?: string) => internalMessages.find((m) => m.id === id);
