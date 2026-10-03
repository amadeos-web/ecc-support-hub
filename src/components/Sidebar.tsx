import { href, type PageId } from '../lib/router';

const NAV: { id: PageId; label: string; icon: string }[] = [
  { id: 'accueil', label: 'Traiter une demande', icon: '➤' },
  { id: 'documents', label: 'Générer un document', icon: '⎙' },
];

export function Sidebar({ current }: { current: PageId }) {
  return (
    <aside className="sidebar">
      <a className="brand" href={href('accueil')}>
        <span className="brand-mark">ECC</span>
        <span className="brand-name">Support Hub</span>
      </a>
      <nav className="nav">
        {NAV.map((n) => (
          <a key={n.id} href={href(n.id)} className={`nav-item ${current === n.id || (n.id === 'accueil' && current === 'traiter') ? 'is-active' : ''} ${n.id === 'accueil' ? 'nav-primary' : ''}`}>
            <span className="nav-icon" aria-hidden>
              {n.icon}
            </span>
            {n.label}
          </a>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span className="muted small">Outil interne · local · aucun service connecté</span>
      </div>
    </aside>
  );
}
