import type { InternalMessage } from './types';

/**
 * Messages internes (à destination d'un autre membre de l'équipe).
 * `int-compta-acces` : contrôle du statut membre, étape commune à tous les cas.
 * Toutes leurs variables sont obligatoires : la copie est bloquée tant qu'elles sont vides.
 * `title` est lu par l'agent (anglais) ; `message` part chez la comptabilité (français, inchangé).
 */
export const internalMessages: InternalMessage[] = [
  {
    id: 'int-compta-acces',
    to: 'comptabilite',
    title: 'Member status check',
    message: `Bonjour, peux-tu vérifier le statut de paiement de {{prenom}} {{nom}} stp ?
Email : {{email}}`,
    variables: ['prenom', 'nom', 'email'],
    validation: 'valide',
    source: 'instruction-ecc',
  },
];

export const getInternalMessage = (id?: string) => internalMessages.find((m) => m.id === id);
