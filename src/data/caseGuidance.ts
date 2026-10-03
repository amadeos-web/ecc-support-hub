/**
 * Compléments de PRÉSENTATION des fiches « Traiter une demande ».
 * Tout est repris des étapes, vérifications et messages existants des cas (supportCases.ts) :
 *  - `branches`   : « Selon la situation » (si … → …) ;
 *  - `stepNotes`  : mention sobre sous une étape (index 0 = 1re étape) quand un responsable doit trancher ;
 *  - `escalateWhen` : moment où il faut escalader.
 * Les points inconnus restent dans `toValidate` ; seules les consignes d'approbation (« validation d'un responsable nécessaire ») sont affichées.
 */
export interface CaseGuidance {
  branches?: { when: string; then: string }[];
  stepNotes?: Record<number, string>;
  escalateWhen?: string;
}

const MANAGER = 'validation d’un responsable nécessaire';

/** Cas sans contrôle du statut membre (la personne n'est pas un membre qui demande de l'aide). */
export const statusCheckExempt = new Set(['cas-prospect', 'cas-hors-sujet']);

/** Cas du référentiel à appliquer quand le membre n'est pas en règle. */
export const NOT_IN_ORDER_CASE_ID = 'cas-defaut-paiement';

export const caseGuidance: Record<string, CaseGuidance> = {
  'cas-acces-v2-non-recu': {
    escalateWhen: 'Une fois le statut du membre confirmé en règle.',
    branches: [
      { when: 'Il manque des informations (email, KYC, accès actuels)', then: 'Demander les informations au membre avec la réponse « membre non identifié ».' },
      { when: 'Le membre n’a pas complété le KYC', then: 'Ouvrir le cas « Le membre indique qu’il n’a plus d’accès et reste introuvable (ancien membre) ».' },
    ],
  },
  'cas-invitation-whop-0usd': {
    escalateWhen: 'Uniquement si l’invitation a expiré.',
    branches: [
      { when: 'L’invitation n’a pas expiré', then: 'Expliquer que la facture à 0,00 USD est l’invitation (rien à payer) et demander de vérifier les spams / promotions.' },
      { when: 'L’invitation a expiré', then: 'Transmettre la demande à la personne compétente pour les accès, puis confirmer au membre une fois la nouvelle invitation envoyée.' },
    ],
  },
  'cas-whop-payant-v1': {
    escalateWhen: 'Si les vérifications (whop.com, même email, ordinateur, pas de VPN) ne règlent pas le problème.',
    branches: [
      { when: 'L’accès est actif sur l’adresse email du membre', then: 'Envoyer la réponse « email présent sur Whop ».' },
      { when: 'Ça ne fonctionne toujours pas après les vérifications', then: 'Transmettre la demande à la personne compétente pour les accès.' },
    ],
  },
  'cas-acces-actif-mauvais-compte': {
    branches: [
      { when: 'Les accès sont actifs sur l’adresse du membre', then: 'Envoyer la réponse validée (bon compte, déconnexion / reconnexion, autre navigateur).' },
      { when: 'Le membre veut utiliser une autre adresse', then: 'Transmettre la demande. Ne pas transférer l’accès toi-même.' },
    ],
  },
  'cas-absent-base-kyc': {
    escalateWhen: 'Une fois le KYC complété par le membre.',
    stepNotes: { 0: `Un ancien membre doit-il toujours refaire le KYC : ${MANAGER}.` },
  },
  'cas-verification-kyc': {
    escalateWhen: 'Dès que le membre est bloqué : transmettre avec l’étape bloquante et une capture.',
    stepNotes: { 2: `Validation manuelle du KYC et exceptions (pièce, visage, nom d’un proche) : ${MANAGER}.` },
  },
  'cas-desabonnement-accidentel': { escalateWhen: 'Une fois le statut du membre confirmé en règle.' },
  'cas-acces-perdu-appareil': { escalateWhen: 'Une fois le statut du membre confirmé en règle.' },
  'cas-acces-retire-sans-explication': { escalateWhen: 'Une fois le statut du membre confirmé en règle.' },
  'cas-defaut-paiement': {
    escalateWhen: 'Une fois le statut du membre confirmé en règle.',
    stepNotes: { 0: `Moyen de régularisation et délai déjà convenu avec un conseiller : ${MANAGER}.` },
  },
  'cas-probleme-echeancier': {
    escalateWhen: 'Dès que tu as le détail des paiements et une preuve.',
  },
  'cas-preuve-virement': {
    escalateWhen: 'Dès que tu as la preuve de virement.',
  },
  'cas-date-prelevement': {
    stepNotes: { 0: `Demande de report pour difficultés financières : ${MANAGER}.` },
  },
  'cas-remboursement': {
    escalateWhen: 'Immédiatement, sans répondre sur le fond.',
    stepNotes: { 1: `Qui décide et quoi répondre au membre : ${MANAGER}.` },
  },
  'cas-lecture-videos': {
    escalateWhen: 'Si l’incident n’est pas déjà connu.',
    branches: [
      { when: 'L’incident est déjà connu', then: 'Envoyer la réponse « problème technique ».' },
      { when: 'L’incident n’est pas connu', then: 'Transmettre à l’équipe technique avec la vidéo et le code d’erreur.' },
    ],
  },
  'cas-video-telephone': {
    branches: [{ when: 'Le problème persiste après la réponse', then: 'Demander plus de détails au membre.' }],
  },
  'cas-niveau-advanced': {
    stepNotes: { 1: `Post publié depuis longtemps sans attribution : ${MANAGER}.` },
  },
  'cas-double-acces': {
    stepNotes: { 0: `Partage d’un même compte ou accord invoqué par un ancien membre V1 : ${MANAGER}.` },
  },
  'cas-devis': {
    escalateWhen: 'Dès que tu as un numéro de téléphone.',
  },
  'cas-attestation': {
    escalateWhen: 'Avant de générer l’attestation : faire valider les informations.',
    stepNotes: { 2: `Mentions autorisées sur l’attestation : ${MANAGER}.` },
  },
  'cas-prospect': {
    escalateWhen: 'Dès que tu as un numéro de téléphone.',
  },
};
