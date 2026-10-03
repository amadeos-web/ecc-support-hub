/**
 * Textes du modèle de facture ECC (repris du modèle Canva « FACTURATION ECC »).
 * Modifiables ici sans toucher au code du PDF.
 */
export const invoiceTemplate = {
  title: 'FACTURE',
  recipientLabel: 'DESTINATAIRE :',
  issuerLabel: 'EMETTEUR :',
  issuedOnLabel: 'Délivré le :',
  columns: { description: 'DESCRIPTION', price: 'PRIX', amount: 'MONTANT' },
  summary: {
    /** Libellé du total hors taxes ; « Total HT » est utilisé dès qu'un taux est > 0. */
    total: 'Total',
    totalWithVat: 'Total HT',
    vatRate: 'TVA(%)',
    /**
     * 3e ligne : montant de la TVA. Le modèle historique l'intitule « Taux » ; on utilise
     * « Montant TVA » pour éviter la confusion avec le taux. Remettre 'Taux' si souhaité.
     */
    vatAmount: 'Montant TVA',
  },
  grandTotalLabel: 'TOTAL MONTANT PERÇU',
  defaultDescription: 'Formation d’accompagnement Ecommerce Capital Club',
  /** Préfixes proposés pour les numéros (ECC0174, BB0173…). « Autre » permet un préfixe libre. */
  prefixes: ['ECC', 'BB'],
  paymentConfirmation: 'Je confirme que le règlement intégral du client a bien été reçu.',
};
