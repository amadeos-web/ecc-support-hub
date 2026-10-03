import { useMemo, useState } from 'react';
import { caseStatus, categories, getCase, getCategory, statusInfo, supportCases, type CategoryId } from '../data';
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
  const [category, setCategory] = useState<CategoryId | null>(null);

  const matches = useMemo(() => searchCases(supportCases, query), [query]);
  const results = category ? matches.filter((c) => c.category === category) : matches;
  const countFor = (id: CategoryId) => matches.filter((c) => c.category === id).length;

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

      <div className="filter-bar" role="group" aria-label="Filtrer par catégorie">
        <button type="button" className={`filter-chip ${category === null ? 'is-active' : ''}`} onClick={() => setCategory(null)}>
          Tous <span className="filter-count">{matches.length}</span>
        </button>
        {categories.map((cat) => {
          const n = countFor(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              className={`filter-chip ${category === cat.id ? 'is-active' : ''} ${n === 0 ? 'is-empty' : ''}`}
              onClick={() => setCategory(category === cat.id ? null : cat.id)}
            >
              {cat.icon} {cat.filterLabel} <span className="filter-count">{n}</span>
            </button>
          );
        })}
      </div>

      {results.length === 0 ? (
        <EmptyState>
          <p>Aucun cas ne correspond{query ? ` à « ${query} »` : ''}.</p>
          <a className="btn btn-secondary" href={href('traiter', 'cas-membre-non-identifie')}>
            Demander les informations au membre
          </a>
        </EmptyState>
      ) : (
        <ul className="case-grid">
          {results.map((c) => {
            const cat = getCategory(c.category);
            return (
              <li key={c.id}>
                <a href={href('traiter', c.id)} className="case-tile">
                  <span className="case-tile-icon" aria-hidden>
                    {cat?.icon}
                  </span>
                  <span className="case-tile-body">
                    <span className="case-tile-title">{c.shortTitle}</span>
                    <span className="case-tile-cat">{cat?.label}</span>
                  </span>
                  <span className="case-tile-status" title={statusInfo[caseStatus(c)].label} aria-label={statusInfo[caseStatus(c)].label}>
                    {statusInfo[caseStatus(c)].icon}
                  </span>
                  <span className="case-tile-arrow" aria-hidden>
                    →
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
