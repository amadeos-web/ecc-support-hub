import { useMemo, useState } from 'react';
import { categories, getCase, handlingInfo, supportCases } from '../data';
import { href } from '../lib/router';
import { searchCases } from '../lib/caseSearch';
import { CaseSheet } from '../components/CaseSheet';
import { EmptyState } from '../components/ui';


/** Page principale : « Que demande le membre ? » → cas → fiche opérationnelle. */
export function TreatRequestPage({ caseId }: { caseId?: string }) {
  const selected = getCase(caseId);
  if (selected) {
    return (
      <div className="page page-case">
        <a className="back-link" href={href('accueil')}>
          ← Autre demande
        </a>
        <CaseSheet key={selected.id} supportCase={selected} />
      </div>
    );
  }
  return <TreatHome />;
}

function TreatHome() {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => searchCases(supportCases, query), [query]);
  const ranked = query.trim() !== '';
  const sections = categories
    .map((cat) => ({ cat, cases: matches.filter((c) => c.category === cat.id) }))
    .filter((s) => s.cases.length > 0);

  return (
    <div className="page treat-home">
      <section className="treat-hero">
        <h1>Que demande le membre ?</h1>
        <div className="big-search">
          <span aria-hidden>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher : accès Circle, facture, paiement, formation, Whop…"
            aria-label="Que demande le membre ?"
            autoFocus
          />
          {query && (
            <button type="button" className="big-search-clear" onClick={() => setQuery('')} aria-label="Effacer">
              ✕
            </button>
          )}
        </div>
      </section>

      {sections.length === 0 && (
        <EmptyState>
          <p>Aucun cas ne correspond{query ? ` à « ${query} »` : ''}.</p>
          <a className="btn btn-secondary" href={href('traiter', 'cas-membre-non-identifie')}>
            Demander les informations au membre
          </a>
        </EmptyState>
      )}

      {sections.map(({ cat, cases }) => (
        <section key={cat.id} className="cs-section">
          <h2 className="cs-section-head">
            <span className="cs-section-title">
              {cat.icon} {cat.label}
            </span>
            <span className="cs-section-count">
              {cases.length} cas
            </span>
          </h2>
          <p className="cs-section-hint">{cat.hint}</p>
          <ul className="case-list">
            {cases.map((c) => (
              <li key={c.id}>
                <a href={href('traiter', c.id)} className={`case-line ${ranked ? 'is-hit' : ''}`}>
                  <span className="case-line-title">{c.shortTitle}</span>
                  <span className="case-line-status">{c.handling && handlingInfo[c.handling].short}</span>
                  <span className="case-line-arrow" aria-hidden>
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
