import { getRole, type InternalMessage } from '../data';
import { useMemberVars } from '../lib/memberVars';
import { missingVariables, renderTemplate, variableLabel } from '../lib/templateEngine';
import { CopyButton } from './ui';
import { TemplateText } from './TemplateText';

/** Message interne : toutes les variables sont obligatoires, la copie est bloquée sinon. */
export function InternalMessageCard({ message }: { message: InternalMessage }) {
  const { vars } = useMemberVars();
  const required: string[] = [];
  const missing = missingVariables(message.message, vars, required);
  return (
    <article className="card internal-card">
      <header className="card-head">
        <div className="card-kicker">
          <span>Internal message → {getRole(message.to)?.label}</span>
        </div>
        <h3 className="card-case">{message.title}</h3>
      </header>
      <TemplateText body={message.message} vars={vars} optionalVars={required} />
      <footer className="card-foot">
        <div className="card-foot-info">
          {missing.length > 0 ? (
            <span className="warn-text">Copy blocked — fill in: {missing.map(variableLabel).join(', ')}</span>
          ) : (
            <span className="ok-text">Ready to send</span>
          )}
        </div>
        <CopyButton
          text={renderTemplate(message.message, vars, required)}
          label="Copy the message"
          disabled={missing.length > 0}
          disabledReason={`Fill in first: ${missing.map(variableLabel).join(', ')}`}
        />
      </footer>
    </article>
  );
}
