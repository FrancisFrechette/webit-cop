'use client';

import type { Organization } from '@/lib/domain';
import { getAuthHeaders } from '@/lib/http';
import { useCallback, useEffect, useState } from 'react';

export function useCurrentOrg(): {
  org: Organization | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrg = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/orgs/current', {
        headers: { ...headers },
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        setOrg(null);
        setError('Non autorisé');
        return;
      }
      if (res.status === 404) {
        setOrg(null);
        setError('Organisation non trouvée');
        return;
      }
      if (!res.ok) {
        setOrg(null);
        setError('Erreur au chargement');
        return;
      }
      const data = (await res.json()) as Organization;
      setOrg(data);
    } catch {
      setOrg(null);
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  return { org, loading, error, refetch: fetchOrg };
}
