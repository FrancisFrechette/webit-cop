/**
 * Hook optionnel pour connaître le provider de recherche (Meilisearch / local).
 * Usage dev-oriented : data-search-provider sur le conteneur, pas d’UX visible pour les visiteurs.
 */

import { useEffect, useState } from 'react';

export type SearchHealth = {
  provider: 'meilisearch' | 'local';
  status: 'ok' | 'degraded' | 'error';
  details?: string;
} | null;

export function useSearchHealth(): SearchHealth {
  const [health, setHealth] = useState<SearchHealth>(null);

  useEffect(() => {
    fetch('/api/search/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth({
          provider: data.provider ?? 'local',
          status: data.status ?? 'ok',
          details: data.details,
        });
      })
      .catch(() => setHealth({ provider: 'local', status: 'error' }));
  }, []);

  return health;
}
