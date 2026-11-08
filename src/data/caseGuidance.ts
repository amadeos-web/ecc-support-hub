/**
 * Compléments de PRÉSENTATION des fiches « Traiter une demande ».
 * Tout est repris des étapes, vérifications et messages existants des cas (supportCases.ts) :
 *  - `branches`   : « Selon la situation » (si … → …) ;
 *  - `stepNotes`  : mention sobre sous une étape (index 0 = 1re étape) quand un responsable doit trancher ;
 *  - `escalateWhen` : moment où il faut escalader.
 * Les points inconnus restent dans `toValidate` ; seules les consignes d'approbation (« validation d'un responsable nécessaire ») sont affichées.
 */
export interface CaseGuidance {
  /** `messageId` : réponse à proposer ; `caseId` : cas à ouvrir pour cette situation. */
  branches?: { when: string; then: string; messageId?: string; caseId?: string }[];
  stepNotes?: Record<number, string>;
  escalateWhen?: string;
}

/** Cas sans étape « Identify the member » : la personne n'est pas (encore) un membre identifié qui demande de l'aide. */
export const statusCheckExempt = new Set(['cas-prospect', 'cas-hors-sujet', 'cas-membre-non-identifie', 'cas-autre-bug', 'cas-double-acces', 'cas-niveau-advanced', 'cas-plusieurs-appareils', 'cas-video-telephone', 'cas-desabonnement-accidentel', 'cas-whop-payant-v1', 'cas-invitation-whop-0usd', 'cas-remboursement', 'cas-date-prelevement', 'cas-preuve-virement', 'cas-probleme-echeancier', 'cas-defaut-paiement', 'cas-acces-retire-sans-explication', 'cas-acces-v2-non-recu', 'cas-acces-actif-mauvais-compte', 'cas-absent-base-kyc', 'cas-verification-kyc', 'cas-acces-perdu-appareil', 'cas-facture', 'cas-devis', 'cas-attestation']);

/**
 * Cas où le KYC doit être vérifié AVANT toute action qui donne ou rétablit un accès :
 * invitation / réinvitation, accès retiré ou perdu, accès Circle / Whop, changement d'adresse email.
 * Règle : pas de KYC = pas d'accès. Non ajouté aux cas sans accès à donner (vidéos, documents, paiements…).
 */
export const kycRequiredIds = new Set<string>([]);

/** Cas documenté pour un membre absent du KYC (envoi du lien KYC). */
export const KYC_CASE_ID = 'cas-absent-base-kyc';

/** Cas du référentiel à appliquer quand le membre n'est pas en règle. */
export const NOT_IN_ORDER_CASE_ID = 'cas-defaut-paiement';

export const caseGuidance: Record<string, CaseGuidance> = {
  'cas-whop-payant-v1': {
    branches: [
      { when: 'The member has access on Whop', then: 'Send the message below, with the Whop guide attached to the email.' },
      {
        when: 'The member has no access on Whop',
        then: 'Post the status message in #ecc-acces-payements and follow the same procedure as this case (the team checks and invites the member, then you send them the invitation link):',
        caseId: 'cas-desabonnement-accidentel',
      },
    ],
  },
  'cas-acces-v2-non-recu': {
    branches: [
      { when: 'The email appears on Circle AND shows “ECC access” on Whop', then: 'Everything is in order on our side: send this reply. No need to go further.', messageId: 'tpl-sav-email-present-whop-circle' },
      { when: 'The email is missing on Circle or does not show “ECC access” on Whop', then: 'Go to the next step: ask the team to check and invite the member.' },
    ],
  },
  'cas-acces-actif-mauvais-compte': {
    branches: [
      { when: 'Access is active on Whop', then: 'Send this reply.', messageId: 'tpl-sav-email-present-whop' },
      { when: 'Access is active on Whop AND Circle', then: 'Send this reply.', messageId: 'tpl-sav-email-present-whop-circle' },
      { when: 'The member has no access on that email', then: 'Follow the same procedure as this case (the team checks and invites the member, then you send them the invitation link):', caseId: 'cas-desabonnement-accidentel' },
    ],
  },
  'cas-absent-base-kyc': {
    branches: [{ when: 'The member’s KYC is validated', then: 'Follow the same procedure to get them invited (the team checks and invites them, then you send them the invitation link):', caseId: 'cas-desabonnement-accidentel' }],
  },
  'cas-acces-perdu-appareil': {
    branches: [
      { when: 'The member has access on Whop', then: 'Send the message below.' },
      { when: 'The member has no access on Whop', then: 'Follow the same procedure as this case (the team checks and invites the member, then you send them the invitation link):', caseId: 'cas-desabonnement-accidentel' },
    ],
  },
  'cas-prospect': {
    escalateWhen: 'As soon as you have their WhatsApp number.',
  },
};
