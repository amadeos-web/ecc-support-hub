import { useState } from 'react';
import { caseGuidance, getCase, getCategory, getRole, getTemplate, statusCheckExempt, type SupportCase } from '../data';
import { href } from '../lib/router';
import { MemberVarsPanel } from './MemberVarsPanel';
import { TemplateCard } from './TemplateCard';
import { StatusGate, WorkflowStrip } from './StatusGate';
import { HandlingBadge, OwnerBadge } from './ui';

/** Fiche opérationnelle : à vérifier → procédure → selon la situation → réponse → escalade → note. */
export function CaseSheet({ supportCase: c }: { supportCase: SupportCase }) {
  const [checked, setChecked] = useState<string[]>([]);
  const category = getCategory(c.category);
  const guidance = caseGuidance[c.id] ?? {};
  const gated = !statusCheckExempt.has(c.id);
  /** Prénom / nom / email sont déjà collectés dans le contrôle du statut. */
  const toAsk = gated ? c.infoToCollect.filter((i) => !['Prénom', 'Nom', 'Email', 'Email utilisé lors de l’inscription'].includes(i)) : c.infoToCollect;
  const memberMsgs = c.memberMessages.map((m) => ({ ref: m, tpl: getTemplate(m.templateId) })).filter((m) => m.tpl);
  const toggle = (k: string) => setChecked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const escalate = c.escalation || c.handling === 'ne-pas-traiter';
  const role = c.escalation ? getRole(c.escalation.to) : undefined;
  const related = c.relatedCaseIds.map(getCase).filter((r) => r !== undefined);

  const checklist = (items: string[]) => (
    <ul className="cs-checklist">
      {items.map((item) => (
        <li key={item}>
          <label className={checked.includes(item) ? 'is-done' : ''}>
            <input type="checkbox" checked={checked.includes(item)} onChange={() => toggle(item)} />
            <span>{item}</span>
          </label>
        </li>
      ))}
    </ul>
  );

  return (
    <article className="case-sheet">
      <header className="cs-head">
        {category && (
          <div className="cs-tags">
            <span className="tag">
              {category.icon} {category.label}
            </span>
          </div>
        )}
        <h1 className="cs-title">{c.shortTitle}</h1>
        <div className="cs-meta">
          <HandlingBadge handling={c.handling} />
        </div>
      </header>

      <WorkflowStrip gated={gated} />

      {gated ? <StatusGate caseId={c.id} /> : <MemberVarsPanel compact fields={['prenom', 'nom', 'email']} title="Informations du membre" />}

      <h2 className="cs-phase">Traitement de la demande</h2>

      {(c.checks.length > 0 || toAsk.length > 0) && (
        <section className="cs-step">
          <h2>À vérifier</h2>
          {toAsk.length > 0 && (
            <>
              <h3 className="cs-sub">À demander au membre</h3>
              {checklist(toAsk)}
            </>
          )}
          {c.checks.length > 0 && (
            <>
              {toAsk.length > 0 && <h3 className="cs-sub">À contrôler</h3>}
              {checklist(c.checks)}
            </>
          )}
        </section>
      )}

      <section className="cs-step">
        <h2>Procédure</h2>
        {c.steps.length === 0 ? (
          <p className="cs-pending">Procédure non définie : validation d’un responsable nécessaire.</p>
        ) : (
          <ol className="cs-steps">
            {c.steps.map((s, i) => (
              <li key={i} className={s.owner === 'sav' ? '' : 'is-other'}>
                <div className="cs-step-main">
                  <span className="cs-step-text">{s.text}</span>
                  {s.owner !== 'sav' && <OwnerBadge owner={s.owner} />}
                </div>
                {guidance.stepNotes?.[i] && <p className="cs-pending">{guidance.stepNotes[i]}</p>}
              </li>
            ))}
          </ol>
        )}
        {c.doNot.length > 0 && (
          <div className="cs-donot">
            <strong>🚫 À ne pas faire</strong>
            <ul>
              {c.doNot.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
        {c.closingCriteria && <p className="muted small">Clôture : {c.closingCriteria}</p>}
      </section>

      {guidance.branches && guidance.branches.length > 0 && (
        <section className="cs-step">
          <h2>Selon la situation</h2>
          <ul className="cs-branches">
            {guidance.branches.map((b) => (
              <li key={b.when}>
                <strong>Si {b.when.charAt(0).toLowerCase() + b.when.slice(1)}</strong>
                <span>{b.then}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="cs-messages">
        <h2>Réponse au membre</h2>
        {memberMsgs.length === 0 && <p className="muted">Pas de modèle de réponse pour ce cas.</p>}
        {memberMsgs.map(({ ref, tpl }) => (
          <div key={ref.templateId} className="cs-msg">
            {ref.note && <div className="cs-msg-moment">{ref.note}</div>}
            <TemplateCard template={tpl!} expanded showCaseLink={false} compact />
          </div>
        ))}
      </section>

      {escalate && (
        <section className="cs-step">
          <h2>Escalade</h2>
          <div className="cs-escalation">
            {guidance.escalateWhen && (
              <div>
                <span className="muted small">Quand</span>
                <span>{guidance.escalateWhen}</span>
              </div>
            )}
            <div>
              <span className="muted small">À qui</span>
              <strong>{role ? `${role.label}${role.contact ? ` — ${role.contact}` : ''}` : 'Responsable à confirmer'}</strong>
            </div>
            {c.escalation && (
              <>
                <div>
                  <span className="muted small">À transmettre</span>
                  <span>{c.escalation.infoToTransmit.join(' · ')}</span>
                </div>
                <div>
                  <span className="muted small">Pourquoi</span>
                  <span>{c.escalation.why}</span>
                </div>
              </>
            )}
            {!c.escalation && (
              <div>
                <span className="muted small">À transmettre</span>
                <span>{c.infoToCollect.join(' · ') || 'La demande du membre'}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {c.internalNotes.length > 0 && (
        <section className="cs-step cs-internal">
          <h2>Note interne</h2>
          <ul className="cs-notes">
            {c.internalNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="cs-related">
          <h3>Voir aussi</h3>
          <div className="cs-related-list">
            {related.map((r) => (
              <a key={r.id} href={href('traiter', r.id)} className="related-chip">
                {r.shortTitle}
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
