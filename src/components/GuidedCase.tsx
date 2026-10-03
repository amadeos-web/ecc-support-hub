import { useEffect, useRef, useState, type ReactNode } from 'react';
import { caseGuidance, getCase, getInternalMessage, getRole, getTemplate, NOT_IN_ORDER_CASE_ID, roadmapLabels as L, type SupportCase } from '../data';
import { useMemberVars } from '../lib/memberVars';
import { missingVariables, renderTemplate, variableLabel } from '../lib/templateEngine';
import { href } from '../lib/router';
import { CopyButton } from './ui';
import { TemplateCard } from './TemplateCard';
import { TemplateText } from './TemplateText';

type StepId = 'identify' | 'status' | 'result' | 'notInOrder' | 'verify' | 'transmit' | 'follow' | 'reply';

/** Parcours guidé : une fiche = une feuille de route verticale, révélée étape par étape. */
export function GuidedCase({ supportCase: c }: { supportCase: SupportCase }) {
  const { vars, setVar } = useMemberVars();
  const [reached, setReached] = useState(0);
  const [choice, setChoice] = useState<'ok' | 'ko' | null>(null);
  const [openBranch, setOpenBranch] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const guidance = caseGuidance[c.id] ?? {};
  const statusMsg = getInternalMessage('int-compta-acces');
  const identity = ['prenom', 'nom', 'email'] as const;
  const identityDone = identity.every((k) => (vars[k] ?? '').trim() !== '');
  const toAsk = c.infoToCollect.filter((i) => !['Prénom', 'Nom', 'Email', 'Email utilisé lors de l’inscription'].includes(i));
  const hasVerify = toAsk.length > 0 || c.checks.length > 0;
  const replyRef = c.memberMessages.find((m) => m.moment === 'resolution');
  const reply = getTemplate(replyRef?.templateId);
  const escalation = c.escalation;
  const role = escalation ? getRole(escalation.to) : undefined;
  const notInOrder = getCase(NOT_IN_ORDER_CASE_ID);

  // Étapes affichées : uniquement celles que ce cas possède, selon le choix fait.
  const ids: StepId[] = ['identify', 'status', 'result'];
  if (choice === 'ko') ids.push('notInOrder');
  if (choice === 'ok') {
    if (hasVerify) ids.push('verify');
    if (c.steps.length > 0) ids.push('transmit', 'follow');
    if (reply) ids.push('reply');
  }
  const visible = ids.slice(0, reached + 1);
  const last = visible[visible.length - 1];
  const finished = choice === 'ok' && last === ids[ids.length - 1] && reached >= ids.length - 1;

  const advance = (from: StepId) => {
    const i = ids.indexOf(from);
    setReached((r) => Math.max(r, i + 1));
  };

  // Le regard suit la progression : l'étape qui vient d'apparaître remonte en haut.
  useEffect(() => {
    const el = refs.current[last];
    if (el && typeof el.scrollIntoView === 'function') window.requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [last]);

  const choose = (v: 'ok' | 'ko') => {
    setChoice(v);
    setReached(3); // l'étape qui suit le choix apparaît immédiatement
  };

  const toggle = (k: string) => setChecked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const missing = statusMsg ? missingVariables(statusMsg.message, vars, []) : [];
  const stepStatus = statusMsg ? renderTemplate(statusMsg.message, vars, []) : '';

  const content: Record<StepId, { title: string; hint?: string; body: ReactNode; cta?: { label: string; disabled?: boolean } }> = {
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
            <CopyButton text={stepStatus} label={L.status.copy} className="btn btn-secondary" disabled={missing.length > 0} disabledReason={`Renseigne d'abord : ${missing.map(variableLabel).join(', ')}`} />
          </div>
        </>
      ) : null,
      cta: { label: L.status.cta },
    },
    result: {
      title: L.result.title,
      body: (
        <div className="rm-choice">
          <button type="button" className={`btn ${choice === 'ok' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => choose('ok')}>
            {L.result.ok}
          </button>
          <button type="button" className={`btn ${choice === 'ko' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => choose('ko')}>
            {L.result.ko}
          </button>
        </div>
      ),
    },
    notInOrder: {
      title: L.result.koTitle,
      hint: L.result.koHint,
      body: notInOrder ? (
        <a className="rm-link" href={href('traiter', notInOrder.id)}>
          {notInOrder.shortTitle} →
        </a>
      ) : null,
    },
    verify: {
      title: L.verify.title,
      body: (
        <>
          {toAsk.length > 0 && <Checklist label={L.verify.ask} items={toAsk} checked={checked} onToggle={toggle} />}
          {c.checks.length > 0 && <Checklist label={L.verify.check} items={c.checks} checked={checked} onToggle={toggle} />}
          {guidance.branches && guidance.branches.length > 0 && (
            <div className="rm-branches">
              <div className="rm-sub">{L.verify.branches}</div>
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
                          {L.verify.showReply}
                        </button>
                        {openBranch === b.when && <TemplateCard template={tpl} expanded showCaseLink={false} compact />}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ),
      cta: { label: L.verify.cta },
    },
    transmit: {
      title: L.transmit.title,
      hint: c.steps[0]?.text,
      body: (
        <>
          {escalation && (
            <dl className="rm-facts">
              <dt>{L.transmit.to}</dt>
              <dd>{role ? `${role.label}${role.contact ? ` — ${role.contact}` : ''}` : escalation.to}</dd>
              <dt>{L.transmit.what}</dt>
              <dd>{escalation.infoToTransmit.map((k) => ({ Prénom: vars.prenom, Nom: vars.nom, Email: vars.email })[k as 'Prénom'] || k).join(' · ')}</dd>
            </dl>
          )}
          {c.doNot.length > 0 && (
            <div className="rm-donot">
              <div className="rm-sub">{L.transmit.doNot}</div>
              <ul>
                {c.doNot.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ),
      cta: { label: L.transmit.cta },
    },
    follow: {
      title: L.follow.title,
      hint: c.steps[2]?.text,
      body: c.steps[1] ? (
        <p className="rm-text">
          <span className="rm-muted">{getRole(c.steps[1].owner)?.label} : </span>
          {c.steps[1].text}
        </p>
      ) : null,
      cta: { label: L.follow.cta },
    },
    reply: {
      title: L.reply.title,
      hint: replyRef?.note,
      body: reply ? <TemplateCard template={reply} expanded showCaseLink={false} compact /> : null,
    },
  };

  return (
    <article className="case-sheet guided">
      <header className="rm-head">
        <h1 className="cs-title">{c.shortTitle}</h1>
      </header>
      <ol className="rm">
        {visible.map((id, i) => {
          const s = content[id];
          const isActive = id === last;
          const isLast = i === visible.length - 1 && !finished;
          return (
            <li
              key={id}
              ref={(el) => {
                refs.current[id] = el;
              }}
              className={`rm-step ${isActive ? 'is-active' : 'is-done'} ${isLast ? 'is-last' : ''}`}
            >
              <span className="rm-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="rm-main">
                <h2 className="rm-title">{s.title}</h2>
                {s.hint && <p className="rm-hint">{s.hint}</p>}
                <div className="rm-body">{s.body}</div>
                {s.cta && isActive && (
                  <div className="rm-actions">
                    <button type="button" className="btn btn-primary" disabled={s.cta.disabled} onClick={() => advance(id)}>
                      {s.cta.label}
                    </button>
                  </div>
                )}
                {id === 'result' && choice && !isActive && (
                  <button type="button" className="rm-link" onClick={() => { setChoice(null); setReached(2); }}>
                    {L.result.change}
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {finished && (
          <li className="rm-step is-active is-end">
            <span className="rm-num">✓</span>
            <div className="rm-main">
              <h2 className="rm-title">{L.end.title}</h2>
              {c.closingCriteria && <p className="rm-hint">{c.closingCriteria}</p>}
              <a className="rm-link" href={href('accueil')}>
                {L.end.again} →
              </a>
            </div>
          </li>
        )}
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
