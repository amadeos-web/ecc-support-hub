/**
 * Libellés du parcours guidé (titres formulés comme des actions). Les règles métier restent dans
 * supportCases.ts / internalMessages.ts / templates.ts ; ici uniquement les intitulés des étapes.
 */
export const roadmapLabels = {
  identify: { title: 'Identifier le membre', cta: 'Continuer' },
  status: {
    title: 'Vérifier le statut du membre',
    hint: 'Vérification interne : le membre n’en est pas informé.',
    copy: 'Copier le message',
    cta: 'J’ai reçu le retour',
  },
  result: {
    title: 'Quel est le retour de la comptabilité ?',
    ok: 'En règle',
    ko: 'Pas en règle',
    change: 'Changer la réponse',
    koTitle: 'Traiter un membre pas en règle',
    koHint: 'Ne poursuis pas le traitement normal.',
  },
  verify: { title: 'Vérifier la situation du membre', ask: 'À demander au membre', check: 'À contrôler', branches: 'Selon la situation', cta: 'Continuer', showReply: 'Afficher la réponse' },
  transmit: { title: 'Transmettre la demande', to: 'À qui', what: 'À transmettre', doNot: 'À ne pas faire', cta: 'Demande transmise' },
  follow: { title: 'Suivre le dossier', cta: 'Action confirmée' },
  reply: { title: 'Répondre au membre' },
  end: { title: 'Terminé', again: 'Traiter une autre demande' },
} as const;
