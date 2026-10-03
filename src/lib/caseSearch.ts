import { getCategory, getTemplate, type SupportCase } from '../data';
import { normalize } from './search';

/** Texte de recherche d'un cas : titres, problème, formulations, mots-clés, catégorie, messages. */
export function caseHaystack(c: SupportCase): string {
  return normalize(
    [
      c.title,
      c.shortTitle,
      c.problem,
      ...c.observedRequests,
      ...c.keywords,
      getCategory(c.category)?.label ?? '',
      ...c.memberMessages.map((m) => getTemplate(m.templateId)?.sourceMessage ?? ''),
    ].join(' '),
  );
}

/** Petits mots ignorés pour le classement (« pas accès formation » → « accès », « formation »). */
const STOPWORDS = new Set(['pas', 'de', 'la', 'le', 'les', 'un', 'une', 'des', 'du', 'a', 'au', 'aux', 'et', 'ou', 'mon', 'ma', 'mes', 'je', 'j', 'l', 'd', 'sur', 'pour', 'avec', 'sans', 'ne', 'n', 'plus', 'il', 'elle', 'est', 'en', 'me', 'm']);

/**
 * Tous les mots significatifs tapés doivent apparaître.
 * Classement : expression exacte dans les mots-clés > mots du titre > mots-clés > reste du texte.
 */
export function searchCases(cases: SupportCase[], query: string): SupportCase[] {
  const q = normalize(query).trim();
  const all = q.split(/[\s'’]+/).filter(Boolean);
  const tokens = all.filter((t) => !STOPWORDS.has(t));
  const useTokens = tokens.length ? tokens : all;
  if (!useTokens.length) return cases;
  return cases
    .map((c) => ({ c, hay: caseHaystack(c), title: normalize(`${c.shortTitle} ${c.title}`), keys: c.keywords.map(normalize) }))
    .filter(({ hay }) => useTokens.every((t) => hay.includes(t)))
    .map(({ c, title, keys }) => {
      let score = keys.some((k) => k === q || (q.length > 3 && k.includes(q))) ? 20 : 0;
      for (const t of useTokens) score += (title.includes(t) ? 6 : keys.some((k) => k.includes(t)) ? 3 : 1) + (keys.includes(t) ? 4 : 0);
      return { c, score: score + (c.frequency ?? 0) / 1000 };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ c }) => c);
}
