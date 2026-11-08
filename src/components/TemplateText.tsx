import { parseTemplate, variableLabel, type TemplateVars } from '../lib/templateEngine';

/**
 * Aperçu d'un message : variables renseignées surlignées en vert, variables obligatoires
 * manquantes signalées en orange (« [Lien de l'invoice] »).
 */
export function TemplateText({ body, vars, className = '', optionalVars, bare = false }: { body: string; vars: TemplateVars; className?: string; optionalVars?: readonly string[]; /** Sans cadre (paragraphe d'une vue bilingue). */ bare?: boolean }) {
  const segments = parseTemplate(body, vars, optionalVars);
  return (
    <pre className={`${bare ? 'template-para' : 'template-text'} ${className}`}>
      {segments.map((s, i) =>
        s.kind === 'text' ? (
          <span key={i}>{s.value}</span>
        ) : s.filled ? (
          <mark key={i} className="var-filled" title={`Variable: ${s.name}`}>
            {s.value}
          </mark>
        ) : s.optional ? null : (
          <mark key={i} className="var-missing" title="Fill in before copying">
            [{variableLabel(s.name)}]
          </mark>
        ),
      )}
    </pre>
  );
}
