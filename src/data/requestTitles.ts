/**
 * Intitulés affichés à l'agent SAV (liste « Traiter une demande », en-tête de fiche) :
 * formulés du point de vue de la demande reçue. Présentation uniquement : `title` reste l'intitulé interne.
 * Interface agent : en anglais.
 */
export const requestTitles: Record<string, string> = {
  'cas-acces-v2-non-recu': 'The member says they have not received their access',
  'cas-invitation-whop-0usd': 'The member says they cannot find their Whop invitation',
  'cas-whop-payant-v1': 'The member says Whop asks them to pay or only shows V1',
  'cas-acces-actif-mauvais-compte': 'The member says their access does not show up',
  'cas-absent-base-kyc': 'The member says they lost access and cannot be found (former member)',
  'cas-verification-kyc': 'The member says they are stuck during identity verification (KYC)',
  'cas-desabonnement-accidentel': 'The member says they unsubscribed or left Whop by mistake',
  'cas-acces-perdu-appareil': 'The member says they lost access after changing device',
  'cas-acces-retire-sans-explication': 'The member says their access was removed without explanation',
  'cas-defaut-paiement': 'The member says their access is suspended because of a payment',
  'cas-probleme-echeancier': 'The member says they have a problem with their payment or payment plan',
  'cas-preuve-virement': 'The member says they have made their bank transfer',
  'cas-date-prelevement': 'The member asks to change their direct debit date',
  'cas-remboursement': 'The member asks for a refund',
  'cas-video-telephone': 'The member says they cannot watch the course on their phone',
  'cas-plusieurs-appareils': 'The member asks whether they can log in from several devices',
  'cas-niveau-advanced': 'The member asks for access to the Advanced level',
  'cas-double-acces': 'The member asks for a second access for a partner or relative',
  'cas-membre-non-identifie': 'Insufficient Information to identify the member or understand their issue',
  'cas-facture': 'The member asks for their invoice',
  'cas-devis': 'The member asks for a quote',
  'cas-attestation': 'The member asks for a training certificate',
  'cas-autre-bug': 'The member reports a technical problem on our platforms',
  'cas-hors-sujet': 'The member asks something that is not a support matter',
  'cas-prospect': 'Someone who has not bought asks for information or a price',
};
