import { useState } from 'react';
import { getCase, type MessageTemplate } from '../data';
import { useMemberVars } from '../lib/memberVars';
import { TEMPLATE_VARIABLES, missingVariables, renderTemplate, variableLabel } from '../lib/templateEngine';
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
            <span>Cas</span>
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

      {!compact && <div className="card-label">Message</div>}
      {showSource ? (
        <pre className="template-text">{template.sourceMessage}</pre>
      ) : (
        <TemplateText body={template.message} vars={vars} className={open ? '' : 'is-clamped'} />
      )}

      <footer className="card-foot">
        <div className="card-foot-info">
          {missing.length > 0 ? (
            <span className="warn-text">Copie bloquée — à renseigner : {missing.map(variableLabel).join(', ')}</span>
          ) : vars.prenom?.trim() ? (
            <span className="ok-text">Personnalisé pour {vars.prenom.trim()}</span>
          ) : (
            <span className="muted small">Prénom non renseigné : salutation générique</span>
          )}
          <div className="card-links">
            {!compact && (
              <button type="button" className="link" onClick={() => setOpen((o) => !o)}>
                {open ? 'Réduire' : 'Voir le message complet'}
              </button>
            )}
            {!compact && (
              <button type="button" className="link" onClick={() => setShowSource((s) => !s)}>
                {showSource ? 'Message personnalisé' : 'Texte source'}
              </button>
            )}
            {showCaseLink && linkedCase && (
              <a className="link" href={href('traiter', linkedCase.id)}>
                Fiche du cas →
              </a>
            )}
          </div>
        </div>
        <CopyButton
          text={finalText}
          label="Copier le message"
          disabled={missing.length > 0}
          disabledReason={`Renseigne d'abord : ${missing.map(variableLabel).join(', ')}`}
        />
      </footer>
    </article>
  );
}
