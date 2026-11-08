/**
 * ATTESTATION DE SUIVI DE FORMATION — même mise en page que la facture (modèle ECC fourni) :
 * en-tête avec sous-titre, destinataire avec « Membre ECC depuis le… », tableau et total perçu.
 */
export const attestationTemplate = {
  title: 'ATTESTATION DE SUIVI DE FORMATION',
  subtitle: 'ACCOMPAGNEMENT ECOMMERCE CAPITAL CLUB',
  titleSize: 16,
  memberSinceLabel: 'Membre ECC depuis le',
  defaultDescription: 'Formation d’accompagnement ECC',
} as const;
