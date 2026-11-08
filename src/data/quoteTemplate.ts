/**
 * DEVIS (prise en charge par un organisme financeur) — libellés imprimés (français) et valeurs préremplies.
 * Modèle fourni par ECC : émetteur ECOM CAPITAL CLUB LLC, coordonnées bancaires Wise.
 * Les blocs préremplis restent modifiables dans le formulaire, document par document.
 */
export const quoteTemplate = {
  title: 'DEVIS',
  subtitle: 'ACCOMPAGNEMENT ECOMMERCE CAPITAL CLUB',
  recipientLabel: 'DESTINATAIRE :',
  funderLabel: 'ORGANISME FINANCEUR :',
  issuerLabel: 'ÉMETTEUR :',
  issuedOnLabel: 'Émis le :',
  columns: { description: 'DESCRIPTION', price: 'PRIX', amount: 'MONTANT' },
  totalLabel: 'Total',
  totalHTLabel: 'Total HT',
  vatRateLabel: 'TVA(%)',
  vatAmountLabel: 'Montant TVA',
  fundingTitle: 'Prise en charge du devis',
  /** {montant} et {financeur} sont remplacés à l'impression. */
  fundingText: 'Le montant de {montant} est destiné à être financé par {financeur}, indiqué ci-dessus en qualité d’organisme financeur.',
  vatMention: 'TVA : selon régime applicable',
  grandTotalLabel: 'MONTANT TOTAL DU DEVIS',
  bankTitle: 'COORDONNÉES BANCAIRES POUR LE RÈGLEMENT',
  bankLabels: { holder: 'TITULAIRE', iban: 'IBAN', bic: 'SWIFT / BIC', bank: 'BANQUE' },
  footerLeft: 'ECOM CAPITAL CLUB',
  /** {beneficiaire} = première ligne du bloc destinataire. */
  footerRight: 'Devis établi au bénéfice de {beneficiaire}',

  /* Valeurs préremplies (modifiables dans le formulaire). */
  defaultIssuer: 'ECOM CAPITAL CLUB LLC\n1405 DEWAR DR., ROCK SPRINGS, WY 82901',
  defaultDescription: 'Formation d’accompagnement ECC',
  defaultBank: {
    holder: 'ECOM CAPITAL CLUB LLC',
    iban: 'BE40 9059 5434 9863',
    bic: 'TRWIBEB1XXX',
    bank: 'Wise, Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium',
  },
} as const;
