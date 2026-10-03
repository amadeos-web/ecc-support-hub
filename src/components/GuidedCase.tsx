import { useEffect, useRef, useState, type ReactNode } from 'react';
import { caseGuidance, getCase, getInternalMessage, getRole, getTemplate, KYC_CASE_ID, kycRequiredIds, NOT_IN_ORDER_CASE_ID, roadmapFor, roadmapLabels as L, statusCheckExempt, type RoadmapBlock, type SupportCase } from '../data';
import { useMemberVars } from '../lib/memberVars';
import { missingVariables, renderTemplate, variableLabel } from '../lib/templateEngine';
import { href } from '../lib/router';
import { CopyButton } from './ui';
import { TemplateCard } from './TemplateCard';
import { TemplateText } from './TemplateText';

interface Step {
  key: string;
  title: string;
  hint?: string;
  body?: ReactNode;
  cta?: { label: string; disabled?: boolean };
}

const IDENTITY_ASKS = ['Prénom', 'Nom', 'Email', 'Email utilisé lors de l’inscription'];

/**
 * Roadmap d'un cas : étapes construites depuis les données du cas (data/caseRoadmaps.ts),
 * TOUTES visibles dès l'ouverture. L'étape active est contrastée, les suivantes restent lisibles,
 * les terminées s'effacent. Le retour de la comptabilité adapte la suite (en règle / pas en règle).
 */
export function GuidedCase({ supportCase: c }: { supportCase: SupportCase }) {
  const { vars, setVar } = useMemberVars();
  const [active, setActive] = useState(0);
  const [choice, setChoice] = useState<'ok' | 'ko' | null>(null);
  const [kyc, setKyc] = useState<'ok' | 'ko' | null>(null);
  const [openBranch, setOpenBranch] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const first = useRef(true);

  const gated = !statusCheckExempt.has(c.id);
  const needsKyc = kycRequiredIds.has(c.id);
  /** Quand l'étape KYC existe, ses points (déjà couverts) ne sont pas répétés ailleurs. */
  const notKyc = (t: string) => !needsKyc || !/KYC/i.test(t);
  const guidance = caseGuidance[c.id] ?? {};
  const statusMsg = getInternalMessage('int-compta-acces');
  const identity = ['prenom', 'nom', 'email'] as const;
  const identityDone = identity.every((k) => (vars[k] ?? '').trim() !== '');
  const notInOrder = getCase(NOT_IN_ORDER_CASE_ID);
  const toggle = (k: string) => setChecked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  let prenomShown = gated; // sans étape « identifier », le prénom se saisit à côté du premier message

  const missing = statusMsg ? missingVariables(statusMsg.message, vars, []) : [];

  const renderBlock = (b: RoadmapBlock, i: number): ReactNode => {
    switch (b.kind) {
      case 'ask': {
        const items = (gated ? c.infoToCollect.filter((x) => !IDENTITY_ASKS.includes(x)) : c.infoToCollect).filter(notKyc);
        return items.length ? <Checklist key={i} label={L.blocks.ask} items={items} checked={checked} onToggle={toggle} /> : null;
      }
      case 'checks':
        return c.checks.filter(notKyc).length ? <Checklist key={i} label={L.blocks.check} items={c.checks.filter(notKyc)} checked={checked} onToggle={toggle} /> : null;
      case 'branches':
        return guidance.branches?.filter((br) => notKyc(br.when)).length ? (
          <div key={i} className="rm-branches">
            <div className="rm-sub">{L.blocks.branches}</div>
            {guidance.branches.filter((br) => notKyc(br.when)).map((br) => {
              const tpl = getTemplate(br.messageId);
              const target = getCase(br.caseId);
              return (
                <div key={br.when} className="rm-branch">
                  <strong>Si {br.when.charAt(0).toLowerCase() + br.when.slice(1)}</strong>
                  <span>{br.then}</span>
                  {target && (
                    <a className="rm-link" href={href('traiter', target.id)}>
                      {target.shortTitle} →
                    </a>
                  )}
                  {tpl && (
                    <>
                      <button type="button" className="rm-link" onClick={() => setOpenBranch(openBranch === br.when ? null : br.when)}>
                        {L.blocks.showReply}
                      </button>
                      {openBranch === br.when && <TemplateCard template={tpl} expanded showCaseLink={false} compact />}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : null;
      case 'steps': {
        const rows = b.idx.map((n) => ({ n, s: c.steps[n] })).filter((r) => r.s);
        return rows.length ? (
          <div key={i} className="rm-lines">
            {rows.map(({ n, s }) => (
              <p key={n} className="rm-text">
                {s.owner !== 'sav' && <span className="rm-muted">{getRole(s.owner)?.label} : </span>}
                {s.text}
                {guidance.stepNotes?.[n] && <span className="rm-note">{guidance.stepNotes[n]}</span>}
              </p>
            ))}
          </div>
        ) : null;
      }
      case 'escalation': {
        const e = c.escalation;
        if (!e) return null;
        const role = getRole(e.to);
        return (
          <dl key={i} className="rm-facts">
            {guidance.escalateWhen && (
              <>
                <dt>{L.blocks.when}</dt>
                <dd>{guidance.escalateWhen}</dd>
              </>
            )}
            <dt>{L.blocks.to}</dt>
            <dd>{role ? `${role.label}${role.contact ? ` — ${role.contact}` : ''}` : e.to}</dd>
            <dt>{L.blocks.what}</dt>
            <dd>{e.infoToTransmit.map((k) => ({ Prénom: vars.prenom, Nom: vars.nom, Email: vars.email })[k as 'Prénom'] || k).join(' · ')}</dd>
          </dl>
        );
      }
      case 'doNot':
        return c.doNot.length ? (
          <div key={i} className="rm-donot">
            <div className="rm-sub">{L.blocks.doNot}</div>
            <ul>
              {c.doNot.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        ) : null;
      case 'message': {
        const ref = c.memberMessages.find((m) => m.templateId === b.id);
        const tpl = getTemplate(b.id);
        if (!ref || !tpl) return null;
        const showPrenom = !prenomShown;
        prenomShown = true;
        return (
          <div key={i} className="rm-message">
            {showPrenom && (
              <label className="field rm-prenom">
                <span className="field-label">{L.blocks.prenom}</span>
                <input className="input" value={vars.prenom ?? ''} onChange={(e) => setVar('prenom', e.target.value)} autoComplete="off" />
              </label>
            )}
            {ref.note && <div className="rm-sub">{ref.note}</div>}
            <TemplateCard template={tpl} expanded showCaseLink={false} compact />
          </div>
        );
      }
      case 'link':
        return (
          <a key={i} className="rm-link" href={href(b.page, b.param)}>
            {b.label} →
          </a>
        );
    }
  };

  // Étapes propres au cas : une étape sans contenu n'existe pas.
  const content: Step[] = roadmapFor(c)
    .map((d, n) => ({ key: `c${n}`, title: d.title, nodes: d.blocks.map(renderBlock).filter((x) => x !== null) }))
    .filter((d) => d.nodes.length > 0)
    .map((d) => ({ key: d.key, title: d.title, body: <>{d.nodes}</> }));

  const pre: Step[] = gated
    ? [
        {
          key: 'identify',
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
        {
          key: 'status',
          title: L.status.title,
          hint: L.status.hint,
          body: statusMsg && (
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
          ),
          cta: { label: L.status.cta },
        },
        {
          key: 'result',
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
              {choice && (
                <button type="button" className="rm-link" onClick={() => { setChoice(null); setActive(2); }}>
                  {L.result.change}
                </button>
              )}
            </>
          ),
        },
      ]
    : [];

  function choose(v: 'ok' | 'ko') {
    setChoice(v);
    setActive(pre.length);
  }
  function chooseKyc(v: 'ok' | 'ko') {
    setKyc(v);
    setActive(pre.length + 1);
  }

  const koReplaces = gated && choice === 'ko' && c.id !== NOT_IN_ORDER_CASE_ID;
  const kycTarget = getCase(KYC_CASE_ID);
  const kycStep: Step = {
    key: 'kyc',
    title: L.kyc.title,
    hint: L.kyc.hint,
    body: (
      <>
        <div className="rm-choice">
          <button type="button" className={`btn ${kyc === 'ok' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => chooseKyc('ok')}>
            {L.kyc.ok}
          </button>
          <button type="button" className={`btn ${kyc === 'ko' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => chooseKyc('ko')}>
            {L.kyc.ko}
          </button>
        </div>
        {kyc && (
          <button type="button" className="rm-link" onClick={() => { setKyc(null); setActive(pre.length); }}>
            {L.kyc.change}
          </button>
        )}
      </>
    ),
  };
  const kycKo: Step = {
    key: 'kycKo',
    title: L.kyc.koTitle,
    hint: L.kyc.koHint,
    body: kycTarget && c.id !== KYC_CASE_ID && (
      <a className="rm-link" href={href('traiter', kycTarget.id)}>
        {kycTarget.shortTitle} →
      </a>
    ),
  };
  const end: Step = {
    key: 'end',
    title: L.end.title,
    hint: c.closingCriteria,
    body: (
      <a className="rm-link" href={href('accueil')}>
        {L.end.again} →
      </a>
    ),
  };
  const rest: Step[] = koReplaces
    ? [
        {
          key: 'ko',
          title: L.notInOrder.title,
          hint: L.notInOrder.hint,
          body: notInOrder && (
            <a className="rm-link" href={href('traiter', notInOrder.id)}>
              {notInOrder.shortTitle} →
            </a>
          ),
        },
      ]
    : needsKyc && kyc === 'ko'
      ? [kycStep, kycKo]
      : [
          ...(needsKyc ? [kycStep] : []),
          ...content.map((s, n) => ({ ...s, cta: { label: n === content.length - 1 ? L.cta.last : L.cta.next } })),
          end,
        ];
  const list = [...pre, ...rest];
  const activeIdx = Math.min(active, list.length - 1);
  const activeKey = list[activeIdx].key;

  // Après une action, l'étape active remonte en haut (pas au chargement).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = refs.current[activeKey];
    if (el && typeof el.scrollIntoView === 'function') window.requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [activeKey]);

  return (
    <article className="case-sheet guided">
      <header className="rm-head">
        <h1 className="cs-title">{c.shortTitle}</h1>
      </header>
      <ol className="rm">
        {list.map((s, i) => {
          const state = i < activeIdx ? 'is-done' : i === activeIdx ? 'is-active' : 'is-future';
          const isEnd = s.key === 'end';
          return (
            <li
              key={s.key}
              ref={(el) => {
                refs.current[s.key] = el;
              }}
              className={`rm-step ${state} ${i === list.length - 1 ? 'is-last' : ''}`}
            >
              <span className="rm-num">{isEnd ? '' : String(i + 1).padStart(2, '0')}</span>
              <div className="rm-main">
                <h2 className="rm-title">{s.title}</h2>
                {s.hint && <p className="rm-hint">{s.hint}</p>}
                {s.body && (
                  <div className="rm-body" inert={state === 'is-future' && !isEnd}>
                    {s.body}
                  </div>
                )}
                {s.cta && state === 'is-active' && (
                  <div className="rm-actions">
                    <button type="button" className="btn btn-primary" disabled={s.cta.disabled} onClick={() => setActive(i + 1)}>
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
