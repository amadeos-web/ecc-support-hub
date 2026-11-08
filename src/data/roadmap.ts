/**
 * Libellés du parcours guidé (titres formulés comme des actions). Les règles métier restent dans
 * supportCases.ts / internalMessages.ts / templates.ts ; ici uniquement les intitulés des étapes.
 * Interface agent : en anglais.
 */
export const roadmapLabels = {
  identify: {
    title: 'Identify the member',
    cta: 'Continue',
    hint: 'Find the member in Didit with their email address.',
    kycHint: 'Find the member in Didit with their email address: their name and KYC status are there.',
    label: 'Checklist',
    items: [
      'Get the member’s email address from their message.',
      'Search this email in Didit.',
      'Note the member’s first and last name shown in Didit.',
    ],
  },
  kyc: {
    label: 'KYC status in Didit',
    ok: 'KYC validated',
    ko: 'KYC not validated / no KYC',
    change: 'Change the answer',
    koTitle: 'Wait for the KYC to be completed',
    koHint: 'Do not grant access, re-invite or restore anything until the KYC is validated.',
  },
  blocks: {
    ask: 'Ask the member',
    check: 'Check',
    branches: 'Depending on the situation',
    showReply: 'Show the reply',
    to: 'To',
    when: 'When',
    what: 'Send',
    doNot: 'Do not',
    prenom: 'Member’s first name',
  },
  slack: {
    channel: '#ecc-acces-payements',
    channelUrl: 'https://sendexfulfillment.enterprise.slack.com/archives/C095ZG422MS',
    whatsapp: 'WhatsApp number',
    copy: 'Copy the message',
    needWhatsapp: 'Fill in first: WhatsApp number',
    needEmail: 'Fill in first: Email',
  },
} as const;
