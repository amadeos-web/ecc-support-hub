/**
 * Intitulés affichés à l'agent SAV (liste « Traiter une demande », en-tête de fiche) :
 * formulés du point de vue de la demande reçue. Présentation uniquement : `title` reste l'intitulé interne.
 */
export const requestTitles: Record<string, string> = {
  'cas-acces-v2-non-recu': 'Le membre indique qu’il n’a pas reçu ses accès',
  'cas-invitation-whop-0usd': 'Le membre indique qu’il ne trouve pas son invitation Whop',
  'cas-whop-payant-v1': 'Le membre indique que Whop lui demande de payer ou n’affiche que la V1',
  'cas-acces-actif-mauvais-compte': 'Le membre indique que ses accès n’apparaissent pas',
  'cas-absent-base-kyc': 'Le membre indique qu’il n’a plus d’accès et reste introuvable (ancien membre)',
  'cas-verification-kyc': 'Le membre indique qu’il est bloqué pendant la vérification d’identité (KYC)',
  'cas-desabonnement-accidentel': 'Le membre indique qu’il s’est désabonné ou a quitté Whop par erreur',
  'cas-acces-perdu-appareil': 'Le membre indique qu’il n’a plus accès depuis un changement d’appareil',
  'cas-acces-retire-sans-explication': 'Le membre indique qu’on lui a retiré son accès sans explication',
  'cas-defaut-paiement': 'Le membre indique que ses accès sont suspendus pour un paiement',
  'cas-probleme-echeancier': 'Le membre indique avoir un problème avec son paiement ou son échéancier',
  'cas-preuve-virement': 'Le membre indique avoir effectué son virement',
  'cas-date-prelevement': 'Le membre demande à modifier sa date de prélèvement',
  'cas-remboursement': 'Le membre demande un remboursement',
  'cas-lecture-videos': 'Le membre indique que ses vidéos ne se lancent pas',
  'cas-video-telephone': 'Le membre indique qu’il ne peut pas regarder la formation sur son téléphone',
  'cas-plusieurs-appareils': 'Le membre demande s’il peut se connecter depuis plusieurs appareils',
  'cas-niveau-advanced': 'Le membre demande l’accès au niveau Advanced',
  'cas-utilisation-circle': 'Le membre pose une question sur l’utilisation de Circle',
  'cas-double-acces': 'Le membre demande un second accès pour un associé ou un proche',
  'cas-membre-non-identifie': 'Le membre envoie un message vague : impossible de l’identifier',
  'cas-facture': 'Le membre demande sa facture',
  'cas-devis': 'Le membre demande un devis',
  'cas-attestation': 'Le membre demande une attestation de formation',
  'cas-autre-bug': 'Le membre indique un problème technique (hors vidéos)',
  'cas-hors-sujet': 'Le membre pose une question qui ne relève pas du support',
  'cas-prospect': 'Une personne sans achat demande des informations ou un prix',
};
