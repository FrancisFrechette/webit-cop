'use client';

import type { Article, ContentStatus } from '@/lib/domain';
import { getAuthHeaders } from '@/lib/http';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContentList } from '../_components/ContentList';

type StatusFilter = ContentStatus | 'all';

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'preview', label: 'Preview' },
  { value: 'published', label: 'Publiés' },
  { value: 'archived', label: 'Archivés' },
];

export default function ArticlesListPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateDirection, setDateDirection] = useState<'asc' | 'desc'>('desc');
  const [authorId, setAuthorId] = useState<string>('');

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('orderBy', 'publishedAt');
      params.set('direction', dateDirection);
      if (authorId) params.set('author', authorId);
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/orgs/current/articles?${params.toString()}`, {
        headers: { ...headers },
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        setError('Vous n’êtes pas autorisé à voir cette liste.');
        setArticles([]);
        return;
      }
      if (!res.ok) {
        setError('Erreur au chargement des articles.');
        return;
      }
      const data = (await res.json()) as { items: Article[]; nextCursor?: string };
      setArticles(data.items ?? []);
    } catch {
      setError('Erreur réseau.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, dateDirection, authorId]);

  useEffect(() => {
    load();
  }, [load]);

  const authorOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; name: string }[] = [];
    for (const a of articles) {
      const id = a.authorId ?? '';
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, name: a.authorName ?? a.authorId ?? 'Auteur' });
    }
    return out;
  }, [articles]);

  const publishedCount = useMemo(
    () => articles.filter((a) => a.status === 'published').length,
    [articles]
  );

  const handleRowClick = useCallback(
    (id: string) => {
      router.push(`/articles/${id}/edit`);
    },
    [router]
  );

  const toggleDateSort = useCallback(() => {
    setDateDirection((d) => (d === 'desc' ? 'asc' : 'desc'));
  }, []);

  if (isLoading && articles.length === 0) {
    return (
      <div className="layout-container py-12">
        <p className="text-webit-fg-muted">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="layout-container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Articles</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => router.push('/articles/new/edit')}
        >
          Nouvel article
        </button>
      </div>

      {error && (
        <p className="mb-4 text-webit-accent-rose">{error}</p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-webit-fg-muted">
          {articles.length} article{articles.length !== 1 ? 's' : ''}
          {publishedCount !== articles.length && (
            <> · {publishedCount} publié{publishedCount !== 1 ? 's' : ''}</>
          )}
        </span>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={
                statusFilter === opt.value
                  ? 'btn-primary text-sm'
                  : 'btn-secondary text-sm'
              }
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {authorOptions.length > 0 && (
          <select
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            className="rounded border border-webit-panel-border bg-slate-800/60 px-3 py-1.5 text-sm text-white focus:border-webit-accent focus:outline-none"
            aria-label="Filtrer par auteur"
          >
            <option value="">Tous les auteurs</option>
            {authorOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || a.id}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* TODO: brancher pagination nextCursor (Load more) quand nombre d'articles > 50. */}
      <div className="panel">
        <ContentList
          articles={articles}
          onRowClick={handleRowClick}
          onDateSortClick={toggleDateSort}
          dateSortDirection={dateDirection}
        />
      </div>
    </div>
  );
}
