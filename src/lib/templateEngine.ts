import type { TemplateVariable } from '../data/types';

export const TEMPLATE_VARIABLES: { key: TemplateVariable; label: string; placeholder: string }[] = [
  { key: 'prenom', label: 'Prénom du membre', placeholder: 'Thomas' },
  { key: 'nom', label: 'Nom', placeholder: 'Martin' },
  { key: 'email', label: 'Email', placeholder: 'thomas@exemple.com' },
  { key: 'formation', label: 'Formation', placeholder: 'Nom de la formation' },
  { key: 'montant', label: 'Montant', placeholder: '1 997 €' },
  { key: 'date', label: 'Date', placeholder: '03/10/2026' },
  { key: 'numero_facture', label: 'N° de facture', placeholder: 'ECC0174' },
  { key: 'lien_invoice', label: "Lien de l'invoice", placeholder: 'https://…' },
];

export const variableLabel = (key: string) => TEMPLATE_VARIABLES.find((v) => v.key === key)?.label ?? key;

/**
 * Variables facultatives : si elles sont vides, elles disparaissent proprement du message
 * (« Bonjour {{prenom}} 👋 » → « Bonjour 👋 »). Toutes les autres sont obligatoires.
 */
export const OPTIONAL_VARIABLES: readonly string[] = ['prenom'];

export type TemplateVars = Partial<Record<string, string>>;

export type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'var'; name: string; value: string; filled: boolean; optional: boolean };

const VAR_RE = /\{\{\s*([a-zA-Z_]+)\s*\}\}/g;

/** Découpe un template en morceaux texte / variable (pour l'aperçu surligné). */
export function parseTemplate(body: string, vars: TemplateVars, optionalVars: readonly string[] = OPTIONAL_VARIABLES): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const m of body.matchAll(VAR_RE)) {
    const index = m.index ?? 0;
    if (index > last) segments.push({ kind: 'text', value: body.slice(last, index) });
    const name = m[1];
    const value = vars[name]?.trim() ?? '';
    const optional = optionalVars.includes(name);
    segments.push({ kind: 'var', name, value: value || (optional ? '' : m[0]), filled: value.length > 0, optional });
    last = index + m[0].length;
  }
  if (last < body.length) segments.push({ kind: 'text', value: body.slice(last) });
  // Variable facultative vide : on retire l'espace qui la précédait (« Bonjour  👋 » → « Bonjour 👋 »).
  segments.forEach((s, i) => {
    if (s.kind === 'var' && s.optional && !s.filled) {
      const prev = segments[i - 1];
      if (prev?.kind === 'text') prev.value = prev.value.replace(/ $/, '');
    }
  });
  return segments;
}

/** Message final : variables renseignées remplacées ; variables obligatoires vides laissées en {{nom}}. */
export function renderTemplate(body: string, vars: TemplateVars, optionalVars: readonly string[] = OPTIONAL_VARIABLES): string {
  return parseTemplate(body, vars, optionalVars)
    .map((s) => s.value)
    .join('');
}

/** Variables présentes dans un template (dans l'ordre, sans doublon). */
export function templateVariables(body: string): string[] {
  return [...new Set([...body.matchAll(VAR_RE)].map((m) => m[1]))];
}

/** Variables obligatoires présentes dans le template mais non renseignées. */
export function missingVariables(body: string, vars: TemplateVars, optionalVars: readonly string[] = OPTIONAL_VARIABLES): string[] {
  const missing = parseTemplate(body, vars, optionalVars)
    .filter((s): s is Extract<Segment, { kind: 'var' }> => s.kind === 'var' && !s.filled && !s.optional)
    .map((s) => s.name);
  return [...new Set(missing)];
}
