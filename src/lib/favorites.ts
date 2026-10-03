import { useCallback, useState } from 'react';

/** Favoris stockés dans le navigateur (localStorage), par liste. */
export function useFavorites(key: string) {
  const storageKey = `ecc-hub:favoris:${key}`;
  const [ids, setIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as string[];
    } catch {
      return [];
    }
  });
  const toggle = useCallback(
    (id: string) =>
      setIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* stockage indisponible : favoris gardés pour la session */
        }
        return next;
      }),
    [storageKey],
  );
  return { ids, isFavorite: (id: string) => ids.includes(id), toggle };
}
