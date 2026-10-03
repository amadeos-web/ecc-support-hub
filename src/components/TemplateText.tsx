import { parseTemplate, variableLabel, type TemplateVars } from '../lib/templateEngine';

/**
 * Aperçu d'un message : variables renseignées surlignées en vert, variables obligatoires
 * manquantes signalées en orange (« [Lien de l'invoice] »).
 */
export function TemplateText({ body, vars, className = '', optionalVars }: { body: string; vars: TemplateVars; className?: string; optionalVars?: readonly string[] }) {
  const segments = parseTemplate(body, vars, optionalVars);
  return (
    <pre className={`template-text ${className}`}>
      {segments.map((s, i) =>
        s.kind === 'text' ? (
          <span key={i}>{s.value}</span>
        ) : s.filled ? (
          <mark key={i} className="var-filled" title={`Variable : ${s.name}`}>
            {s.value}
          </mark>
        ) : s.optional ? null : (
          <mark key={i} className="var-missing" title="À renseigner avant de copier">
            [{variableLabel(s.name)}]
          </mark>
        ),
      )}
    </pre>
  );
}
