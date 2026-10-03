import type { InternalMessage } from './types';

/**
 * Messages internes (à destination d'un autre membre de l'équipe).
 * `int-compta-acces` : contrôle du statut membre, étape commune à tous les cas (voir StatusGate).
 * Toutes leurs variables sont obligatoires : la copie est bloquée tant qu'elles sont vides.
 */
export const internalMessages: InternalMessage[] = [
  {
    id: 'int-compta-acces',
    to: 'comptabilite',
    title: 'Vérification du statut du membre',
    message: `Bonjour, peux-tu vérifier le statut de paiement de {{prenom}} {{nom}} stp ?
Email : {{email}}`,
    variables: ['prenom', 'nom', 'email'],
    validation: 'valide',
    source: 'instruction-ecc',
  },
];

export const getInternalMessage = (id?: string) => internalMessages.find((m) => m.id === id);
