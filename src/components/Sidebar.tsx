import { href, type PageId } from '../lib/router';
import eccLogo from '../assets/ecc-logo-mercure.png';

const NAV: { id: PageId; label: string; icon: string }[] = [
  { id: 'accueil', label: 'Handle a request', icon: '➤' },
  { id: 'documents', label: 'Generate a document', icon: '⎙' },
  { id: 'ressources', label: 'Resources', icon: '▤' },
];

export function Sidebar({ current }: { current: PageId }) {
  return (
    <aside className="sidebar">
      <a className="brand" href={href('accueil')}>
        <img className="brand-logo" src={eccLogo} alt="Ecommerce Capital Club" />
        <span className="brand-text">
          <span className="brand-name">Ecommerce Capital Club</span>
          <span className="brand-sub">Support Hub</span>
        </span>
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
        <span className="muted small">Internal tool · local · no connected service</span>
      </div>
    </aside>
  );
}
