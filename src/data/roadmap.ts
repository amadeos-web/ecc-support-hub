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
    title: 'Indiquer le retour de la comptabilité',
    ok: 'En règle',
    ko: 'Pas en règle',
    change: 'Changer la réponse',
    koHint: 'Ne poursuis pas le traitement normal.',
  },
  treat: {
    title: 'Traiter le problème d’accès',
    verify: 'Vérifier la situation',
    ask: 'À demander au membre',
    check: 'À contrôler',
    branches: 'Selon la situation',
    showReply: 'Afficher la réponse',
    transmit: 'Transmettre la demande',
    to: 'À qui',
    what: 'À transmettre',
    doNot: 'À ne pas faire',
    follow: 'Suivre le dossier',
    cta: 'Continuer',
  },
  reply: { title: 'Répondre au membre', cta: 'Réponse envoyée' },
  end: { title: 'Terminé', again: 'Traiter une autre demande' },
} as const;
