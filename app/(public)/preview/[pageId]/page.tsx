'use client';

import type { Page } from '@/lib/domain';
import { getAuthHeaders } from '@/lib/http';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RenderBlocks } from '../../_components/blocks/RenderBlocks';

export default function PreviewPageClient() {
  const params = useParams();
  const router = useRouter();
  const pageId = params?.pageId as string | undefined;
  const [page, setPage] = useState<Page | null>(null);
  const [status, setStatus] = useState<'loading' | 'not-found' | 'ok'>('loading');

  useEffect(() => {
    if (!pageId) {
      setStatus('not-found');
      return;
    }

    let cancelled = false;

    async function load() {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/orgs/current/pages/preview/${pageId}`, {
        credentials: 'include',
        headers: { ...authHeaders },
      });

      if (cancelled) return;

      if (res.status === 401) {
        router.replace('/login');
        return;
      }

      if (res.status === 404 || !res.ok) {
        setStatus('not-found');
        return;
      }

      const data = (await res.json()) as Page;
      setPage(data);
      setStatus('ok');
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [pageId, router]);

  if (status === 'loading') {
    return (
      <main className="layout-container py-16 text-center">
        <p className="text-webit-fg-muted">Chargement de la preview…</p>
      </main>
    );
  }

  if (status === 'not-found' || !page) {
    return (
      <main className="layout-container py-16 text-center">
        <h1 className="text-2xl font-semibold text-white">Page introuvable</h1>
        <p className="mt-2 text-webit-fg-muted">
          Cette page n’existe pas ou vous n’y avez pas accès.
        </p>
      </main>
    );
  }

  const { title, blocks } = page.current;

  return (
    <main>
      <div className="sticky top-0 z-10 flex items-center justify-center gap-2 border-b border-amber-500/50 bg-amber-500/20 py-2 text-sm font-medium text-amber-200">
        Preview – non publié
      </div>
      <article>
        <header className="layout-container pt-8 pb-4">
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
        </header>
        <RenderBlocks blocks={blocks ?? []} />
      </article>
    </main>
  );
}
