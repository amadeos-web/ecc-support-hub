import { useState } from 'react';
import { getCase, type MessageTemplate } from '../data';
import { useMemberVars } from '../lib/memberVars';
import { TEMPLATE_VARIABLES, missingVariables, renderTemplate, variableLabel, type TemplateVars } from '../lib/templateEngine';
import { href } from '../lib/router';
import { CategoryTag, CopyButton, DemoBadge, StarButton } from './ui';
import { TemplateText } from './TemplateText';

interface Props {
  template: MessageTemplate;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  highlighted?: boolean;
  /** Afficher le message en entier dès le départ (fiche « Traiter une demande »). */
  expanded?: boolean;
  showCaseLink?: boolean;
  /** Version épurée (fiche SAV) : ni source, ni catégorie, ni texte source. */
  compact?: boolean;
}

export function TemplateCard({ template, favorite, onToggleFavorite, highlighted, expanded = false, showCaseLink = true, compact = false }: Props) {
  const { vars, setVar } = useMemberVars();
  const [open, setOpen] = useState(expanded);
  const [showSource, setShowSource] = useState(false);
  const missing = missingVariables(template.message, vars);
  const finalText = renderTemplate(template.message, vars);
  const extraVars = template.variables.filter((v) => v !== 'prenom');
  const linkedCase = getCase(template.caseIds[0]);

  return (
    <article id={`tpl-${template.id}`} className={`card template-card ${highlighted ? 'is-highlighted' : ''}`}>
      {!compact && (
        <header className="card-head">
          <div className="card-kicker">
            <span>Case</span>
            <DemoBadge source={template.source} />
            <CategoryTag id={template.category} />
            {onToggleFavorite && <StarButton active={!!favorite} onToggle={onToggleFavorite} />}
          </div>
          <h3 className="card-case">{template.title}</h3>
        </header>
      )}

      {extraVars.length > 0 && (
        <div className="template-vars">
          {extraVars.map((v) => (
            <label key={v} className={`field ${missing.includes(v) ? 'is-invalid' : ''}`}>
              <span className="field-label">
                {variableLabel(v)} <span className="req">*</span>
              </span>
              <input className="input" value={vars[v] ?? ''} onChange={(e) => setVar(v, e.target.value)} placeholder={TEMPLATE_VARIABLES.find((x) => x.key === v)?.placeholder} autoComplete="off" />
            </label>
          ))}
        </div>
      )}

      {!compact && <div className="card-label">Message (French)</div>}
      {showSource ? (
        <pre className="template-text">{template.sourceMessage}</pre>
      ) : template.english ? (
        <BilingualText fr={template.message} en={template.english} vars={vars} clamped={!open} />
      ) : (
        <TemplateText body={template.message} vars={vars} className={open ? '' : 'is-clamped'} />
      )}

      <footer className="card-foot">
        <div className="card-foot-info">
          {missing.length > 0 ? (
            <span className="warn-text">Copy blocked — fill in: {missing.map(variableLabel).join(', ')}</span>
          ) : null}
          <div className="card-links">
            {!compact && (
              <button type="button" className="link" onClick={() => setOpen((o) => !o)}>
                {open ? 'Collapse' : 'Show full message'}
              </button>
            )}
            {!compact && (
              <button type="button" className="link" onClick={() => setShowSource((s) => !s)}>
                {showSource ? 'Personalised message' : 'Source text'}
              </button>
            )}
            {showCaseLink && linkedCase && (
              <a className="link" href={href('traiter', linkedCase.id)}>
                Case sheet →
              </a>
            )}
          </div>
        </div>
        <CopyButton
          text={finalText}
          label="Copy the message"
          disabled={missing.length > 0}
          disabledReason={`Fill in first: ${missing.map(variableLabel).join(', ')}`}
        />
      </footer>
    </article>
  );
}

const PARA = /\n[ \t]*\n+/;

/**
 * Message français (copié, envoyé) et traduction anglaise (information de l'agent) côte à côte,
 * paragraphe par paragraphe pour que chaque traduction s'aligne en face de son original.
 */
function BilingualText({ fr, en, vars, clamped }: { fr: string; en: string; vars: TemplateVars; clamped: boolean }) {
  const frParas = fr.split(PARA);
  const enParas = en.split(PARA);
  const aligned = frParas.length === enParas.length;
  const rows = aligned ? frParas.map((p, i) => [p, enParas[i]] as const) : [[fr, en] as const];
  return (
    <div className={`template-bi ${clamped ? 'is-clamped' : ''}`}>
      <div className="template-bi-head">
        <span>French — sent to the member</span>
        <span>English — for your information</span>
      </div>
      {rows.map(([f, e], i) => (
        <div key={i} className="template-bi-row">
          <TemplateText bare body={f} vars={vars} />
          <TemplateText bare body={e} vars={vars} className="is-en" />
        </div>
      ))}
    </div>
  );
}
