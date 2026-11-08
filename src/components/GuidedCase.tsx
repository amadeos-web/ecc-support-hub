import { useEffect, useRef, useState, type ReactNode } from 'react';
import { caseGuidance, getCase, getRole, getTemplate, ID_EMAIL, ID_FIRST_NAME, ID_LAST_NAME, ID_SIGNUP_EMAIL, KYC_CASE_ID, kycRequiredIds, roadmapFor, roadmapLabels as L, statusCheckExempt, type RoadmapBlock, type SupportCase } from '../data';
import { useMemberVars } from '../lib/memberVars';
import { href } from '../lib/router';
import { TemplateCard } from './TemplateCard';
import { TemplateText } from './TemplateText';
import { CopyButton } from './ui';

interface Step {
  key: string;
  title: string;
  hint?: string;
  body?: ReactNode;
  cta?: { label: string; disabled?: boolean };
}

const IDENTITY_ASKS: string[] = [ID_FIRST_NAME, ID_LAST_NAME, ID_EMAIL, ID_SIGNUP_EMAIL];

/**
 * Roadmap d'un cas : étapes construites depuis les données du cas (data/caseRoadmaps.ts),
 * TOUTES visibles dès l'ouverture. L'étape active est contrastée, les suivantes restent lisibles,
 * les terminées s'effacent.
 *
 * Première étape unique « Identify the member » : une checklist, rien à saisir. Process ECC : avec
 * l'email du membre, on le retrouve sur Didit (prénom, nom, KYC). Pour les cas qui donnent ou
 * rétablissent un accès (kycRequiredIds), le statut KYC vu sur Didit se choisit dans la même étape ;
 * KYC non validé : la suite est remplacée par l'attente du KYC.
 */
export function GuidedCase({ supportCase: c }: { supportCase: SupportCase }) {
  const { vars, setVar } = useMemberVars();
  const [active, setActive] = useState(0);
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
  const identifyItems: string[] = [...L.identify.items];
  const identityDone = identifyItems.every((k) => checked.includes(k));
  const toggle = (k: string) => setChecked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  let prenomShown = false; // le prénom (optionnel, pour personnaliser) se saisit à côté du premier message

  /** hasMsg : l'étape affiche déjà le message à copier → la ligne « Send the validated message… » est superflue. */
  const renderBlock = (b: RoadmapBlock, i: number, hasMsg = false): ReactNode => {
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
                  <strong>If {/^[A-Z][a-z]/.test(br.when) ? br.when.charAt(0).toLowerCase() + br.when.slice(1) : br.when}</strong>
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
                      {openBranch === br.when && (
                        <div className="rm-message">
                          {/* Même champ prénom que pour les autres messages au membre. */}
                          <label className="field rm-prenom">
                            <span className="field-label">{L.blocks.prenom}</span>
                            <input className="input" value={vars.prenom ?? ''} onChange={(e) => setVar('prenom', e.target.value)} autoComplete="off" />
                          </label>
                          <TemplateCard template={tpl} expanded showCaseLink={false} compact />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : null;
      case 'steps': {
        const rows = b.idx
          .map((n) => ({ n, s: c.steps[n], hide: hasMsg && /^Send the validated/.test(c.steps[n]?.text ?? '') }))
          .filter((r) => r.s && (!r.hide || guidance.stepNotes?.[r.n]));
        return rows.length ? (
          <div key={i} className="rm-lines">
            {rows.map(({ n, s, hide }) => (
              <p key={n} className="rm-text">
                {!hide && s.owner !== 'sav' && <span className="rm-muted">{getRole(s.owner)?.label} : </span>}
                {!hide && s.text}
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
            <dd>{e.infoToTransmit.map((k) => ({ [ID_FIRST_NAME]: vars.prenom, [ID_LAST_NAME]: vars.nom, [ID_EMAIL]: vars.email } as Record<string, string | undefined>)[k] || k).join(' · ')}</dd>
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
      case 'slack': {
      // Messages Slack pour #ecc-acces-payements (en anglais, comme l'équipe) ;
      // valeurs seules, sans libellé ; une ligne n'apparaît que si l'info est renseignée.
      const isLead = b.variant === 'lead';
      const fullName = [vars.prenom?.trim(), vars.nom?.trim()].filter(Boolean).join(' ');
      const details = (isLead ? [fullName, vars.whatsapp?.trim(), vars.email?.trim()] : [fullName, vars.email?.trim()]).filter(Boolean) as string[];
      const text = [
        "Hello team, I hope you're all doing great!",
        {
          lead: 'We have a new lead interested in our coaching program. Could you please reach out and assist him?',
          status: 'Could you please check the status of this member? He is not in the Whop database. If everything is in order, could you please send him a Whop invitation and share the invitation link with me, so I can send it to him directly?',
          refund: 'This member is asking for a refund. I’m passing his request on to you so that the right person can review it and get back to him.',
          invoice: 'This member is asking for an invoice. Could you please confirm his status and the amount he has paid, so I can put it on the invoice?',
          quote: 'This member is asking for a quote so that his course can be funded. Could you please confirm his status and the amount he is supposed to pay, so I can put it on the quote?',
          certificate: 'This member is asking for a training certificate. Could you please confirm his status, the amount he has paid and the date he became a member, so I can put them on the certificate?',
          kyc: 'This member is stuck during the identity verification (KYC). Could you please look into it and let me know how to unblock him?',
          removed: 'This member says his access was removed without explanation. Could you please check his status? If everything is in order, could you please send him a new Whop invitation and share the invitation link with me, so I can send it to him directly?',
          suspended: 'This member’s access is suspended because of a payment. Could you please check whether his payment has been received and, if so, update his status?',
          payment: 'This member reports a problem with his payment or payment plan. Could you please look into his situation and let me know if his status is in order?',
          transfer: 'This member says he has made his bank transfer. Could you please check that the payment has been received and let me know if his status is in order?',
        }[b.variant],
        details.join('\n'),
        'Thank you! 🙏',
      ]
        .filter(Boolean)
        .join('\n\n');
      const required = isLead ? 'whatsapp' : 'email';
      const fields: [string, string, string][] = [
        ['prenom', ID_FIRST_NAME, 'text'],
        ['nom', ID_LAST_NAME, 'text'],
        ['email', ID_EMAIL, 'email'],
        ...(isLead ? ([['whatsapp', L.slack.whatsapp, 'tel']] as [string, string, string][]) : []),
      ];
      return (
        <div key={i} className="rm-lead">
          <a className="rm-link" href={L.slack.channelUrl} target="_blank" rel="noreferrer">
            {L.slack.channel} ↗
          </a>
          <div className={`rm-fields ${isLead ? 'rm-fields-4' : ''}`}>
            {fields.map(([k, label, type]) => (
              <label key={k} className="field">
                <span className="field-label">
                  {label}
                  {k === required && <span className="req"> *</span>}
                </span>
                <input className="input" type={type} value={vars[k] ?? ''} onChange={(e) => setVar(k, e.target.value)} autoComplete="off" />
              </label>
            ))}
          </div>
          {/* Même bloc que les cartes de message : texte, puis bouton à droite, même espacement. */}
          <div className="rm-lead-msg">
            <TemplateText body={text} vars={{}} />
            <footer className="card-foot">
              <div className="card-foot-info" />
              <CopyButton text={text} label={L.slack.copy} disabled={!vars[required]?.trim()} disabledReason={isLead ? L.slack.needWhatsapp : L.slack.needEmail} />
            </footer>
          </div>
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
    .map((d, n) => {
      const hasMsg = d.blocks.some((b) => b.kind === 'message');
      // Le message Slack remplace l'encart d'escalade ; pour le lead, il remplace aussi le texte de l'étape.
      const slack = d.blocks.find((b) => b.kind === 'slack');
      const blocks = slack
        ? d.blocks.filter((b) => b.kind !== 'escalation' && !(b.kind === 'steps' && slack.kind === 'slack' && slack.variant === 'lead'))
        : d.blocks;
      return { key: `c${n}`, title: d.title, nodes: blocks.map((b, i) => renderBlock(b, i, hasMsg)).filter((x) => x !== null) };
    })
    .filter((d) => d.nodes.length > 0)
    .map((d) => ({ key: d.key, title: d.title, body: <>{d.nodes}</> }));

  function chooseKyc(v: 'ok' | 'ko') {
    setKyc(v);
    setActive(1);
  }

  const pre: Step[] = gated
    ? [
        {
          key: 'identify',
          title: L.identify.title,
          hint: needsKyc ? L.identify.kycHint : L.identify.hint,
          body: (
            <>
              <Checklist label={L.identify.label} items={identifyItems} checked={checked} onToggle={toggle} />
              {needsKyc && (
                <>
                  <div className="rm-sub rm-kyc-label">{L.kyc.label}</div>
                  <div className="rm-choice">
                    <button type="button" disabled={!identityDone} className={`btn ${kyc === 'ok' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => chooseKyc('ok')}>
                      {L.kyc.ok}
                    </button>
                    <button type="button" disabled={!identityDone} className={`btn ${kyc === 'ko' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => chooseKyc('ko')}>
                      {L.kyc.ko}
                    </button>
                  </div>
                  {kyc && (
                    <button type="button" className="rm-link" onClick={() => { setKyc(null); setActive(0); }}>
                      {L.kyc.change}
                    </button>
                  )}
                </>
              )}
            </>
          ),
        },
      ]
    : [];

  const kycTarget = getCase(KYC_CASE_ID);
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
  const rest: Step[] =
    needsKyc && kyc === 'ko'
      ? [kycKo]
      : content; // pas de bouton « Continue » : toutes les étapes sont visibles
  const list = [...pre, ...rest];
  const activeIdx = Math.min(active, list.length - 1);
  const activeKey = list[activeIdx]?.key;

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
          // Seul verrou restant : tant que le KYC n'est pas indiqué, la suite reste grisée.
          const state = i >= pre.length && needsKyc && kyc === null ? 'is-future' : 'is-active';
          return (
            <li
              key={s.key}
              ref={(el) => {
                refs.current[s.key] = el;
              }}
              className={`rm-step ${state} ${i === list.length - 1 ? 'is-last' : ''}`}
            >
              <span className="rm-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="rm-main">
                <h2 className="rm-title">{s.title}</h2>
                {s.hint && <p className="rm-hint">{s.hint}</p>}
                {s.body && (
                  <div className="rm-body" inert={state === 'is-future'}>
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
