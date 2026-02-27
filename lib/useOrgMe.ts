'use client';

import { getAuthHeaders } from '@/lib/http';
import { useCallback, useEffect, useState } from 'react';
import type { OrgRole } from '@/lib/domain';

export interface OrgMe {
  orgRole: OrgRole;
  canManageMembers: boolean;
  userDisplayName?: string | null;
  userEmail?: string | null;
}

export function useOrgMe(): {
  me: OrgMe | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [me, setMe] = useState<OrgMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/orgs/current/me', {
        headers: { ...headers },
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        setMe(null);
        setError('Non autorisé');
        return;
      }
      if (!res.ok) {
        setMe(null);
        setError('Erreur au chargement');
        return;
      }
      const data = await res.json();
      setMe(data);
    } catch {
      setMe(null);
      setError('Erreur au chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return { me, loading, error, refetch: fetchMe };
}
