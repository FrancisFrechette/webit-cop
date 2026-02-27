'use client';

import type { Page } from '@/lib/domain';
import { getAuthHeaders } from '@/lib/http';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import DashboardShell from '@/app/(dashboard)/DashboardShell';

function PagesListPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/orgs/current/pages', {
        headers: { ...headers },
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        setError("Vous n'êtes pas autorisé à voir cette liste.");
        setPages([]);
        return;
      }
      if (!res.ok) {
        setError('Erreur au chargement des pages.');
        return;
      }
      const data = (await res.json()) as Page[];
      setPages(data);
    } catch {
      setError('Erreur réseau.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRowClick = useCallback(
    (id: string) => {
      router.push(`/pages/${id}/edit`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="layout-container py-12">
        <p className="text-webit-fg-muted">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="layout-container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Pages</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => router.push('/pages/new/edit')}
        >
          Nouvelle page
        </button>
      </div>

      {error && <p className="mb-4 text-webit-accent-rose">{error}</p>}

      <div className="panel">
        <p className="text-webit-fg-muted text-sm">
          {pages.length === 0 ? 'Aucune page.' : `${pages.length} page${pages.length !== 1 ? 's' : ''}`}
        </p>
      </div>
    </div>
  );
}

export default function PagesPage() {
  return (
    <DashboardShell>
      <PagesListPage />
    </DashboardShell>
  );
}
