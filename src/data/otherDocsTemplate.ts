/** Libellés du devis et de l'attestation (mêmes conventions que invoiceTemplate.ts). */
export const quoteTemplate = {
  title: 'DEVIS',
  recipientLabel: 'CLIENT :',
  issuerLabel: 'EMETTEUR :',
  dateLabel: 'Date :',
  columns: { description: 'DESCRIPTION', price: 'PRIX HT', amount: 'MONTANT HT' },
  totalHT: 'Total HT',
  grandTotal: 'TOTAL TTC',
  validUntil: 'Valable jusqu’au',
  signature: 'Bon pour accord — date et signature du client :',
} as const;

export const attestationTemplate = {
  title: 'ATTESTATION',
  heading: 'Attestation de suivi de formation',
  startLabel: 'Date de début',
  endLabel: 'Date de fin',
  endOngoing: 'en cours',
  statusLabel: 'Statut du suivi',
  closing: 'Cette attestation est délivrée pour servir et valoir ce que de droit.',
  madeOn: 'Fait le',
} as const;
