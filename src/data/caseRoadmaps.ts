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
  | { kind: 'link'; page: 'documents'; param?: string; label: string };

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
    step('Vérifier la situation du membre', ASK, CHECKS, { kind: 'branches' }),
    step('Transmettre la demande', steps(0), ESC, DONOT),
    step('Suivre le dossier', steps(1, 2)),
    step('Répondre au membre', steps(3), msg('tpl-sav-pas-acces-v2-whop')),
  ],
  'cas-invitation-whop-0usd': [
    step('Vérifier la situation du membre', CHECKS),
    step('Expliquer l’invitation au membre', steps(0, 1), msg('tpl-sav-relance-invoice-0-usd')),
    step('Transmettre la demande si l’invitation a expiré', steps(2, 3), ESC, DONOT),
    step('Répondre au membre', steps(4), msg('tpl-sav-pas-acces-v2-whop')),
  ],
  'cas-whop-payant-v1': [
    step('Vérifier la situation du membre', ASK, CHECKS),
    step('Guider le membre', steps(0, 1), msg('tpl-sav-email-present-whop')),
    step('Transmettre la demande si le problème persiste', steps(2, 3), ESC, DONOT),
    step('Confirmer au membre', steps(4)),
  ],
  'cas-acces-actif-mauvais-compte': [
    step('Vérifier l’adresse email du membre', ASK, CHECKS, steps(0)),
    step('Traiter selon la situation', { kind: 'branches' }, steps(1, 2), DONOT),
    step('Répondre au membre', msg('tpl-sav-email-present-whop'), msg('tpl-sav-email-present-whop-circle')),
  ],
  'cas-absent-base-kyc': [
    step('Vérifier la présence du membre dans la base KYC', CHECKS),
    step('Envoyer le lien KYC au membre', steps(0), msg('tpl-sav-nouvel-ecosysteme')),
    step('Transmettre la demande une fois le KYC complété', steps(1, 2), ESC, DONOT),
    step('Confirmer au membre', steps(3)),
  ],
  'cas-verification-kyc': [
    step('Récupérer les informations du blocage', ASK, steps(0)),
    step('Transmettre à l’équipe technique', steps(1, 2), ESC),
    step('Informer le membre', steps(3)),
  ],
  'cas-desabonnement-accidentel': [
    step('Transmettre la demande', steps(0, 1), ESC, DONOT),
    step('Suivre le dossier', steps(2)),
    step('Répondre au membre', steps(3), msg('tpl-sav-client-non-identifie'), msg('tpl-sav-pas-acces-v2-whop')),
  ],
  'cas-acces-perdu-appareil': [
    step('Répondre au membre sur l’usage multi-appareils', ASK, steps(0), msg('tpl-sav-plusieurs-appareils')),
    step('Transmettre la demande', steps(1, 2), ESC, DONOT),
    step('Suivre le dossier', steps(3)),
    step('Confirmer au membre', steps(4)),
  ],
  'cas-acces-retire-sans-explication': [
    step('Transmettre la demande', steps(0, 1), ESC, DONOT),
    step('Suivre le dossier', steps(2)),
    step('Répondre au membre', steps(3), msg('tpl-sav-client-non-identifie')),
  ],
  'cas-defaut-paiement': [
    step('Informer le membre de la suspension', steps(0), msg('tpl-sav-acces-retires-defaut-paiement')),
    step('Transmettre la demande', steps(1, 2), ESC, DONOT),
    step('Suivre le dossier', steps(3)),
    step('Confirmer au membre', steps(4)),
  ],
  'cas-probleme-echeancier': [
    step('Récupérer les justificatifs de paiement', ASK, steps(0)),
    step('Transmettre à l’équipe finance', steps(1, 2), ESC),
    step('Confirmer au membre', steps(3)),
  ],
  'cas-preuve-virement': [
    step('Récupérer la preuve de virement', ASK, steps(0)),
    step('Transmettre à l’équipe finance', steps(1, 2), ESC),
    step('Informer le membre', steps(3)),
  ],
  'cas-date-prelevement': [step('Répondre au membre', steps(0), DONOT, msg('tpl-sav-date-prelevement'))],
  'cas-remboursement': [
    step('Recueillir le motif de la demande', ASK),
    step('Transmettre la demande', steps(0, 1), DONOT),
  ],
  'cas-lecture-videos': [
    step('Faire tester le membre', ASK, CHECKS, steps(0)),
    step('Traiter selon l’incident', steps(1, 2), msg('tpl-sav-probleme-technique'), ESC),
    step('Suivre la correction', steps(3)),
    step('Informer le membre', steps(4)),
  ],
  'cas-video-telephone': [
    step('Répondre au membre', steps(0), msg('tpl-sav-visionnage-telephone')),
    step('Demander des précisions si le problème persiste', steps(1)),
  ],
  'cas-plusieurs-appareils': [step('Répondre au membre', steps(0), msg('tpl-sav-plusieurs-appareils'))],
  'cas-niveau-advanced': [
    step('Répondre au membre', steps(0), msg('tpl-sav-niveau-advanced')),
    step('Suivre l’attribution du niveau', steps(1), DONOT),
  ],
  'cas-utilisation-circle': [],
  'cas-double-acces': [step('Répondre au membre', steps(0), DONOT, msg('tpl-sav-double-acces-associe'))],
  'cas-membre-non-identifie': [
    step('Demander les informations au membre', ASK, steps(0), msg('tpl-sav-client-non-identifie')),
    step('Ouvrir le cas correspondant', steps(1)),
  ],
  'cas-facture': [
    step('Récupérer les informations de facturation', ASK, steps(0)),
    step('Vérifier le règlement du client', CHECKS, steps(1)),
    step('Générer la facture', steps(2), { kind: 'link', page: 'documents', param: 'facture', label: 'Ouvrir le générateur de facture' }),
    step('Envoyer la facture au membre', steps(3), DONOT),
  ],
  'cas-devis': [
    step('Demander les informations nécessaires', ASK, steps(0)),
    step('Transmettre à l’équipe commerciale', steps(1, 2), ESC),
  ],
  'cas-attestation': [
    step('Récupérer les informations demandées', ASK, steps(0)),
    step('Faire valider par l’équipe finance', steps(1, 2), ESC),
    step('Générer et envoyer l’attestation', steps(3), { kind: 'link', page: 'documents', param: 'attestation', label: 'Ouvrir le générateur d’attestation' }),
  ],
  'cas-autre-bug': [step('Récupérer les informations du problème', ASK)],
  'cas-hors-sujet': [step('Répondre au membre', steps(0), msg('tpl-sav-hors-sujet'))],
  'cas-prospect': [
    step('Demander les coordonnées', ASK, steps(0)),
    step('Transmettre au contact commercial', steps(1, 2), ESC),
  ],
};

/** Roadmap automatique pour un cas sans définition : vérifier → traiter → répondre. */
export function defaultRoadmap(c: SupportCase): RoadmapStepDef[] {
  const defs: RoadmapStepDef[] = [];
  defs.push(step('Vérifier la situation du membre', ASK, CHECKS, { kind: 'branches' }));
  if (c.steps.length) defs.push(step('Traiter la demande', { kind: 'steps', idx: c.steps.map((_, i) => i) }, ESC, DONOT));
  const msgs = c.memberMessages.map((m) => msg(m.templateId));
  if (msgs.length) defs.push(step('Répondre au membre', ...msgs));
  return defs;
}

export const roadmapFor = (c: SupportCase): RoadmapStepDef[] => caseRoadmaps[c.id] ?? defaultRoadmap(c);
