import { categories, getCase, supportCases } from '../data';
import { href } from '../lib/router';
import { CaseSheet } from '../components/CaseSheet';

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
  const sections = categories
    .map((cat) => ({ cat, cases: supportCases.filter((c) => c.category === cat.id) }))
    .filter((s) => s.cases.length > 0);

  return (
    <div className="page treat-home">
      <section className="treat-hero">
        <h1>Que demande le membre ?</h1>
      </section>

      {sections.map(({ cat, cases }) => (
        <section key={cat.id} className="cs-section">
          <h2 className="cs-section-head">
            <span className="cs-section-title">
              {cat.icon} {cat.label}
            </span>
            <span className="cs-section-count">{cases.length} cas</span>
          </h2>
          <p className="cs-section-hint">{cat.hint}</p>
          <ul className="case-list">
            {cases.map((c) => (
              <li key={c.id}>
                <a href={href('traiter', c.id)} className="case-line">
                  <span className="case-line-title">{c.shortTitle}</span>
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
