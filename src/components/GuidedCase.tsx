import { useEffect, useRef, useState, type ReactNode } from 'react';
import { caseGuidance, getCase, getInternalMessage, getRole, getTemplate, NOT_IN_ORDER_CASE_ID, roadmapLabels as L, type SupportCase } from '../data';
import { useMemberVars } from '../lib/memberVars';
import { missingVariables, renderTemplate, variableLabel } from '../lib/templateEngine';
import { href } from '../lib/router';
import { CopyButton } from './ui';
import { TemplateCard } from './TemplateCard';
import { TemplateText } from './TemplateText';

type StepId = 'identify' | 'status' | 'result' | 'treat' | 'reply' | 'end';
const ORDER: StepId[] = ['identify', 'status', 'result', 'treat', 'reply', 'end'];

/**
 * Parcours guidé : la feuille de route COMPLÈTE est visible dès l'ouverture.
 * L'étape active est contrastée, les suivantes restent lisibles (atténuées), les terminées s'effacent.
 */
export function GuidedCase({ supportCase: c }: { supportCase: SupportCase }) {
  const { vars, setVar } = useMemberVars();
  const [active, setActive] = useState(0);
  const [choice, setChoice] = useState<'ok' | 'ko' | null>(null);
  const [openBranch, setOpenBranch] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const first = useRef(true);

  const guidance = caseGuidance[c.id] ?? {};
  const statusMsg = getInternalMessage('int-compta-acces');
  const identity = ['prenom', 'nom', 'email'] as const;
  const identityDone = identity.every((k) => (vars[k] ?? '').trim() !== '');
  const toAsk = c.infoToCollect.filter((i) => !['Prénom', 'Nom', 'Email', 'Email utilisé lors de l’inscription'].includes(i));
  const replyRef = c.memberMessages.find((m) => m.moment === 'resolution');
  const reply = getTemplate(replyRef?.templateId);
  const escalation = c.escalation;
  const role = escalation ? getRole(escalation.to) : undefined;
  const notInOrder = getCase(NOT_IN_ORDER_CASE_ID);

  // Étapes que ce cas possède réellement (aucune étape vide).
  const hasTreat = toAsk.length > 0 || c.checks.length > 0 || c.steps.length > 0;
  const ids = ORDER.filter((id) => (id !== 'treat' || hasTreat) && (id !== 'reply' || reply));
  const activeId = ids[Math.min(active, ids.length - 1)];

  const go = (id: StepId) => setActive(Math.max(0, ids.indexOf(id)));
  const next = (from: StepId) => setActive(ids.indexOf(from) + 1);

  // Après une action, le regard suit : l'étape active remonte en haut (pas au chargement initial).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = refs.current[activeId];
    if (el && typeof el.scrollIntoView === 'function') window.requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [activeId]);

  const choose = (v: 'ok' | 'ko') => {
    setChoice(v);
    go('treat');
  };
  const toggle = (k: string) => setChecked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const missing = statusMsg ? missingVariables(statusMsg.message, vars, []) : [];

  const steps: Record<StepId, { title: string; hint?: string; body?: ReactNode; cta?: { label: string; disabled?: boolean } }> = {
    identify: {
      title: L.identify.title,
      body: (
        <div className="rm-fields">
          {identity.map((k) => (
            <label key={k} className="field">
              <span className="field-label">{k === 'prenom' ? 'Prénom' : k === 'nom' ? 'Nom' : 'Email'}</span>
              <input className="input" type={k === 'email' ? 'email' : 'text'} value={vars[k] ?? ''} onChange={(e) => setVar(k, e.target.value)} autoComplete="off" />
            </label>
          ))}
        </div>
      ),
      cta: { label: L.identify.cta, disabled: !identityDone },
    },
    status: {
      title: L.status.title,
      hint: L.status.hint,
      body: statusMsg ? (
        <>
          <TemplateText body={statusMsg.message} vars={vars} />
          <div className="rm-actions">
            <CopyButton
              text={renderTemplate(statusMsg.message, vars, [])}
              label={L.status.copy}
              className="btn btn-secondary"
              disabled={missing.length > 0}
              disabledReason={`Renseigne d'abord : ${missing.map(variableLabel).join(', ')}`}
            />
          </div>
        </>
      ) : undefined,
      cta: { label: L.status.cta },
    },
    result: {
      title: L.result.title,
      body: (
        <>
          <div className="rm-choice">
            <button type="button" className={`btn ${choice === 'ok' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => choose('ok')}>
              {L.result.ok}
            </button>
            <button type="button" className={`btn ${choice === 'ko' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => choose('ko')}>
              {L.result.ko}
            </button>
          </div>
          {choice && activeId !== 'result' && (
            <button type="button" className="rm-link" onClick={() => { setChoice(null); go('result'); }}>
              {L.result.change}
            </button>
          )}
        </>
      ),
    },
    treat: {
      title: L.treat.title,
      hint: choice === 'ko' ? L.result.koHint : undefined,
      body:
        choice === 'ko' ? (
          notInOrder && (
            <a className="rm-link" href={href('traiter', notInOrder.id)}>
              {notInOrder.shortTitle} →
            </a>
          )
        ) : (
          <>
            {(toAsk.length > 0 || c.checks.length > 0) && (
              <div className="rm-block">
                <div className="rm-sub">{L.treat.verify}</div>
                {toAsk.length > 0 && <Checklist label={L.treat.ask} items={toAsk} checked={checked} onToggle={toggle} />}
                {c.checks.length > 0 && <Checklist label={L.treat.check} items={c.checks} checked={checked} onToggle={toggle} />}
                {guidance.branches && guidance.branches.length > 0 && (
                  <div className="rm-branches">
                    <div className="rm-sub">{L.treat.branches}</div>
                    {guidance.branches.map((b) => {
                      const tpl = getTemplate(b.messageId);
                      const target = getCase(b.caseId);
                      return (
                        <div key={b.when} className="rm-branch">
                          <strong>Si {b.when.charAt(0).toLowerCase() + b.when.slice(1)}</strong>
                          <span>{b.then}</span>
                          {target && (
                            <a className="rm-link" href={href('traiter', target.id)}>
                              {target.shortTitle} →
                            </a>
                          )}
                          {tpl && (
                            <>
                              <button type="button" className="rm-link" onClick={() => setOpenBranch(openBranch === b.when ? null : b.when)}>
                                {L.treat.showReply}
                              </button>
                              {openBranch === b.when && <TemplateCard template={tpl} expanded showCaseLink={false} compact />}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {c.steps[0] && (
              <div className="rm-block">
                <div className="rm-sub">{L.treat.transmit}</div>
                <p className="rm-text">{c.steps[0].text}</p>
                {escalation && (
                  <dl className="rm-facts">
                    <dt>{L.treat.to}</dt>
                    <dd>{role ? `${role.label}${role.contact ? ` — ${role.contact}` : ''}` : escalation.to}</dd>
                    <dt>{L.treat.what}</dt>
                    <dd>{escalation.infoToTransmit.map((k) => ({ Prénom: vars.prenom, Nom: vars.nom, Email: vars.email })[k as 'Prénom'] || k).join(' · ')}</dd>
                  </dl>
                )}
                {c.doNot.length > 0 && (
                  <div className="rm-donot">
                    <div className="rm-sub">{L.treat.doNot}</div>
                    <ul>
                      {c.doNot.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {c.steps[1] && (
              <div className="rm-block">
                <div className="rm-sub">{L.treat.follow}</div>
                <p className="rm-text">
                  <span className="rm-muted">{getRole(c.steps[1].owner)?.label} : </span>
                  {c.steps[1].text}
                </p>
                {c.steps[2] && <p className="rm-text">{c.steps[2].text}</p>}
              </div>
            )}
          </>
        ),
      cta: choice === 'ok' ? { label: L.treat.cta } : undefined,
    },
    reply: {
      title: L.reply.title,
      hint: replyRef?.note,
      body: reply ? <TemplateCard template={reply} expanded showCaseLink={false} compact /> : undefined,
      cta: { label: L.reply.cta },
    },
    end: {
      title: L.end.title,
      hint: c.closingCriteria,
      body: (
        <a className="rm-link" href={href('accueil')}>
          {L.end.again} →
        </a>
      ),
    },
  };

  return (
    <article className="case-sheet guided">
      <header className="rm-head">
        <h1 className="cs-title">{c.shortTitle}</h1>
      </header>
      <ol className="rm">
        {ids.map((id, i) => {
          const s = steps[id];
          const state = i < ids.indexOf(activeId) ? 'is-done' : i === ids.indexOf(activeId) ? 'is-active' : 'is-future';
          return (
            <li
              key={id}
              ref={(el) => {
                refs.current[id] = el;
              }}
              className={`rm-step ${state} ${i === ids.length - 1 ? 'is-last' : ''}`}
            >
              <span className="rm-num">{id === 'end' ? '' : String(i + 1).padStart(2, '0')}</span>
              <div className="rm-main">
                <h2 className="rm-title">{s.title}</h2>
                {s.hint && <p className="rm-hint">{s.hint}</p>}
                {s.body && (
                  <div className="rm-body" inert={state === 'is-future' && id !== 'end'}>
                    {s.body}
                  </div>
                )}
                {s.cta && state === 'is-active' && (
                  <div className="rm-actions">
                    <button type="button" className="btn btn-primary" disabled={s.cta.disabled} onClick={() => next(id)}>
                      {s.cta.label}
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

function Checklist({ label, items, checked, onToggle }: { label: string; items: string[]; checked: string[]; onToggle: (k: string) => void }) {
  return (
    <div className="rm-checklist">
      <div className="rm-sub">{label}</div>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <label className={checked.includes(item) ? 'is-done' : ''}>
              <input type="checkbox" checked={checked.includes(item)} onChange={() => onToggle(item)} />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
