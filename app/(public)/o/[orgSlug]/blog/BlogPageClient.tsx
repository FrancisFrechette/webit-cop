'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Article, Category, Tag } from '@/lib/domain';
import { BlogArticleList } from './BlogArticleList';
import { useSearchHealth } from './useSearchHealth';

const DEBOUNCE_MS = 400;

type AuthorOption = { id: string; name: string };

type SearchV2Item = {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt?: string;
  url: string;
  locale?: string;
  highlights?: { title?: string; excerpt?: string; contentText?: string };
};

function toArticleFromSearchItem(item: SearchV2Item, orgSlug: string): Article {
  const title = item.highlights?.title ?? item.title;
  const excerpt = item.highlights?.excerpt ?? item.excerpt ?? '';
  return {
    id: item.id,
    orgId: '',
    type: 'article',
    status: 'published',
    current: {
      title,
      slug: item.slug,
      excerpt,
      blocks: [],
    },
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
    version: 1,
    locale: item.locale ?? 'fr-CA',
    categoryId: null,
    tagIds: [],
    authorId: null,
    authorName: null,
  };
}

type Props = {
  orgSlug: string;
  initialArticles: Article[];
  categoryMap: Record<string, Category>;
  tagMap: Record<string, Tag>;
  categories: Category[];
  tags: Tag[];
  authorOptions: AuthorOption[];
  filterLabel: string | null;
  currentLocale: string;
  supportedLocales: string[];
};

export function BlogPageClient({
  orgSlug,
  initialArticles,
  categoryMap,
  tagMap,
  categories,
  tags,
  authorOptions,
  filterLabel,
  currentLocale,
  supportedLocales = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') ?? '';
  const tagParam = searchParams.get('tag') ?? '';
  const authorParam = searchParams.get('author') ?? '';
  const localeParam = searchParams.get('locale') ?? '';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Article[] | null>(null);
  const [searchTotal, setSearchTotal] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  /** True quand on utilise le fallback v1 (recherche avancée indisponible). */
  const [searchV2Unavailable, setSearchV2Unavailable] = useState(false);
  const searchHealth = useSearchHealth();

  const hasFilters = Boolean(categoryParam || tagParam || authorParam);
  const showEmptyFilters = hasFilters && initialArticles.length === 0 && !searchQuery;
  const resetHref = `/o/${orgSlug}/blog`;

  const fetchSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSearchResults(null);
        setSearchTotal(null);
        setSearchV2Unavailable(false);
        return;
      }
      setSearchLoading(true);
      setSearchV2Unavailable(false);
      const params = new URLSearchParams();
      params.set('q', q);
      params.set('limit', '30');
      if (currentLocale) params.set('locale', currentLocale);
      if (categoryParam) params.set('category', categoryParam);
      if (tagParam) params.set('tag', tagParam);
      if (authorParam) params.set('author', authorParam);

      try {
        const v2Res = await fetch(
          `/api/public/orgs/${encodeURIComponent(orgSlug)}/search?${params.toString()}`
        );
        if (v2Res.ok) {
          const data = await v2Res.json();
          const items = Array.isArray(data.items) ? data.items : [];
          setSearchTotal(typeof data.total === 'number' ? data.total : items.length);
          setSearchResults(
            items.map((item: SearchV2Item) => toArticleFromSearchItem(item, orgSlug))
          );
          setSearchLoading(false);
          return;
        }
      } catch {
        // v2 failed, fallback to v1
      }
      setSearchV2Unavailable(true);
      try {
        const v1Res = await fetch(
          `/api/public/orgs/${encodeURIComponent(orgSlug)}/articles/search?${params.toString()}`
        );
        if (!v1Res.ok) {
          setSearchResults([]);
          setSearchTotal(0);
          return;
        }
        const data = await v1Res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        setSearchResults(items);
        setSearchTotal(items.length);
      } catch {
        setSearchResults([]);
        setSearchTotal(0);
      } finally {
        setSearchLoading(false);
      }
    },
    [orgSlug, currentLocale, categoryParam, tagParam, authorParam]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const minSearchLen = 2;
  useEffect(() => {
    if (searchQuery.length >= minSearchLen) fetchSearch(searchQuery);
    else if (searchQuery.length > 0) setSearchResults([]);
    else setSearchResults(null);
  }, [searchQuery, fetchSearch]);

  const articles = searchResults !== null ? searchResults : initialArticles;
  const isSearchMode = searchQuery.length > 0;

  const buildQuery = useCallback(
    (updates: { category?: string; tag?: string; author?: string; locale?: string }) => {
      const p = new URLSearchParams(searchParams.toString());
      if (updates.category !== undefined) (updates.category ? p.set('category', updates.category) : p.delete('category'));
      if (updates.tag !== undefined) (updates.tag ? p.set('tag', updates.tag) : p.delete('tag'));
      if (updates.author !== undefined) (updates.author ? p.set('author', updates.author) : p.delete('author'));
      if (updates.locale !== undefined) (updates.locale ? p.set('locale', updates.locale) : p.delete('locale'));
      const s = p.toString();
      return s ? `?${s}` : '';
    },
    [searchParams]
  );

  return (
    <main
      className="layout-container py-12"
      data-search-provider={searchHealth?.provider}
      data-search-status={searchHealth?.status}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white">Blog</h1>
        {supportedLocales.length > 1 && (
          <nav className="flex gap-2 text-sm" aria-label="Choisir la langue">
            {supportedLocales.map((loc) => (
              <Link
                key={loc}
                href={`/o/${orgSlug}/blog${buildQuery({ locale: loc })}`}
                className={
                  (localeParam || currentLocale) === loc
                    ? 'font-medium text-webit-accent'
                    : 'text-webit-fg-muted hover:text-white'
                }
              >
                {loc}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Recherche */}
      <div className="mb-6">
        <label htmlFor="blog-search" className="sr-only">
          Rechercher des articles
        </label>
        <input
          id="blog-search"
          type="search"
          placeholder="Rechercher dans les articles…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full max-w-md rounded border border-webit-panel-border bg-slate-800/60 px-4 py-2 text-white placeholder:text-webit-fg-muted focus:border-webit-accent focus:outline-none"
          aria-describedby={isSearchMode ? 'search-result-count' : undefined}
        />
      </div>

      {/* Barre de filtres */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href={resetHref}
          className={`rounded border px-3 py-1.5 text-sm ${
            !hasFilters
              ? 'border-webit-accent bg-webit-accent/20 text-white'
              : 'border-webit-panel-border bg-slate-800/60 text-white hover:bg-slate-700/60'
          }`}
        >
          Tous
        </Link>
        {categories.map((c) => {
          const isActive = categoryParam === c.slug;
          return (
            <Link
              key={c.id}
              href={`/o/${orgSlug}/blog${buildQuery({ category: isActive ? '' : c.slug })}`}
              className={`rounded border px-3 py-1.5 text-sm ${
                isActive
                  ? 'border-webit-accent bg-webit-accent/20 text-white'
                  : 'border-webit-panel-border bg-slate-800/60 text-white hover:bg-slate-700/60'
              }`}
            >
              {c.name}
            </Link>
          );
        })}
        {tags.map((t) => {
          const isActive = tagParam === t.slug;
          return (
            <Link
              key={t.id}
              href={`/o/${orgSlug}/blog${buildQuery({ tag: isActive ? '' : t.slug })}`}
              className={`rounded border px-3 py-1.5 text-sm ${
                isActive
                  ? 'border-webit-accent bg-webit-accent/20 text-white'
                  : 'border-webit-panel-border bg-slate-800/60 text-white hover:bg-slate-700/60'
              }`}
            >
              {t.name}
            </Link>
          );
        })}
        {authorOptions.length > 0 && (
          <select
            value={authorParam}
            onChange={(e) => {
              router.push(`/o/${orgSlug}/blog${buildQuery({ author: e.target.value || undefined })}`);
            }}
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

      {filterLabel && !isSearchMode && (
        <p className="mb-4 text-webit-fg-muted">{filterLabel}</p>
      )}

      {isSearchMode && (
        <p id="search-result-count" className="mb-4 text-webit-fg-muted" role="status">
          {searchQuery.length < minSearchLen
            ? `Saisissez au moins ${minSearchLen} caractères pour lancer la recherche.`
            : searchLoading
              ? 'Recherche…'
              : (searchResults?.length ?? 0) === 0
                ? `Aucun résultat pour « ${searchQuery} ».`
                : `${searchTotal ?? searchResults?.length ?? 0} résultat${(searchTotal ?? searchResults?.length ?? 0) > 1 ? 's' : ''} pour « ${searchQuery} ».`}
        </p>
      )}

      {isSearchMode && searchV2Unavailable && !searchLoading && (
        <p className="mb-2 text-xs text-webit-fg-muted" role="status">
          Recherche avancée temporairement indisponible.
        </p>
      )}

      {showEmptyFilters && (
        <div className="mb-6 rounded border border-webit-panel-border bg-slate-800/40 p-6 text-center">
          <p className="text-webit-fg-muted">Aucun article trouvé avec ces filtres.</p>
          <Link
            href={resetHref}
            className="mt-3 inline-block rounded bg-webit-accent/20 px-4 py-2 text-sm font-medium text-white hover:bg-webit-accent/30"
          >
            Réinitialiser les filtres
          </Link>
        </div>
      )}

      {!showEmptyFilters && (
        <>
          {articles.length === 0 && !isSearchMode ? (
            <p className="text-webit-fg-muted">Aucun article publié pour le moment.</p>
          ) : articles.length === 0 && isSearchMode && !searchLoading ? (
            <p className="text-webit-fg-muted">Aucun résultat pour cette recherche.</p>
          ) : (
            <BlogArticleList
              orgSlug={orgSlug}
              articles={articles}
              categoryMap={categoryMap}
              tagMap={tagMap}
              categories={categories}
            />
          )}
        </>
      )}
    </main>
  );
}
