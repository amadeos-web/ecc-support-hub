import { useMemo, useState } from 'react';
import { categories, getCase, supportCases, type CategoryId } from '../data';
import { href } from '../lib/router';
import { searchCases } from '../lib/caseSearch';
import { CaseSheet } from '../components/CaseSheet';
import { EmptyState, StatusBadge } from '../components/ui';

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

  const results = useMemo(() => {
    const base = category ? supportCases.filter((c) => c.category === category) : supportCases;
    return searchCases(base, query);
  }, [query, category]);
  const showResults = query.trim() !== '' || category !== null;
  const activeCategory = categories.find((c) => c.id === category);

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

      {!showResults && (
        <section className="cat-grid">
          {categories.map((cat) => {
            const n = supportCases.filter((c) => c.category === cat.id).length;
            return (
              <button key={cat.id} type="button" className={`cat-card ${n === 0 ? 'is-empty' : ''}`} onClick={() => setCategory(cat.id)}>
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
                <span className="cat-hint">{cat.hint}</span>
                <span className="cat-count">{n === 0 ? 'Aucun cas pour l’instant' : `${n} cas`}</span>
              </button>
            );
          })}
        </section>
      )}

      {showResults && (
        <section className="results">
          <div className="results-head">
            <h2>
              {activeCategory ? `${activeCategory.icon} ${activeCategory.label}` : 'Résultats'}
              <span className="muted"> · {results.length} cas</span>
            </h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setCategory(null);
                setQuery('');
              }}
            >
              ← Toutes les catégories
            </button>
          </div>
          {results.length === 0 ? (
            <EmptyState>
              <p>Aucun cas ne correspond{query ? ` à « ${query} »` : ''}.</p>
              <a className="btn btn-secondary" href={href('traiter', 'cas-membre-non-identifie')}>
                Demander les informations au membre
              </a>
            </EmptyState>
          ) : (
            <ul className="case-rows">
              {results.map((c) => (
                <li key={c.id}>
                  <a href={href('traiter', c.id)} className="case-row">
                    <span className="case-row-title">{c.shortTitle}</span>
                    <span className="case-row-problem">{c.problem}</span>
                    <span className="case-row-meta">
                      <StatusBadge supportCase={c} />
                      {c.frequency !== undefined && <span className="muted small">{c.frequency} tickets</span>}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
