/**
 * Préparation déterministe des messages du document « TEMPLATE SAV ECC ».
 * Le texte source n'est pas réécrit : seules deux transformations sont appliquées.
 *  1. Salutation personnalisée : « Salut 👋 » / « Bonjour 👋 » → « Bonjour {{prenom}} 👋 »,
 *     « Bonjour, » → « Bonjour {{prenom}}, ».
 *  2. Mentions à compléter du document (ex. « LIEN DE L'INVOICE ») → variables obligatoires.
 */
import type { TemplateVariable } from '../data/types';
import { OPTIONAL_VARIABLES, templateVariables } from './templateEngine';

/** Mentions à compléter repérées dans le document source. */
export const SOURCE_PLACEHOLDERS: { pattern: RegExp; variable: TemplateVariable }[] = [
  { pattern: /LIEN DE L['’]INVOICE/g, variable: 'lien_invoice' },
  { pattern: /RAISON DU RETRAIT/g, variable: 'raison_retrait' },
];

const GREETING_RE = /^(Salut|Bonjour)[ \t]*(👋)?[ \t]*(,)?[ \t]*$/u;

export function personalizeGreeting(message: string): string {
  const [first, ...rest] = message.split('\n');
  const m = first.match(GREETING_RE);
  if (!m) return message;
  const greeting = m[2] ? 'Bonjour {{prenom}} 👋' : m[3] ? 'Bonjour {{prenom}},' : 'Bonjour {{prenom}}';
  return [greeting, ...rest].join('\n');
}

/** Traduction anglaise (information de l'agent) : même personnalisation que le message français. */
export function prepareEnglish(english: string): string {
  const [first, ...rest] = english.trim().split('\n');
  const m = first.match(/^Hello[ \t]*(👋)?[ \t]*(,)?[ \t]*$/u);
  const greeting = !m ? first : m[1] ? 'Hello {{prenom}} 👋' : m[2] ? 'Hello {{prenom}},' : 'Hello {{prenom}}';
  return [greeting, ...rest].join('\n').replace(/INVOICE LINK/g, '{{lien_invoice}}').replace(/REASON FOR REMOVAL/g, '{{raison_retrait}}');
}

export function prepareSavTemplate(sourceMessage: string) {
  let message = personalizeGreeting(sourceMessage.trim());
  for (const { pattern, variable } of SOURCE_PLACEHOLDERS) message = message.replace(pattern, `{{${variable}}}`);
  const variables = templateVariables(message) as TemplateVariable[];
  const requiredVariables = variables.filter((v) => !OPTIONAL_VARIABLES.includes(v));
  return { message, variables, requiredVariables };
}
