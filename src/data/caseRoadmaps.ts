import type { SupportCase } from './types';

/**
 * ROADMAPS DES CAS SAV : l'ordre et les titres d'étapes (verbes d'action) de chaque cas.
 * Aucune règle métier ici : chaque bloc PIOCHE dans les données existantes du cas
 * (infoToCollect, checks, steps, doNot, escalation, memberMessages, branches).
 * Une étape sans contenu n'est jamais affichée. Les étapes communes (identifier le membre,
 * vérifier son statut, indiquer le retour) sont ajoutées par le moteur pour les cas concernés.
 */
export type RoadmapBlock =
  | { kind: 'ask' } // informations à demander au membre (hors prénom / nom / email, déjà saisis)
  | { kind: 'checks' } // points à contrôler
  | { kind: 'branches' } // « Selon la situation »
  | { kind: 'steps'; idx: number[] } // étapes du process (indices dans `steps` du cas)
  | { kind: 'escalation' } // à qui / quoi transmettre
  | { kind: 'doNot' } // à ne pas faire
  | { kind: 'message'; id: string } // réponse au membre (template existant)
  | { kind: 'link'; page: 'documents'; param?: string; label: string }
  /** Message Slack pour #ecc-acces-payements : « lead » (nouveau prospect) ou « status » (vérifier le statut puis inviter). */
  | { kind: 'slack'; variant: 'lead' | 'status' | 'refund' | 'transfer' | 'payment' | 'suspended' | 'removed' | 'kyc' | 'invoice' | 'quote' | 'certificate' };

export interface RoadmapStepDef {
  title: string;
  blocks: RoadmapBlock[];
}

const steps = (...idx: number[]): RoadmapBlock => ({ kind: 'steps', idx });
const msg = (id: string): RoadmapBlock => ({ kind: 'message', id });
const ASK: RoadmapBlock = { kind: 'ask' };
const CHECKS: RoadmapBlock = { kind: 'checks' };
const ESC: RoadmapBlock = { kind: 'escalation' };
const DONOT: RoadmapBlock = { kind: 'doNot' };
const step = (title: string, ...blocks: RoadmapBlock[]): RoadmapStepDef => ({ title, blocks });

export const caseRoadmaps: Record<string, RoadmapStepDef[]> = {
  'cas-acces-v2-non-recu': [
    step('Check whether the member is already on Circle and Whop', steps(0), { kind: 'branches' }),
    step('If they are not: ask the team to check and invite them', steps(1), ESC, { kind: 'slack', variant: 'status' }),
    step('Reply to the member', steps(2), msg('tpl-sav-reinvitation-whop')),
  ],
  'cas-invitation-whop-0usd': [
    step('Ask the team to check and invite the member', steps(0), ESC, { kind: 'slack', variant: 'status' }),
    step('Reply to the member', steps(1), msg('tpl-sav-relance-invoice-0-usd')),
  ],
  'cas-whop-payant-v1': [step('Reply to the member', steps(0), { kind: 'branches' }, steps(1), msg('tpl-sav-email-present-whop-guide'), steps(2))],
  'cas-acces-actif-mauvais-compte': [step('Reply to the member', steps(0), { kind: 'branches' })],
  'cas-absent-base-kyc': [step('Reply to the member', steps(0), msg('tpl-sav-nouvel-ecosysteme'), { kind: 'branches' })],
  'cas-verification-kyc': [
    step('Share the KYC blocker on Slack', steps(0), ESC, { kind: 'slack', variant: 'kyc' }),
    step('Reply to the member', steps(1), msg('tpl-sav-kyc-bloque')),
  ],
  'cas-desabonnement-accidentel': [
    step('Ask the team to check and invite the member', steps(0), ESC, { kind: 'slack', variant: 'status' }),
    step('Reply to the member', steps(1), msg('tpl-sav-reinvitation-whop')),
  ],
  'cas-acces-perdu-appareil': [step('Reply to the member', steps(0), { kind: 'branches' }, msg('tpl-sav-plusieurs-appareils'))],
  'cas-acces-retire-sans-explication': [
    step('Ask the team to check and invite the member', steps(0), ESC, { kind: 'slack', variant: 'removed' }),
    step('Reply to the member', steps(1), msg('tpl-sav-reinvitation-whop'), msg('tpl-sav-acces-retire-raison')),
  ],
  'cas-defaut-paiement': [
    step('Ask the team to check the payment', steps(0), ESC, { kind: 'slack', variant: 'suspended' }),
    step('Reply to the member', steps(1), msg('tpl-sav-paiement-recu-reactivation'), msg('tpl-sav-acces-retires-defaut-paiement')),
  ],
  'cas-probleme-echeancier': [
    step('Share the payment problem on Slack', steps(0), ESC, { kind: 'slack', variant: 'payment' }),
    step('Reply to the member', steps(1), msg('tpl-sav-paiement-en-ordre'), msg('tpl-sav-probleme-paiement')),
  ],
  'cas-preuve-virement': [
    step('Ask the team to confirm the transfer', steps(0), ESC, { kind: 'slack', variant: 'transfer' }),
    step('Reply to the member', steps(1), msg('tpl-sav-virement-recu')),
  ],
  'cas-date-prelevement': [step('Reply to the member', steps(0), msg('tpl-sav-date-prelevement'))],
  'cas-remboursement': [
    step('Share the refund request on Slack', steps(0), ESC, { kind: 'slack', variant: 'refund' }),
    step('Reply to the member', steps(1), msg('tpl-sav-remboursement')),
  ],
  'cas-video-telephone': [step('Reply to the member', steps(0), msg('tpl-sav-visionnage-telephone'))],
  'cas-plusieurs-appareils': [step('Reply to the member', steps(0), msg('tpl-sav-plusieurs-appareils'))],
  'cas-niveau-advanced': [step('Reply to the member', steps(0), msg('tpl-sav-niveau-advanced'))],
  'cas-double-acces': [step('Reply to the member', steps(0), msg('tpl-sav-double-acces-associe'))],
  'cas-membre-non-identifie': [step('Ask the member for the information', steps(0), msg('tpl-sav-client-non-identifie'))],
  'cas-facture': [
    step('Ask the team for the status and amount', steps(0), ESC, { kind: 'slack', variant: 'invoice' }),
    step('Ask the member for their details', steps(1), msg('tpl-sav-infos-facture')),
    step('Generate and send the invoice', steps(2), { kind: 'link', page: 'documents', param: 'facture', label: 'Open the invoice generator' }),
  ],
  'cas-devis': [
    step('Ask the team for the status and amount', steps(0), ESC, { kind: 'slack', variant: 'quote' }),
    step('Ask the member for their details', steps(1), msg('tpl-sav-infos-devis')),
    step('Generate and send the quote', steps(2), { kind: 'link', page: 'documents', param: 'devis', label: 'Open the quote generator' }),
  ],
  'cas-attestation': [
    step('Ask the team for the status and amount', steps(0), ESC, { kind: 'slack', variant: 'certificate' }),
    step('Ask the member for their details', steps(1), msg('tpl-sav-infos-attestation')),
    step('Generate and send the certificate', steps(2), { kind: 'link', page: 'documents', param: 'attestation', label: 'Open the certificate generator' }),
  ],
  'cas-autre-bug': [step('Reply to the member', steps(0), msg('tpl-sav-autre-bug'))],
  'cas-hors-sujet': [step('Reply to the member', steps(0), msg('tpl-sav-hors-sujet'))],
  'cas-prospect': [
    step('Reply to the person', steps(0), msg('tpl-sav-prospect')),
    step('Share the lead on Slack', steps(1, 2), ESC, { kind: 'slack', variant: 'lead' }),
  ],
};

/** Roadmap automatique pour un cas sans définition : vérifier → traiter → répondre. */
export function defaultRoadmap(c: SupportCase): RoadmapStepDef[] {
  const defs: RoadmapStepDef[] = [];
  defs.push(step('Check the member’s situation', ASK, CHECKS, { kind: 'branches' }));
  if (c.steps.length) defs.push(step('Handle the request', { kind: 'steps', idx: c.steps.map((_, i) => i) }, ESC, DONOT));
  const msgs = c.memberMessages.map((m) => msg(m.templateId));
  if (msgs.length) defs.push(step('Reply to the member', ...msgs));
  return defs;
}

export const roadmapFor = (c: SupportCase): RoadmapStepDef[] => caseRoadmaps[c.id] ?? defaultRoadmap(c);
