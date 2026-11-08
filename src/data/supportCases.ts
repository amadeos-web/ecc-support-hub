import type { CategoryId, ProcedureStep, SupportCase } from './types';
import { freshdeskObservations } from './freshdeskObservations';
import { requestTitles } from './requestTitles';

/**
 * BIBLIOTHÈQUE DES CAS SAV — 25 cas (27 à l'origine ; « utilisation de Circle » et « vidéos » supprimés, les vidéos relèvent du cas « problème technique ») identifiés dans l'historique Freshdesk (01/04 → 02/10/2026).
 *
 * LANGUE : tout ce que lit l'agent est en anglais (interface). Restent en français :
 * `observedRequests` et `keywords` (formulations réelles des membres francophones, utilisées
 * par la recherche) — et les messages au membre (templates.ts).
 *
 * Priorité des sources :
 *  1. les règles métier actuelles d'ECC (elles priment sur l'historique) ;
 *  2. le document officiel « TEMPLATE SAV ECC » (messages validés, rattachés aux cas) ;
 *  3. les pratiques observées dans Freshdesk.
 *
 * RÈGLE ACCÈS (instruction ECC) : le SAV n'invite ni ne réinvite jamais lui-même un membre sur
 * Circle ou Whop. Il collecte prénom / nom / email, transmet à la comptabilité (message interne
 * prêt à copier), suit le dossier, puis confirme au membre une fois l'action réalisée.
 * Les anciennes pratiques contraires sont conservées dans `obsoletePractices`, jamais en procédure.
 *
 * Rien n'est inventé : tout ce qui est ambigu ou contradictoire est « À VALIDER » (`toValidate`).
 */

const FD_SOURCE = 'Freshdesk history (01/04 → 02/10/2026)';
const TPL = 'Template SAV ECC';
const RULE = 'ECC instruction — access & accounting';
const FACT = 'FACTURATION ECC document';

type Input = Partial<SupportCase> & Pick<SupportCase, 'id' | 'title' | 'category' | 'problem' | 'validation'>;

const fdCase = (c: Input): SupportCase => {
  const obs = freshdeskObservations[c.id];
  return {
    shortTitle: requestTitles[c.id] ?? c.title,
    observedRequests: [],
    infoToCollect: [],
    checks: [],
    steps: [],
    doNot: [],
    internalMessageIds: [],
    memberMessages: [],
    actionRequired: '',
    toValidate: [],
    contradictions: [],
    obsoletePractices: [],
    relatedCaseIds: [],
    internalNotes: [],
    keywords: [],
    source: 'freshdesk',
    frequency: obs?.frequency,
    lastObserved: obs?.lastObserved,
    ...c,
    sources: { freshdeskTickets: obs?.tickets ?? [], documents: [FD_SOURCE, ...(c.sources?.documents ?? [])] },
  };
};

const cat = (c: CategoryId) => c;
const sav = (text: string): ProcedureStep => ({ text, owner: 'sav' });

/* ---------- Règle accès : éléments communs ---------- */
/** Libellés d'identité : aussi utilisés par GuidedCase (saisis à l'étape « Identify the member »). */
export const ID_FIRST_NAME = 'First name';
export const ID_LAST_NAME = 'Last name';
export const ID_EMAIL = 'Email';
export const ID_SIGNUP_EMAIL = 'Email used at sign-up';
const IDENTITE = [ID_FIRST_NAME, ID_LAST_NAME, ID_SIGNUP_EMAIL];
/** Le SAV n'invite jamais lui-même : la demande est transmise (le statut membre est déjà contrôlé en amont). */
const ACCES = {
  to: 'gestion-acces' as const,
  why: 'Only the person in charge of access sends or restores Circle / Whop access. Support never does it.',
  infoToTransmit: [ID_FIRST_NAME, ID_LAST_NAME, ID_EMAIL],
  expectedReturn: 'Access sent or restored, then confirmation to the member.',
};
const OBSOLETE_INVITE = 'Until 29/09/2026, support re-sent Circle / Whop invitations itself (97 tickets). This practice is OBSOLETE.';
const RESOLUTION_ACCES = 'The member’s access is (re)granted by the person in charge of access, after their status has been checked.';
const CLOTURE_ACCES = 'The person in charge of access has confirmed the action AND the member has been informed.';

export const supportCases: SupportCase[] = [
  /* =====================  ACCÈS & CONNEXION  ===================== */
  fdCase({
    id: 'cas-acces-v2-non-recu',
    title: 'Has not received V2 access (Circle / Whop)',
    category: cat('acces-connexion'),
    problem: 'The member has completed the steps (KYC, ECC card) but has not received Circle and/or Whop access.',
    observedRequests: ['Formulaire complété, carte reçue, mais aucun accès à Circle ni à Whop', 'Aucune invitation Circle reçue malgré relance', 'Inscrit depuis une semaine sans accès à la V2', 'En attente de validation de ma migration depuis plusieurs jours'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { ...ACCES, why: 'The team in #ecc-acces-payements checks the member’s status, sends the invitation and shares the link.' },
    steps: [
      sav('Check the member’s identity in Didit (find them with their email). Then search their email on Circle (if it appears, the member is on Circle) and on Whop (if it shows “ECC access”, the member is on Whop).'),
      sav('If the member is not on Circle or Whop: post this message in #ecc-acces-payements so the team checks their status and, if everything is in order, invites them.'),
      sav('Once the member has been invited, send them this message with the invitation link.'),
    ],
    memberMessages: [
      { templateId: 'tpl-sav-email-present-whop-circle', moment: 'reponse', note: 'If the member is already on Circle and Whop.' },
      { templateId: 'tpl-sav-reinvitation-whop', moment: 'resolution' },
    ],
    resolution: RESOLUTION_ACCES,
    closingCriteria: CLOTURE_ACCES,
    validation: 'valide',
    relatedCaseIds: ['cas-absent-base-kyc', 'cas-invitation-whop-0usd', 'cas-whop-payant-v1'],
    keywords: ['pas accès', 'pas reçu', 'accès formation', 'invitation', 'circle', 'whop', 'v2', 'migration', 'kyc', 'carte ecc', 'lien', 'inscription', 'comptable', 'comptabilité'],
    sources: { freshdeskTickets: [], documents: [RULE, TPL] },
  }),
  fdCase({
    id: 'cas-invitation-whop-0usd',
    title: 'Whop invitation (0.00 USD invoice) not found or expired',
    category: cat('formation-whop'),
    problem: 'The Whop invitation (0.00 USD invoice) was sent, but the member cannot find it, thinks they have to pay, or let it expire.',
    observedRequests: ['Facture Whop à 0 $ reçue sans savoir que c’est l’invitation', 'Invitation facture 0,00 USD non retrouvée', 'N’a jamais ouvert l’invitation envoyée en avril'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { ...ACCES, why: 'The team in #ecc-acces-payements checks the member’s status, sends the Whop invitation and shares the link.' },
    steps: [
      sav('Check that the member’s KYC is validated in Didit (find them with their email). Then search the email used for the KYC in the Whop database. If the member is not there, post this message in #ecc-acces-payements so the team checks their status and, if everything is in order, invites them.'),
      sav('Once the member has been invited, send them this message with the invitation link.'),
    ],
    memberMessages: [{ templateId: 'tpl-sav-relance-invoice-0-usd', moment: 'resolution' }],
    validation: 'a-valider',
    toValidate: ['Does re-sending an expired invitation also go through the accounting check?'],
    relatedCaseIds: ['cas-acces-v2-non-recu', 'cas-whop-payant-v1'],
    keywords: ['invoice', 'facture 0', '0 usd', '0$', 'invitation', 'expirée', 'spam', 'whop', 'payer'],
    sources: { freshdeskTickets: [], documents: [TPL, RULE] },
  }),
  fdCase({
    id: 'cas-whop-payant-v1',
    title: 'Whop asks to pay / only V1 is visible',
    category: cat('formation-whop'),
    problem: 'The member has access but Whop shows the course as paid (padlock), only shows V1, or cannot find it.',
    observedRequests: ['La formation est verrouillée et Whop me demande de payer alors que j’ai déjà payé', 'Je ne vois que les vidéos de la V1', 'L’onglet Formation ne montre aucune vidéo', 'Le lien depuis Circle renvoie vers un achat sur Whop'],
    infoToCollect: [],
    handling: 'sav',
    steps: [
      sav('Check the member’s identity in Didit, then search their email on Whop and check whether they have access.'),
      sav('Send the validated message.'),
      sav('Attach the Whop guide to the email before sending it (download it from Resources → Whop access guide).'),
    ],
    memberMessages: [{ templateId: 'tpl-sav-email-present-whop-guide', moment: 'reponse' }],
    validation: 'a-valider',
    toValidate: ['Where is the official “Whop guide” to send?'],
    relatedCaseIds: ['cas-acces-actif-mauvais-compte', 'cas-invitation-whop-0usd', 'cas-acces-v2-non-recu'],
    keywords: ['payer', 'payant', 'cadenas', 'v1', 'repayer', 'racheter', 'pas accès formation', 'formation introuvable', 'whop', 'verrouillé', 'achat'],
    sources: { freshdeskTickets: [], documents: [TPL, RULE] },
  }),
  fdCase({
    id: 'cas-acces-actif-mauvais-compte',
    title: 'Access active but not visible (wrong account / two emails)',
    category: cat('acces-connexion'),
    problem: 'Access is active on one email address, but the member logs in with another or mixes up two addresses.',
    observedRequests: ['Email d’inscription Whop différent de celui utilisé sur Circle', 'Deux adresses email différentes (achat vs Circle)', 'Demande de recevoir les accès sur une autre adresse'],
    infoToCollect: [],
    handling: 'sav',
    steps: [sav('Check the member’s identity in Didit (find them with their email). Then search their email on Whop and on Circle and check whether they have access.')],
    memberMessages: [
      { templateId: 'tpl-sav-email-present-whop', moment: 'reponse', note: 'Access active on Whop.' },
      { templateId: 'tpl-sav-email-present-whop-circle', moment: 'reponse', note: 'Access active on Whop AND Circle.' },
    ],
    validation: 'valide',
    relatedCaseIds: ['cas-whop-payant-v1', 'cas-acces-v2-non-recu'],
    keywords: ['email', 'mauvais compte', 'deux adresses', 'changer email', 'adresse', 'connexion', 'accès actif'],
    sources: { freshdeskTickets: [], documents: [TPL] },
  }),
  fdCase({
    id: 'cas-absent-base-kyc',
    title: 'Member missing from the KYC database / former member',
    category: cat('acces-connexion'),
    problem: 'The member (often a former member or inactive for a long time) cannot be found in the KYC database and no longer has access.',
    observedRequests: ['Membre introuvable dans la base, doit refaire le formulaire', 'Ancien membre Business Brothers sans accès', 'Inactif depuis plusieurs mois, veut reprendre la formation'],
    infoToCollect: [],
    handling: 'sav',
    steps: [
      sav('Search the member’s email in Didit. If no validated KYC is found, send this message so they complete the KYC.'),
    ],
    memberMessages: [{ templateId: 'tpl-sav-nouvel-ecosysteme', moment: 'reponse' }],
    validation: 'a-valider',
    toValidate: ['KYC rule: must a former member always redo KYC?'],
    relatedCaseIds: ['cas-acces-v2-non-recu', 'cas-verification-kyc'],
    keywords: ['kyc', 'base', 'introuvable', 'ancien membre', 'business brothers', 'inactif', 'réactivation', 'reprendre', 'formulaire'],
    sources: { freshdeskTickets: [], documents: [TPL, RULE] },
  }),
  fdCase({
    id: 'cas-verification-kyc',
    title: 'KYC verification problem',
    category: cat('acces-connexion'),
    problem: 'The member is stuck during identity verification (loop, error, ID document rejected, selfie).',
    observedRequests: ['Boucle de vérification d’identité', 'Le lien du formulaire KYC renvoie une erreur 404', 'Pièce d’identité refusée par le système', 'Ne veut pas envoyer un selfie non voilé'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { to: 'gestion-acces', why: 'The team in #ecc-acces-payements looks into the KYC blocker.', infoToTransmit: [ID_FIRST_NAME, ID_LAST_NAME, ID_EMAIL], expectedReturn: 'KYC unblocked or instructions for the member.' },
    steps: [
      sav('Check the member’s identity in Didit (find them with their email). Then post this message in #ecc-acces-payements so the team looks into the KYC blocker.'),
      sav('Then send this message to the member.'),
    ],
    memberMessages: [{ templateId: 'tpl-sav-kyc-bloque', moment: 'reponse' }],
    validation: 'a-valider',
    toValidate: ['Can support validate a KYC manually? (done in #395)', 'Which exceptions are accepted (printed photo of the ID, veil with face visible, KYC in a relative’s name)?'],
    relatedCaseIds: ['cas-absent-base-kyc', 'cas-acces-v2-non-recu'],
    keywords: ['kyc', 'vérification', 'identité', 'boucle', 'selfie', 'voile', 'pièce d’identité', 'passeport', 'erreur 404', 'bloqué'],
  }),
  fdCase({
    id: 'cas-desabonnement-accidentel',
    title: 'Accidental unsubscribe or exit from Whop',
    category: cat('formation-whop'),
    problem: 'The member clicked by mistake (“Cancel”, exit, unsubscribe) and lost access to the course.',
    observedRequests: ['J’ai cliqué sur « Cancel » par erreur et j’ai perdu l’accès', 'Désabonnement accidentel (clic d’un enfant)', 'Mail « membership canceled » sans action de ma part'],
    infoToCollect: IDENTITE,
    handling: 'escalade',
    escalation: { ...ACCES, why: 'The team in #ecc-acces-payements checks the member’s status and sends the Whop invitation.' },
    steps: [
      sav('Check that the member’s KYC is validated in Didit (find them with their email). Then search the email used for the KYC in the Whop database. If the member is not there, post this message in #ecc-acces-payements so the team checks their status and, if everything is in order, invites them.'),
      sav('Once the member has been invited, send them this message with the invitation link.'),
    ],
    memberMessages: [{ templateId: 'tpl-sav-reinvitation-whop', moment: 'resolution' }],
    resolution: RESOLUTION_ACCES,
    closingCriteria: CLOTURE_ACCES,
    validation: 'valide',
    obsoletePractices: [OBSOLETE_INVITE, 'April 2026: “reactivation depends on an external intervention (Whop)” — a reply from the migration period.'],
    relatedCaseIds: ['cas-acces-v2-non-recu', 'cas-acces-retire-sans-explication'],
    keywords: ['désabonnement', 'cancel', 'annulé', 'sortie', 'clic', 'erreur', 'membership canceled', 'quitté', 'perdu accès'],
    sources: { freshdeskTickets: [], documents: [RULE, TPL] },
  }),
  fdCase({
    id: 'cas-acces-perdu-appareil',
    title: 'Access lost after another device or a trip',
    category: cat('acces-connexion'),
    problem: 'The member loses access after logging in on another device, installing the app or travelling.',
    observedRequests: ['Accès bloqué après connexion sur téléphone puis ordinateur', 'Plus d’accès aux vidéos après un départ en voyage', 'Accès disparu après installation de l’application Whop'],
    infoToCollect: [],
    handling: 'sav',
    steps: [sav('Check the member’s identity in Didit (find them with their email). Then search their email on Whop and check whether they have access.')],
    memberMessages: [{ templateId: 'tpl-sav-plusieurs-appareils', moment: 'reponse' }],
    validation: 'a-valider',
    toValidate: ['Exact cause of the block (automatic Whop detection? expired invitation?) not established.'],
    relatedCaseIds: ['cas-plusieurs-appareils', 'cas-acces-retire-sans-explication'],
    keywords: ['appareil', 'téléphone', 'ordinateur', 'voyage', 'étranger', 'bloqué', 'application', 'perdu accès'],
  }),
  fdCase({
    id: 'cas-acces-retire-sans-explication',
    title: 'Access removed without explanation',
    category: cat('acces-connexion'),
    problem: 'The member no longer has access (membership cancelled, removed, “banned”) without knowing why, while saying they are up to date.',
    observedRequests: ['Retiré de la formation sans explication', 'Mail annonçant l’annulation de mon adhésion', 'Je n’ai plus accès, mes paiements sont à jour'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { ...ACCES, why: 'The team in #ecc-acces-payements checks the member’s status and, if everything is in order, sends a new Whop invitation and shares the link.' },
    steps: [
      sav('Check the member’s identity in Didit (find them with their email). Then post this message in #ecc-acces-payements so the team checks their status and, if everything is in order, invites them again.'),
      sav('Once the team has answered, send the matching message to the member.'),
    ],
    memberMessages: [
      { templateId: 'tpl-sav-reinvitation-whop', moment: 'resolution', note: 'If the team confirms the status is in order and shares the invitation link' },
      { templateId: 'tpl-sav-acces-retire-raison', moment: 'resolution', note: 'If the team says the status is not in order: enter the reason they give' },
    ],
    resolution: RESOLUTION_ACCES,
    closingCriteria: CLOTURE_ACCES,
    validation: 'valide',
    relatedCaseIds: ['cas-defaut-paiement', 'cas-desabonnement-accidentel'],
    keywords: ['retiré', 'annulé', 'adhésion', 'banni', 'plus accès', 'supprimé', 'désactivé'],
    sources: { freshdeskTickets: [], documents: [RULE] },
  }),

  /* =====================  PAIEMENT & STATUT  ===================== */
  fdCase({
    id: 'cas-defaut-paiement',
    title: 'Access suspended for missed payment',
    category: cat('paiement-statut'),
    problem: 'The member’s access is suspended because of a late or failed payment.',
    observedRequests: ['Accès bloqués pour impayé, reliquat réglé', 'Suspendu malgré la régularisation dans le délai', 'Profil désactivé après un paiement en retard'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { to: 'finance', why: 'The team in #ecc-acces-payements checks whether the payment has been received. Once it is confirmed, the member’s status is updated.', infoToTransmit: [ID_FIRST_NAME, ID_LAST_NAME, ID_EMAIL], expectedReturn: 'Payment confirmed as received (status updated) or not.' },
    steps: [
      sav('Check the member’s identity in Didit (find them with their email). Then post this message in #ecc-acces-payements so the team checks whether the payment has been received.'),
      sav('Once the team has answered, send the matching message to the member. If the payment has been made, the member’s status is updated once the team confirms it has been received.'),
    ],
    memberMessages: [
      { templateId: 'tpl-sav-paiement-recu-reactivation', moment: 'resolution', note: 'If the team confirms the payment has been received' },
      { templateId: 'tpl-sav-acces-retires-defaut-paiement', moment: 'resolution', note: 'If the team says the payment has not been received' },
    ],
    validation: 'a-valider',
    toValidate: ['What to reply when a deadline was agreed with an advisor?'],
    contradictions: ['Inconsistent amount: €997 in the automatic message, €1,000 in the support reply (#321).', 'Access “refused until further notice” with no reason, member referred to a manager (#925).', 'Late-payment penalty received right after access was restored (#1217).'],
    relatedCaseIds: ['cas-probleme-echeancier', 'cas-acces-retire-sans-explication'],
    keywords: ['impayé', 'défaut de paiement', 'retard', 'suspendu', 'régulariser', 'mensualité', 'désactivé', 'paiement'],
    sources: { freshdeskTickets: [], documents: [TPL, RULE] },
  }),
  fdCase({
    id: 'cas-probleme-echeancier',
    title: 'Payment or payment-plan problem',
    category: cat('paiement-statut'),
    problem: 'Extra direct debit, payment not recorded, reminder although everything is paid, or request to pay earlier.',
    observedRequests: ['Relances de paiement alors que tout est payé', 'Premier versement non pris en compte, prélèvement supplémentaire', 'Souhaite payer le reste plus tôt que prévu'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { to: 'finance', why: 'The team in #ecc-acces-payements looks into the member’s payment situation.', infoToTransmit: [ID_FIRST_NAME, ID_LAST_NAME, ID_EMAIL], expectedReturn: 'The team checks the member’s payment situation.' },
    steps: [
      sav('Check the member’s identity in Didit (find them with their email). Then post this message in #ecc-acces-payements so the team looks into the member’s payment situation.'),
      sav('Once the team has answered, send the matching message to the member.'),
    ],
    memberMessages: [
      { templateId: 'tpl-sav-paiement-en-ordre', moment: 'resolution', note: 'If the team confirms the status is in order' },
      { templateId: 'tpl-sav-probleme-paiement', moment: 'resolution', note: 'If the team says the status is not in order' },
    ],
    validation: 'valide',
    relatedCaseIds: ['cas-defaut-paiement', 'cas-preuve-virement'],
    keywords: ['prélèvement', 'paiement', 'échéancier', 'relance', 'versement', 'paypal', '4x', 'déjà payé'],
  }),
  fdCase({
    id: 'cas-preuve-virement',
    title: 'Bank transfer proof or confirmation',
    category: cat('paiement-statut'),
    problem: 'The member sends a proof of bank transfer or asks whether their transfer has been received.',
    observedRequests: ['Envoi d’une preuve de premier virement', 'Confirmation de réception d’un virement pour un acompte'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { to: 'finance', why: 'The team in #ecc-acces-payements confirms that the transfer was received and that the member’s status is in order.', infoToTransmit: [ID_FIRST_NAME, ID_LAST_NAME, ID_EMAIL], expectedReturn: 'Confirmation that the transfer was received.' },
    steps: [
      sav('Check the member’s identity in Didit (find them with their email). Then post this message in #ecc-acces-payements so the team checks that the transfer has been received and that the member’s status is in order.'),
      sav('Once the team has confirmed, send this message to the member.'),
    ],
    memberMessages: [{ templateId: 'tpl-sav-virement-recu', moment: 'resolution' }],
    validation: 'valide',
    relatedCaseIds: ['cas-probleme-echeancier'],
    keywords: ['virement', 'preuve', 'acompte', 'reçu', 'banque'],
  }),
  fdCase({
    id: 'cas-date-prelevement',
    title: 'Change the direct debit date',
    category: cat('paiement-statut'),
    problem: 'The member wants to change or postpone the date of their direct debit.',
    observedRequests: ['Modifier la date de prélèvement au 1er du mois', 'Reporter la prochaine échéance'],
    handling: 'sav',
    steps: [sav('Send the validated message.')],
    memberMessages: [{ templateId: 'tpl-sav-date-prelevement', moment: 'reponse' }],
    validation: 'valide',
    toValidate: ['Postponement request due to financial difficulties (#1030): same reply? Not documented.'],
    relatedCaseIds: ['cas-defaut-paiement'],
    keywords: ['prélèvement', 'date', 'reporter', 'échéance', 'mensualité'],
    sources: { freshdeskTickets: [], documents: [TPL] },
  }),
  fdCase({
    id: 'cas-remboursement',
    title: 'Refund request',
    category: cat('paiement-statut'),
    problem: 'The member asks for a full or partial refund.',
    observedRequests: ['Remboursement pour non-conformité de la prestation', 'Remboursement après difficultés à suivre la formation', 'Conteste les CGV communiquées'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { to: 'finance', why: 'The team reviews refund requests and decides. Support only passes on the information.', infoToTransmit: [ID_FIRST_NAME, ID_LAST_NAME, ID_EMAIL], expectedReturn: 'The team reviews the request.' },
    steps: [
      sav('Check the member’s identity in Didit (find them with their email). Then post this message in #ecc-acces-payements to pass on the refund request. You only share the information: you do not decide.'),
      sav('Send the validated message.'),
    ],
    memberMessages: [{ templateId: 'tpl-sav-remboursement', moment: 'reponse' }],
    validation: 'a-valider',
    toValidate: ['Who decides on refunds?'],
    contradictions: ['Refusals based on the terms (CGU / CGV) (#140, #1102, #1249) but a refund was paid by bank transfer (#361).', 'A member claims others were refunded in a similar situation (#140).', 'A settlement agreement is mentioned (#1319).'],
    keywords: ['remboursement', 'rembourser', 'rétractation', 'cgv', 'cgu', 'argent', 'litige'],
  }),

  /* =====================  FORMATION / WHOP  ===================== */
  fdCase({
    id: 'cas-video-telephone',
    title: 'Cannot watch on phone',
    category: cat('formation-whop'),
    problem: 'The member has access on a computer but not on their phone.',
    observedRequests: ['Accès sur ordinateur mais pas sur téléphone', 'L’app Whop redirige vers Safari et les modules ne s’affichent pas'],
    handling: 'sav',
    steps: [sav('Send the validated message (right address, log out / log back in, other browser or app).')],
    memberMessages: [{ templateId: 'tpl-sav-visionnage-telephone', moment: 'reponse' }],
    validation: 'valide',
    relatedCaseIds: ['cas-plusieurs-appareils'],
    keywords: ['téléphone', 'mobile', 'iphone', 'android', 'app', 'safari', 'vidéo'],
    sources: { freshdeskTickets: [], documents: [TPL] },
  }),
  fdCase({
    id: 'cas-plusieurs-appareils',
    title: 'Several devices / simultaneous logins',
    category: cat('formation-whop'),
    problem: 'The member asks whether they can log in from several devices, change computer or travel.',
    observedRequests: ['Puis-je alterner entre téléphone et ordinateur ?', 'Je change d’ordinateur, est-ce un problème ?', 'Je pars en voyage, pourrai-je me connecter ?'],
    handling: 'sav',
    steps: [sav('Send the validated message (one person = one subscription, several devices OK for personal use).')],
    memberMessages: [{ templateId: 'tpl-sav-plusieurs-appareils', moment: 'reponse' }],
    validation: 'valide',
    relatedCaseIds: ['cas-acces-perdu-appareil', 'cas-double-acces'],
    keywords: ['appareils', 'plusieurs', 'simultané', 'ordinateur', 'tablette', 'voyage', 'flag', 'ban'],
    sources: { freshdeskTickets: [], documents: [TPL] },
  }),

  /* =====================  COMMUNAUTÉ / CIRCLE  ===================== */
  fdCase({
    id: 'cas-niveau-advanced',
    title: 'Access to the Advanced level',
    category: cat('communaute-circle'),
    problem: 'The member asks for access to the Advanced level (or cannot get it after posting).',
    observedRequests: ['Demande d’accès au niveau Advanced avec justificatifs de CA', 'Post publié il y a deux semaines, toujours pas d’accès'],
    handling: 'sav',
    steps: [sav('Send the validated message (post their results in the results channel).')],
    memberMessages: [{ templateId: 'tpl-sav-niveau-advanced', moment: 'reponse' }],
    validation: 'valide',
    toValidate: ['What to do when the post was published long ago and the level was not granted?'],
    keywords: ['advanced', 'avancé', '100k', 'résultats', 'chiffre d’affaires', 'channel', 'call'],
    sources: { freshdeskTickets: [], documents: [TPL] },
  }),

  /* =====================  COMPTE MEMBRE  ===================== */
  fdCase({
    id: 'cas-double-acces',
    title: 'Second access / business partner / account sharing',
    category: cat('compte-membre'),
    problem: 'The member wants a second access for a business partner, a spouse or a relative.',
    observedRequests: ['Accès séparés pour deux associés', 'Accès pour mon épouse qui suit aussi la formation', 'Partager mon compte avec un associé'],
    handling: 'sav',
    steps: [sav('Send the validated message (personal access, a single email address).')],
    memberMessages: [{ templateId: 'tpl-sav-double-acces-associe', moment: 'reponse' }],
    validation: 'a-valider',
    toValidate: ['Official position on sharing one account (without simultaneous logins).', 'What to reply to former V1 members who cite an agreement for couples / partners?'],
    contradictions: ['In April, support allowed sharing one account (2 devices max, never at the same time: #121, #127, #149), whereas the validated template requires strictly personal access.', 'A member cites a verbal agreement for V1 couples / partners (#184); another says partners kept two accesses (#542).'],
    relatedCaseIds: ['cas-plusieurs-appareils'],
    keywords: ['associé', 'double accès', 'deux accès', 'partage', 'épouse', 'conjoint', 'frère', 'second compte', 'nominatif'],
    sources: { freshdeskTickets: [], documents: [TPL] },
  }),
  fdCase({
    id: 'cas-membre-non-identifie',
    title: 'Unidentified member / vague message',
    category: cat('compte-membre'),
    problem: 'The message is empty, vague or does not make it possible to identify the member.',
    observedRequests: ['« Bonjour » sans autre précision', 'Je suis complètement perdu', 'Ticket composé uniquement d’une capture d’écran'],
    infoToCollect: [],
    handling: 'sav',
    steps: [sav('When you cannot identify the member, send them this message to get the information you need. Once they reply, identify them and handle their problem with the matching case.')],
    memberMessages: [{ templateId: 'tpl-sav-client-non-identifie', moment: 'reponse' }],
    validation: 'valide',
    keywords: ['vague', 'perdu', 'informations', 'identifier', 'bonjour', 'aide'],
    sources: { freshdeskTickets: [], documents: [TPL] },
  }),

  /* =====================  FACTURES & DOCUMENTS  ===================== */
  fdCase({
    id: 'cas-facture',
    title: 'Invoice request',
    category: cat('factures-documents'),
    problem: 'The member asks for the invoice for their course (often for their accounting).',
    observedRequests: ['Facture pour ma comptabilité / mon bilan', 'Facture au nom de ma société'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { to: 'finance', why: 'The team in #ecc-acces-payements confirms the member’s status and the amount paid, which goes on the invoice.', infoToTransmit: [ID_FIRST_NAME, ID_LAST_NAME, ID_EMAIL], expectedReturn: 'Status and amount paid.' },
    steps: [
      sav('Check the member’s identity in Didit (find them with their email). Then post this message in #ecc-acces-payements to get the member’s status and the amount they have paid.'),
      sav('Send this message to the member to get the details needed for the invoice.'),
      sav('Once you have the team’s answer and the member’s details, generate the invoice (use the amount confirmed by the team), then send the PDF to the member.'),
    ],
    memberMessages: [{ templateId: 'tpl-sav-infos-facture', moment: 'reponse' }],
    validation: 'valide',
    relatedCaseIds: ['cas-devis', 'cas-attestation'],
    keywords: ['facture', 'comptabilité', 'société', 'tva', 'siret', 'bilan', 'reçu'],
    sources: { freshdeskTickets: [], documents: [FACT] },
  }),
  fdCase({
    id: 'cas-devis',
    title: 'Quote request (funding)',
    category: cat('factures-documents'),
    problem: 'The member or a prospect asks for a quote, for example for funding by an employer.',
    observedRequests: ['Devis pour un financement par mon ancien employeur'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { to: 'finance', why: 'The team in #ecc-acces-payements confirms the member’s status and the amount they are supposed to pay, which goes on the quote.', infoToTransmit: [ID_FIRST_NAME, ID_LAST_NAME, ID_EMAIL], expectedReturn: 'Status and amount to pay.' },
    steps: [
      sav('Check the member’s identity in Didit (find them with their email). Then post this message in #ecc-acces-payements to get the member’s status and the amount they are supposed to pay.'),
      sav('Send this message to the member to get the details needed for the quote.'),
      sav('Once you have the team’s answer and the member’s details, generate the quote (use the amount confirmed by the team), then send the PDF to the member.'),
    ],
    memberMessages: [{ templateId: 'tpl-sav-infos-devis', moment: 'reponse' }],
    validation: 'valide',
    relatedCaseIds: ['cas-facture', 'cas-prospect'],
    keywords: ['devis', 'financement', 'employeur', 'opco', 'france travail'],
  }),
  fdCase({
    id: 'cas-attestation',
    title: 'Training certificate request',
    category: cat('factures-documents'),
    problem: 'The member asks for a certificate (e.g. for a France Travail file).',
    observedRequests: ['Attestation avec nom, intitulé, dates et montant pour France Travail'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { to: 'finance', why: 'The team in #ecc-acces-payements confirms the member’s status, the amount paid and the date they became a member, which go on the certificate.', infoToTransmit: [ID_FIRST_NAME, ID_LAST_NAME, ID_EMAIL], expectedReturn: 'Status, amount paid and member-since date.' },
    steps: [
      sav('Check the member’s identity in Didit (find them with their email). Then post this message in #ecc-acces-payements to get the member’s status, the amount they have paid and the date they became a member.'),
      sav('Send this message to the member to get the details needed for the certificate.'),
      sav('Once you have the team’s answer and the member’s details, generate the certificate (use the amount and date confirmed by the team), then send the PDF to the member.'),
    ],
    memberMessages: [{ templateId: 'tpl-sav-infos-attestation', moment: 'reponse' }],
    validation: 'valide',
    relatedCaseIds: ['cas-facture'],
    keywords: ['attestation', 'france travail', 'justificatif', 'certificat', 'formation suivie'],
  }),

  /* =====================  TECHNIQUE / AUTRE  ===================== */
  fdCase({
    id: 'cas-autre-bug',
    title: 'Technical problem on our platforms',
    category: cat('technique'),
    problem: 'Any technical problem the member runs into on our platforms (tools, member area, Circle, Whop…).',
    observedRequests: ['L’outil BB Spy ne fonctionne pas avec mes identifiants', 'Message d’erreur à la connexion depuis mon Mac'],
    infoToCollect: [],
    handling: 'sav',
    steps: [sav('Send the validated message (asks for the tool / page, a description of the problem and a screenshot).')],
    memberMessages: [{ templateId: 'tpl-sav-autre-bug', moment: 'reponse' }],
    validation: 'a-valider',
    toValidate: ['Where to forward the details once received (tech team contact).'],
    keywords: ['bug', 'erreur', 'bb spy', 'outil', 'connexion', 'espace membre', 'technique'],
  }),
  fdCase({
    id: 'cas-hors-sujet',
    title: 'Off-topic request',
    category: cat('autre'),
    problem: 'The request is not a support matter (business advice, wrong recipient, personal question).',
    observedRequests: ['Comment démarrer un business avec la Chine ?', 'Aide pour trouver une niche', 'Message envoyé au mauvais destinataire'],
    handling: 'sav',
    steps: [sav('Send the validated message.')],
    memberMessages: [{ templateId: 'tpl-sav-hors-sujet', moment: 'reponse' }],
    validation: 'valide',
    relatedCaseIds: ['cas-prospect'],
    keywords: ['hors sujet', 'conseil', 'business', 'niche', 'question', 'coaching', 'fournisseur'],
    sources: { freshdeskTickets: [], documents: [TPL] },
  }),
  fdCase({
    id: 'cas-prospect',
    title: 'Prospect / sales enquiry',
    category: cat('autre'),
    problem: 'Someone who has not bought asks for information, a price or a sales call.',
    observedRequests: ['Prix de la formation pour être formé', 'Souhaite planifier un entretien commercial'],
    infoToCollect: [],
    handling: 'escalade',
    escalation: { to: 'commercial', why: 'The team contacts the person on WhatsApp.', infoToTransmit: [ID_FIRST_NAME, ID_LAST_NAME, ID_EMAIL, 'WhatsApp number (with country code)'], expectedReturn: 'The team gets in touch.' },
    steps: [sav('Send the validated message (asks for their WhatsApp number).'), sav('Once you have the WhatsApp number: share the lead in the Slack channel #ecc-acces-payements.'), { text: 'Contact the person on WhatsApp.', owner: 'commercial' }],
    memberMessages: [{ templateId: 'tpl-sav-prospect', moment: 'reponse' }],
    validation: 'a-valider',
    toValidate: ['Who is the sales contact?'],
    relatedCaseIds: ['cas-hors-sujet', 'cas-devis'],
    keywords: ['prospect', 'prix', 'tarif', 'acheter', 'rendez-vous', 'commercial', 'entretien', 'informations'],
  }),
];
