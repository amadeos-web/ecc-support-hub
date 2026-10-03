import { useEffect, useState } from 'react';

/** Routage minimal par hash : #/page/param — aucune dépendance. */
export type PageId = 'accueil' | 'traiter' | 'documents';

/** Les anciennes adresses (process, templates, escalades) renvoient vers « Traiter une demande ». */
const PAGES: PageId[] = ['accueil', 'traiter', 'documents'];

export interface Route {
  page: PageId;
  param?: string;
}

export function parseHash(hash: string): Route {
  const [rawPage, param] = hash.replace(/^#\/?/, '').split('/');
  const page = (PAGES as string[]).includes(rawPage) ? (rawPage as PageId) : 'accueil';
  return { page, param: param ? decodeURIComponent(param) : undefined };
}

export const href = (page: PageId, param?: string) =>
  `#/${page}${param ? `/${encodeURIComponent(param)}` : ''}`;

export const navigate = (page: PageId, param?: string) => {
  window.location.hash = href(page, param);
};

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
