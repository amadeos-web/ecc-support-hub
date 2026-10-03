import { useState } from 'react';
import {
  getCase,
  getCategory,
  getInternalMessage,
  getRole,
  getTemplate,
  handlingInfo,
  momentLabel,
  type SupportCase,
} from '../data';
import { href } from '../lib/router';
import { MemberVarsPanel } from './MemberVarsPanel';
import { TemplateCard } from './TemplateCard';
import { InternalMessageCard } from './InternalMessageCard';
import { DemoBadge, OwnerBadge, StatusBadge } from './ui';

const formatDay = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '');

/** Fiche opérationnelle : « J’ai ce problème devant moi. Qu’est-ce que je fais ? » */
export function CaseSheet({ supportCase: c }: { supportCase: SupportCase }) {
  const [checked, setChecked] = useState<string[]>([]);
  const category = getCategory(c.category);
  const internal = c.internalMessageIds.map(getInternalMessage).filter((m) => m !== undefined);
  const memberMsgs = c.memberMessages.map((m) => ({ ref: m, tpl: getTemplate(m.templateId) })).filter((m) => m.tpl);
  const needsMemberInfo = internal.length > 0 || c.infoToCollect.some((i) => /nom|email/i.test(i));
  const toggle = (k: string) => setChecked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const checklist = [...c.infoToCollect.map((i) => `Info : ${i}`), ...c.checks];

  return (
    <article className="case-sheet">
      <header className="cs-head">
        <div className="cs-tags">
          {category && (
            <span className="tag">
              {category.icon} {category.label}
            </span>
          )}
          <DemoBadge source={c.source} />
        </div>
        <h1 className="cs-title">{c.shortTitle}</h1>
        <div className="cs-meta">
          <StatusBadge supportCase={c} large />
          {c.frequency !== undefined && <span className="muted">Observé {c.frequency} fois dans Freshdesk</span>}
          {c.lastObserved && <span className="muted">· dernière fois le {formatDay(c.lastObserved)}</span>}
        </div>
      </header>

      {c.validation === 'a-valider' && (
        <section className="cs-alert cs-alert-strong" role="alert">
          <div className="cs-alert-title">⚠️ PROCÉDURE NON VALIDÉE OFFICIELLEMENT</div>
          <p>Ce cas a été observé dans l’historique, mais ECC n’a pas encore validé la procédure. Suis-la avec prudence et demande confirmation en cas de doute.</p>
          {c.toValidate.length > 0 && (
            <ul>
              {c.toValidate.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="cs-step">
        <h2>
          <span className="cs-num">1</span> Ce que le membre demande
        </h2>
        <p className="cs-lead">{c.problem}</p>
        {c.observedRequests.length > 0 && (
          <details className="cs-fold">
            <summary>Formulations typiques observées ({c.observedRequests.length})</summary>
            <ul className="cs-quotes">
              {c.observedRequests.map((q) => (
                <li key={q}>« {q} »</li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="cs-step">
        <h2>
          <span className="cs-num">2</span> Ce que tu dois vérifier
        </h2>
        {checklist.length === 0 ? (
          <p className="muted">Rien de particulier à vérifier pour ce cas.</p>
        ) : (
          <ul className="cs-checklist">
            {checklist.map((item) => (
              <li key={item}>
                <label className={checked.includes(item) ? 'is-done' : ''}>
                  <input type="checkbox" checked={checked.includes(item)} onChange={() => toggle(item)} />
                  <span>{item.replace(/^Info : /, '')}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cs-step">
        <h2>
          <span className="cs-num">3</span> Ce que tu dois faire
        </h2>
        {c.steps.length === 0 ? (
          <p className="muted">Process non documenté.</p>
        ) : (
          <ol className="cs-steps">
            {c.steps.map((s, i) => (
              <li key={i} className={s.owner === 'sav' ? '' : 'is-other'}>
                <span className="cs-step-text">{s.text}</span>
                <OwnerBadge owner={s.owner} />
              </li>
            ))}
          </ol>
        )}
        {c.doNot.length > 0 && (
          <div className="cs-donot">
            <strong>🚫 Ne fais pas toi-même</strong>
            <ul>
              {c.doNot.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="cs-step">
        <h2>
          <span className="cs-num">4</span> Qui doit intervenir ?
        </h2>
        <div className={`cs-handling h-${c.handling ?? 'unknown'}`}>
          <div className="cs-handling-title">{c.handling ? `${handlingInfo[c.handling].icon} ${handlingInfo[c.handling].label}` : '⚪ Non déterminé — à valider'}</div>
          <p>{c.handling ? handlingInfo[c.handling].description : 'La documentation actuelle ne précise pas qui traite ce cas.'}</p>
          {c.escalation && (
            <div className="cs-escalation">
              <div>
                <span className="muted small">Remonter à</span>
                <strong>
                  {getRole(c.escalation.to)?.label}
                  {getRole(c.escalation.to)?.contact ? ` — ${getRole(c.escalation.to)?.contact}` : ' (contact à renseigner)'}
                </strong>
              </div>
              <div>
                <span className="muted small">Pourquoi</span>
                <span>{c.escalation.why}</span>
              </div>
              <div>
                <span className="muted small">À transmettre</span>
                <span>{c.escalation.infoToTransmit.join(' · ')}</span>
              </div>
              <div>
                <span className="muted small">Retour attendu</span>
                <span>{c.escalation.expectedReturn}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {needsMemberInfo ? (
        <MemberVarsPanel compact fields={['prenom', 'nom', 'email']} title="Informations du membre" />
      ) : (
        <MemberVarsPanel compact />
      )}

      {internal.length > 0 && (
        <section className="cs-messages">
          <h2>Message interne</h2>
          {internal.map((m) => (
            <InternalMessageCard key={m.id} message={m} />
          ))}
        </section>
      )}

      <section className="cs-messages">
        <h2>Réponse au membre</h2>
        {memberMsgs.length === 0 && <p className="muted">Aucun message validé pour ce cas pour l’instant.</p>}
        {memberMsgs.map(({ ref, tpl }) => (
          <div key={ref.templateId} className="cs-msg">
            <div className="cs-msg-moment">
              {momentLabel[ref.moment]}
              {ref.note && <span className="warn-text small"> — {ref.note}</span>}
            </div>
            <TemplateCard template={tpl!} expanded showCaseLink={false} />
          </div>
        ))}
      </section>

      {(c.resolution || c.closingCriteria) && (
        <section className="cs-grid2">
          {c.resolution && (
            <div className="cs-box">
              <h3>Résolution attendue</h3>
              <p>{c.resolution}</p>
            </div>
          )}
          {c.closingCriteria && (
            <div className="cs-box">
              <h3>Quand clôturer ?</h3>
              <p>{c.closingCriteria}</p>
            </div>
          )}
        </section>
      )}

      <section className="cs-folds">
        {c.contradictions.length > 0 && (
          <details className="cs-fold cs-fold-warn" open={c.validation === 'a-valider'}>
            <summary>Contradictions observées ({c.contradictions.length})</summary>
            <ul>
              {c.contradictions.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </details>
        )}
        {c.validation !== 'a-valider' && c.toValidate.length > 0 && (
          <details className="cs-fold">
            <summary>Points encore ouverts ({c.toValidate.length})</summary>
            <ul>
              {c.toValidate.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </details>
        )}
        {c.obsoletePractices.length > 0 && (
          <details className="cs-fold cs-fold-obsolete">
            <summary>Anciennes pratiques — obsolètes, ne pas appliquer ({c.obsoletePractices.length})</summary>
            <ul>
              {c.obsoletePractices.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </details>
        )}
        {c.relatedCaseIds.length > 0 && (
          <details className="cs-fold">
            <summary>Cas proches ({c.relatedCaseIds.length})</summary>
            <div className="cs-related-list">
              {c.relatedCaseIds.map((id) => {
                const r = getCase(id);
                return r ? (
                  <a key={id} href={href('traiter', id)} className="related-chip">
                    {r.shortTitle} <StatusBadge supportCase={r} />
                  </a>
                ) : null;
              })}
            </div>
          </details>
        )}
        {c.internalNotes.length > 0 && (
          <details className="cs-fold cs-internal">
            <summary>Notes internes — ne jamais envoyer au membre</summary>
            <ul>
              {c.internalNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </details>
        )}
        <details className="cs-fold">
          <summary>Sources ({c.sources.freshdeskTickets.length} tickets Freshdesk)</summary>
          <p className="muted small">{c.sources.documents.join(' · ')}</p>
          {c.sources.freshdeskTickets.length > 0 && <p className="cs-tickets">{c.sources.freshdeskTickets.map((n) => `#${n}`).join(' ')}</p>}
        </details>
      </section>
    </article>
  );
}
