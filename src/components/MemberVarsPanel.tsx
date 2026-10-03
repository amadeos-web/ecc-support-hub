import { useMemberVars } from '../lib/memberVars';
import { TEMPLATE_VARIABLES } from '../lib/templateEngine';

/**
 * Informations du membre, partagées dans toute l'application : renseignées une fois,
 * elles personnalisent tous les messages (membre et internes).
 */
export function MemberVarsPanel({ compact = false, fields = ['prenom'], title }: { compact?: boolean; fields?: ('prenom' | 'nom' | 'email')[]; title?: string }) {
  const { vars, setVar, reset } = useMemberVars();
  return (
    <div className={`vars-panel ${compact ? 'is-compact' : ''}`}>
      {title && <div className="vars-title">{title}</div>}
      <div className="vars-main">
        {fields.map((f) => {
          const def = TEMPLATE_VARIABLES.find((v) => v.key === f)!;
          return (
            <label key={f} className={`field ${f === 'prenom' ? 'field-prenom' : 'field-var'}`}>
              <span className="field-label">{f === 'prenom' ? 'Prénom du membre' : def.label}</span>
              <input
                type={f === 'email' ? 'email' : 'text'}
                value={vars[f] ?? ''}
                onChange={(e) => setVar(f, e.target.value)}
                placeholder={f === 'prenom' ? 'Ex. Thomas' : def.placeholder}
                autoComplete="off"
              />
            </label>
          );
        })}
        <div className="vars-actions">
          <button type="button" className="btn btn-ghost" onClick={reset}>
            Réinitialiser
          </button>
        </div>
      </div>
      {!compact && !vars.prenom?.trim() && <p className="muted small">Sans prénom, la salutation reste générique (« Bonjour 👋 »).</p>}
    </div>
  );
}
