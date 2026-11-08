import { useState, type ReactNode } from 'react';
import {
  caseStatus,
  categoryLabel,
  getRole,
  handlingInfo,
  statusInfo,
  type SupportCase,
  validationInfo,
  type CategoryId,
  type DataSource,
  type Handling,
  type RoleId,
  type ValidationStatus,
} from '../data';
import { copyText } from '../lib/clipboard';

export function DemoBadge({ source = 'demo' }: { source?: DataSource }) {
  if (source === 'template-sav-ecc')
    return (
      <span className="badge badge-source" title="From the official “TEMPLATE SAV ECC” document">
        Template SAV ECC
      </span>
    );
  if (source === 'instruction-ecc')
    return (
      <span className="badge badge-source" title="Rule given explicitly by the ECC team">
        ECC instruction
      </span>
    );
  if (source === 'freshdesk')
    return (
      <span className="badge badge-source" title="Based on the Freshdesk history">
        Freshdesk
      </span>
    );
  if (source !== 'demo') return null;
  return (
    <span className="badge badge-demo" title="Fictional demo data">
      Demo
    </span>
  );
}

export function HandlingBadge({ handling, long = false }: { handling?: Handling; long?: boolean }) {
  if (!handling)
    return (
      <span className="badge badge-handling h-unknown" title="Who needs to step in: not determined">
        {long ? 'Who needs to step in: to validate' : 'Owner to validate'}
      </span>
    );
  const h = handlingInfo[handling];
  return (
    <span className={`badge badge-handling h-${handling}`} title={h.description}>
      {long ? h.label : h.short}
    </span>
  );
}

/** Statut principal d'un cas : SAV DIRECT / À REMONTER / À VALIDER / NE PAS TRAITER. */
export function StatusBadge({ supportCase, large = false }: { supportCase: Pick<SupportCase, 'validation' | 'handling'>; large?: boolean }) {
  const st = caseStatus(supportCase);
  const info = statusInfo[st];
  return (
    <span className={`badge badge-status st-${st} ${large ? 'is-large' : ''}`} title={info.description}>
      {info.label}
    </span>
  );
}

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  if (status === 'valide') return null;
  return (
    <span className={`badge badge-validation v-${status}`} title={validationInfo[status].description}>
      {status === 'a-valider' ? '⚠ TO VALIDATE' : validationInfo[status].label}
    </span>
  );
}

export function OwnerBadge({ owner }: { owner: RoleId }) {
  return <span className={`owner owner-${owner}`}>{getRole(owner)?.label ?? owner}</span>;
}

export function CategoryTag({ id }: { id: CategoryId }) {
  return <span className="tag">{categoryLabel(id)}</span>;
}

export function CopyButton({
  text,
  label = 'Copy',
  className = 'btn btn-primary',
  disabled = false,
  disabledReason,
}: {
  text: string;
  label?: string;
  className?: string;
  /** Empêche la copie (ex. variable obligatoire non renseignée). */
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [state, setState] = useState<'idle' | 'ok' | 'error'>('idle');
  const onClick = async () => {
    if (disabled) return;
    const ok = await copyText(text);
    setState(ok ? 'ok' : 'error');
    window.setTimeout(() => setState('idle'), 1800);
  };
  return (
    <button
      type="button"
      className={`${className} ${state === 'ok' ? 'is-copied' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      aria-live="polite"
    >
      {state === 'ok' ? 'Copied ✓' : state === 'error' ? 'Copy failed' : label}
    </button>
  );
}

export function StarButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`star ${active ? 'is-active' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={active ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={active}
    >
      {active ? '★' : '☆'}
    </button>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}

export function Block({ title, children, tone }: { title: string; children: ReactNode; tone?: 'warn' | 'internal' }) {
  return (
    <section className={`block ${tone ? `block-${tone}` : ''}`}>
      <h3 className="block-title">{title}</h3>
      {children}
    </section>
  );
}

export function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="muted small">—</p>;
  return (
    <ul className="bullets">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

export function ConditionList({ items }: { items: { if: string; then: string }[] }) {
  if (items.length === 0) return <p className="muted small">—</p>;
  return (
    <ul className="conditions">
      {items.map((c) => (
        <li key={c.if}>
          <span className="cond-if">If</span> {c.if}
          <span className="cond-arrow">→</span>
          <span className="cond-then">{c.then}</span>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
